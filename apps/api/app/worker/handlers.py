from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.agents.execution_agent import (
    run_asset_generation_agent,
    run_email_personalization_agent,
    run_execution_plan_agent,
)
from app.agents.positioning_agent import run_positioning_agent
from app.agents.research_agent import run_research_agent
from app.agents.shared_context import build_project_context
from app.integrations.backboard_client import BackboardClient
from app.integrations.google_media_client import GoogleMediaClient
from app.integrations.resend_client import ResendClient
from app.models.approval import Approval
from app.models.execution import Asset, Contact, LaunchPlan, LaunchTask, OutboundBatch, OutboundMessage
from app.models.positioning import PositioningVersion
from app.models.project import AgentRuntime, Project
from app.models.research import Competitor, OpportunityWedge, PainPointCluster, ResearchRun
from app.services.audit_service import AuditService
from app.services.memory_service import upsert_project_memory


class WorkerHandlers:
    def __init__(self, db: Session):
        self.db = db
        self.backboard = BackboardClient()
        self.google = GoogleMediaClient()
        self.resend = ResendClient()
        self.audit = AuditService(db)

    def handle(self, job_type: str, project_id, payload: dict) -> dict:
        handlers = {
            "project.bootstrap": lambda: self.project_bootstrap(project_id),
            "research.run": lambda: self.research_run(project_id, payload),
            "positioning.run": lambda: self.positioning_run(project_id, payload),
            "execution.plan": lambda: self.execution_plan(project_id, payload),
            "execution.generate_assets": lambda: self.execution_generate_assets(project_id, payload),
            "execution.prepare_email_batch": lambda: self.execution_prepare_email_batch(project_id, payload),
            "execution.send_email_batch": lambda: self.execution_send_email_batch(project_id, payload),
            "creative.render_video": lambda: self.creative_render_video(project_id, payload),
        }
        handler = handlers.get(job_type)
        if handler:
            return handler()
        raise ValueError(f"Unsupported job type: {job_type}")

    def project_bootstrap(self, project_id) -> dict:
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")

        runtime = self.db.query(AgentRuntime).filter(AgentRuntime.project_id == project_id).first()
        if not runtime:
            ids = self.backboard.create_project_runtime(project.name)
            runtime = AgentRuntime(
                project_id=project_id,
                backboard_assistant_id=ids["assistant_id"],
                research_thread_id=ids["research_thread_id"],
                positioning_thread_id=ids["positioning_thread_id"],
                execution_thread_id=ids["execution_thread_id"],
            )
            self.db.add(runtime)

        seed_entries = [
            ("project_name", {"value": project.name}, "fact"),
            ("project_stage", {"value": project.stage}, "fact"),
            ("project_goal", {"value": project.goal}, "decision"),
        ]
        for key, value, memory_type in seed_entries:
            upsert_project_memory(self.db, project_id, key, value, memory_type, "system")

        self.audit.log(project_id, "system", None, "project.bootstrapped", "project", str(project_id))
        return {"runtime_created": True, "project_id": str(project_id)}

    def research_run(self, project_id, payload: dict) -> dict:
        _ = payload
        context = build_project_context(self.db, project_id)
        output = run_research_agent(context)

        run = ResearchRun(project_id=project_id, status="succeeded", summary=output.get("summary"), completed_at=datetime.now(timezone.utc))
        self.db.add(run)

        self.db.execute(delete(Competitor).where(Competitor.project_id == project_id))
        self.db.execute(delete(PainPointCluster).where(PainPointCluster.project_id == project_id))
        self.db.execute(delete(OpportunityWedge).where(OpportunityWedge.project_id == project_id))

        for item in output.get("competitors", []):
            self.db.add(
                Competitor(
                    project_id=project_id,
                    name=item["name"],
                    positioning=item.get("positioning"),
                    pricing_summary=item.get("pricing_summary"),
                    strengths=item.get("strengths", []),
                    weaknesses=item.get("weaknesses", []),
                )
            )

        for idx, item in enumerate(output.get("pain_point_clusters", []), start=1):
            self.db.add(
                PainPointCluster(
                    project_id=project_id,
                    label=item["label"],
                    description=item.get("description"),
                    evidence=item.get("evidence", []),
                    rank=idx,
                )
            )

        for item in output.get("opportunity_wedges", []):
            self.db.add(
                OpportunityWedge(
                    project_id=project_id,
                    label=item["label"],
                    description=item.get("description"),
                    score=item.get("score"),
                    status="candidate",
                )
            )

        memory_value = {"wedges": [w["label"] for w in output.get("opportunity_wedges", [])]}
        upsert_project_memory(self.db, project_id, "recommended_wedge_candidates", memory_value, "fact", "agent")

        self.audit.log(project_id, "agent", "research_agent", "research.generated", "research_run", None)
        return output

    def positioning_run(self, project_id, payload: dict) -> dict:
        _ = payload
        context = build_project_context(self.db, project_id)
        output = run_positioning_agent(context)

        version = PositioningVersion(
            project_id=project_id,
            icp=output["recommended_icp"],
            wedge=output["recommended_wedge"],
            positioning_statement=output["positioning_statement"],
            headline=output.get("headline"),
            subheadline=output.get("subheadline"),
            benefits=output.get("benefits", []),
            pricing_direction=output.get("pricing_direction"),
            objection_handling=output.get("objection_handling", []),
        )
        self.db.add(version)
        self.db.flush()

        self.audit.log(project_id, "agent", "positioning_agent", "positioning.generated", "positioning_version", None)
        return {"positioning_version_id": str(version.id), **output}

    def execution_plan(self, project_id, payload: dict) -> dict:
        context = build_project_context(self.db, project_id)
        output = run_execution_plan_agent(context)

        selected_positioning_id = payload.get("positioning_version_id")
        if not selected_positioning_id:
            selected = (
                self.db.query(PositioningVersion)
                .filter(PositioningVersion.project_id == project_id, PositioningVersion.selected.is_(True))
                .first()
            )
            selected_positioning_id = str(selected.id) if selected else None

        plan = LaunchPlan(
            project_id=project_id,
            positioning_version_id=selected_positioning_id,
            primary_channel=output["launch_strategy"]["primary_channel"],
            secondary_channels=output["launch_strategy"]["secondary_channels"],
            kpis=output.get("kpis", []),
            status="active",
        )
        self.db.add(plan)
        self.db.flush()

        for task in output.get("tasks", []):
            self.db.add(
                LaunchTask(
                    launch_plan_id=plan.id,
                    day_number=task.get("day_number"),
                    title=task["title"],
                    description=task.get("description"),
                    priority=task.get("priority", 3),
                )
            )

        self.audit.log(project_id, "agent", "execution_agent", "execution.plan_generated", "launch_plan", str(plan.id))
        return {"launch_plan_id": str(plan.id), **output}

    def execution_generate_assets(self, project_id, payload: dict) -> dict:
        asset_types = payload.get("types", ["landing_copy"])
        count = int(payload.get("count", 1))
        context = build_project_context(self.db, project_id)
        drafts = run_asset_generation_agent(context, asset_types, count)

        created_asset_ids: list[str] = []
        for draft in drafts:
            storage_path = None
            if draft["asset_type"] == "image_ad":
                image_outputs = self.google.generate_image_ads([draft["content"]["body"]])
                storage_path = image_outputs[0]["storage_path"] if image_outputs else None

            asset = Asset(
                project_id=project_id,
                asset_type=draft["asset_type"],
                title=draft.get("title"),
                content=draft.get("content", {}),
                storage_path=storage_path,
                created_by_agent="execution_agent",
                status="draft",
            )
            self.db.add(asset)
            self.db.flush()
            created_asset_ids.append(str(asset.id))

        self.audit.log(project_id, "agent", "execution_agent", "execution.assets_generated", "asset", None)
        return {"asset_ids": created_asset_ids}

    def execution_prepare_email_batch(self, project_id, payload: dict) -> dict:
        subject_line = payload.get("subject_line")
        max_contacts = int(payload.get("max_contacts", 10))
        context = build_project_context(self.db, project_id)
        drafts = run_email_personalization_agent(context, subject_line=subject_line, max_contacts=max_contacts)

        if not drafts:
            return {"prepared": False, "reason": "No contacts available"}

        batch = OutboundBatch(project_id=project_id, status="pending_approval", subject_line=subject_line)
        self.db.add(batch)
        self.db.flush()

        for draft in drafts:
            self.db.add(
                OutboundMessage(
                    batch_id=batch.id,
                    contact_id=draft["contact_id"],
                    subject=draft["subject"],
                    body=draft["body"],
                    status="draft",
                )
            )

        approval = Approval(
            project_id=project_id,
            action_type="send_email_batch",
            resource_type="outbound_batch",
            resource_id=batch.id,
            status="pending",
            requested_by_agent="execution_agent",
            reason="Ready to send outbound batch",
            required_scope="execution:send",
            requires_step_up=True,
        )
        self.db.add(approval)
        self.db.flush()

        self.audit.log(project_id, "agent", "execution_agent", "execution.email_batch_prepared", "outbound_batch", str(batch.id))
        return {"batch_id": str(batch.id), "approval_id": str(approval.id), "prepared": True}

    def execution_send_email_batch(self, project_id, payload: dict) -> dict:
        batch_id = payload.get("batch_id")
        if not batch_id:
            raise ValueError("Missing batch_id")

        batch = self.db.query(OutboundBatch).filter(OutboundBatch.id == batch_id, OutboundBatch.project_id == project_id).first()
        if not batch:
            raise ValueError("Batch not found")

        messages = self.db.query(OutboundMessage).filter(OutboundMessage.batch_id == batch.id).all()
        contact_ids = [message.contact_id for message in messages]
        contacts = self.db.query(Contact).filter(Contact.id.in_(contact_ids)).all() if contact_ids else []
        contact_by_id = {contact.id: contact for contact in contacts}

        sent_count = 0
        for message in messages:
            contact = contact_by_id.get(message.contact_id)
            to_email = contact.email if contact else None
            if not to_email:
                message.status = "failed"
                message.error_message = "Missing recipient email"
                continue

            try:
                provider_id = self.resend.send_email(to_email, message.subject or "Launch update", message.body or "")
                message.status = "sent"
                message.provider_message_id = provider_id
                message.sent_at = datetime.now(timezone.utc)
                sent_count += 1
            except Exception as exc:  # noqa: BLE001
                message.status = "failed"
                message.error_message = str(exc)

        batch.status = "sent" if sent_count > 0 else "failed"
        batch.send_count = sent_count
        batch.sent_at = datetime.now(timezone.utc)

        self.audit.log(project_id, "system", "worker", "execution.email_batch_sent", "outbound_batch", str(batch.id))
        return {"batch_id": str(batch.id), "sent_count": sent_count, "status": batch.status}

    def creative_render_video(self, project_id, payload: dict) -> dict:
        prompt = payload.get("prompt") or "8-second launch teaser"
        output = self.google.render_video(prompt)
        asset = Asset(
            project_id=project_id,
            asset_type="video_render",
            title="Rendered video",
            content={"prompt": prompt},
            storage_path=output["storage_path"],
            created_by_agent="execution_agent",
            status="draft",
        )
        self.db.add(asset)
        self.db.flush()

        self.audit.log(project_id, "agent", "execution_agent", "creative.video_rendered", "asset", str(asset.id))
        return {"asset_id": str(asset.id), **output}
