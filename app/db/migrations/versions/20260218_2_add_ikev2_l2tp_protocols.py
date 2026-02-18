"""add ikev2 and l2tp protocols

Revision ID: 20260218_2
Revises: 20260218_add_openvpn_protocol
Create Date: 2026-02-18

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260218_2"
down_revision = "20260218_add_openvpn_protocol"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        op.execute("ALTER TYPE proxytypes ADD VALUE 'IKEv2'")
        op.execute("ALTER TYPE proxytypes ADD VALUE 'L2TP'")

    elif dialect in ("mariadb", "mysql"):
        op.execute(
            "ALTER TABLE inbounds MODIFY protocol ENUM('VMess', 'VLESS', 'Trojan', 'Shadowsocks', 'Shadowsocks2022', 'Hysteria2', 'WireGuard', 'TUIC', 'ShadowTLS', 'OpenVPN', 'IKEv2', 'L2TP')"
        )


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect in ("mysql", "mariadb"):
        op.execute(
            "ALTER TABLE inbounds MODIFY protocol ENUM('VMess', 'VLESS', 'Trojan', 'Shadowsocks', 'Shadowsocks2022', 'Hysteria2', 'WireGuard', 'TUIC', 'ShadowTLS', 'OpenVPN')"
        )
