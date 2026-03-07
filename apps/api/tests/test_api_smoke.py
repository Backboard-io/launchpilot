import uuid

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import get_db
from app.main import app
from app.models.base import Base
from app.models.workspace import Workspace


def build_test_client():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app), TestingSessionLocal


def test_health_endpoint():
    client, _ = build_test_client()
    response = client.get("/v1/health")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ok"


def test_project_creation_queues_bootstrap_job():
    client, SessionLocal = build_test_client()

    with SessionLocal() as db:
        workspace = Workspace(name="Demo Workspace", slug="demo-workspace", auth0_org_id="org_dev")
        db.add(workspace)
        db.commit()
        workspace_id = workspace.id

    response = client.post(
        "/v1/projects",
        json={
            "workspace_id": str(workspace_id),
            "name": "My Tool",
            "summary": "AI launch helper",
            "goal": "Get first users",
        },
    )
    assert response.status_code == 200
    payload = response.json()["data"]
    assert uuid.UUID(payload["project_id"])
    assert uuid.UUID(payload["job_id"])
