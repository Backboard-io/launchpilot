"""add connector_credentials for Google/GitHub OAuth tokens

Revision ID: 0005_connector_credentials
Revises: 0004_task_evidence
Create Date: 2026-03-17

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0005_connector_credentials"
down_revision = "0004_task_evidence"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    if not inspector.has_table("connector_credentials"):
        op.create_table(
            "connector_credentials",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("user_id", sa.Uuid(), nullable=False),
            sa.Column("provider", sa.String(length=32), nullable=False),
            sa.Column("access_token", sa.Text(), nullable=True),
            sa.Column("refresh_token", sa.Text(), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "provider", name="uq_connector_credentials_user_provider"),
        )
        op.create_index("ix_connector_credentials_user_id", "connector_credentials", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_connector_credentials_user_id", table_name="connector_credentials")
    op.drop_table("connector_credentials")
