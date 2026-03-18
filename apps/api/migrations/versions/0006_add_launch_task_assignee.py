"""add assignee_id to launch_tasks

Revision ID: 0006_launch_task_assignee
Revises: 0005_connector_credentials
Create Date: 2026-03-17

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0006_launch_task_assignee"
down_revision = "0005_connector_credentials"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    if "assignee_id" not in [c["name"] for c in inspector.get_columns("launch_tasks")]:
        with op.batch_alter_table("launch_tasks") as batch_op:
            batch_op.add_column(sa.Column("assignee_id", sa.Uuid(native_uuid=False), nullable=True))
            batch_op.create_foreign_key(
                "fk_launch_tasks_assignee_id_users",
                "users",
                ["assignee_id"],
                ["id"],
                ondelete="SET NULL",
            )


def downgrade() -> None:
    with op.batch_alter_table("launch_tasks") as batch_op:
        batch_op.drop_constraint("fk_launch_tasks_assignee_id_users", type_="foreignkey")
        batch_op.drop_column("assignee_id")
