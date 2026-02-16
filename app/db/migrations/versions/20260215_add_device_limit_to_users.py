"""add device_limit to users

Revision ID: 1234567890ab
Revises: 57eba0a293f2
Create Date: 2026-02-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1234567890ab'
down_revision = '57eba0a293f2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add device_limit column to users table
    op.add_column('users', sa.Column('device_limit', sa.Integer(), 
                                     nullable=False, server_default='-1', default=-1))


def downgrade() -> None:
    # Remove device_limit column from users table
    op.drop_column('users', 'device_limit')