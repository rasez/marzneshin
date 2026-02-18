"""add openvpn protocol

Revision ID: 20260218
Revises: 20260215_add_device_limit_to_users
Create Date: 2026-02-18

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260218"
down_revision = "20260215_add_device_limit_to_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        op.execute("ALTER TYPE proxytypes ADD VALUE 'OpenVPN'")

    elif dialect in ("mariadb", "mysql"):
        op.execute(
            "ALTER TABLE inbounds MODIFY protocol ENUM('VMess', 'VLESS', 'Trojan', 'Shadowsocks', 'Shadowsocks2022', 'Hysteria2', 'WireGuard', 'TUIC', 'ShadowTLS', 'OpenVPN')"
        )


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect in ("mysql", "mariadb"):
        op.execute(
            "ALTER TABLE inbounds MODIFY protocol ENUM('VMess', 'VLESS', 'Trojan', 'Shadowsocks', 'Shadowsocks2022', 'Hysteria2', 'WireGuard', 'TUIC', 'ShadowTLS')"
        )
