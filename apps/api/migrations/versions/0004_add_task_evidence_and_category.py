"""add task evidence and category for gamification

Revision ID: 0004_task_evidence
Revises: 0003_add_chat_sequence_field
Create Date: 2026-03-17

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0004_task_evidence"
down_revision = "0003_add_chat_sequence_field"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    existing = [c["name"] for c in inspector.get_columns("launch_tasks")]
    if "evidence_url" not in existing:
        op.add_column("launch_tasks", sa.Column("evidence_url", sa.String(), nullable=True))
    if "evidence_verified_at" not in existing:
        op.add_column("launch_tasks", sa.Column("evidence_verified_at", sa.DateTime(timezone=True), nullable=True))
    if "category" not in existing:
        op.add_column("launch_tasks", sa.Column("category", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("launch_tasks", "category")
    op.drop_column("launch_tasks", "evidence_verified_at")
    op.drop_column("launch_tasks", "evidence_url")
