from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.common.constants.enums import RoleEnum
from app.common.models.role import Role
from app.common.models.user import User
from app.shared.logger import get_logger

logger = get_logger("seeder")


def seed_db(db: Session):
    logger.info("Starting authentication seeding...")

    # Seed Roles
    role_mapping = {}

    for role in RoleEnum:
        existing = db.query(Role).filter(Role.name == role.value).first()

        if not existing:
            existing = Role(
                name=role.value,
                description=f"{role.value} role"
            )
            db.add(existing)
            db.flush()

        role_mapping[role.value] = existing

    # Seed Login Users
    users = [
        {
            "name": "Super Admin",
            "email": "superadmin@example.com",
            "password": "password123",
            "role": RoleEnum.SUPER_ADMIN,
        },
        {
            "name": "Admin",
            "email": "admin@example.com",
            "password": "password123",
            "role": RoleEnum.ADMIN,
        },
        {
            "name": "Accounts",
            "email": "finance@example.com",
            "password": "password123",
            "role": RoleEnum.ACCOUNTS,
        },
        {
            "name": "User",
            "email": "user@example.com",
            "password": "password123",
            "role": RoleEnum.USER,
        },
    ]

    for data in users:
        existing = db.query(User).filter(User.email == data["email"]).first()

        if existing:
            continue

        user = User(
            name=data["name"],
            email=data["email"],
            password_hash=get_password_hash(data["password"]),
            role_id=role_mapping[data["role"].value].id,
            is_active=True
        )

        db.add(user)

    db.commit()

    logger.info("Authentication users seeded successfully.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()