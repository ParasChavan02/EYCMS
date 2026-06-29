from sqlalchemy.orm import Session
from datetime import date
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.common.constants.enums import RoleEnum
from app.common.models.role import Role
from app.common.models.user import User
from app.common.models.project import Project
from app.common.models.budget import Budget
from app.common.models.budget_head import BudgetHead
from app.shared.logger import get_logger

logger = get_logger("seeder")

def seed_db(db: Session) -> None:
    logger.info("Initializing database seeding run...")
    
    # 1. Seed Roles
    role_mapping = {}
    for role_name in RoleEnum:
        existing_role = db.query(Role).filter(Role.name == role_name.value).first()
        if not existing_role:
            logger.info(f"Seeding missing role: {role_name.value}")
            role = Role(name=role_name.value, description=f"{role_name.value} access level")
            db.add(role)
            db.flush()
            role_mapping[role_name.value] = role
        else:
            role_mapping[role_name.value] = existing_role
    
    # 2. Seed Default Project
    project_id = "EY-2026-042"
    existing_project = db.query(Project).filter(Project.project_id == project_id).first()
    if not existing_project:
        logger.info(f"Seeding default project: {project_id}")
        project = Project(
            project_id=project_id,
            title="E-YUVA Fellowship Study on ERP Architectures",
            mentor_name="Dr. Sarah Connor",
            description="Normalized SQL schemas and parallel FastAPI modular implementations",
            start_date=date(2025, 8, 1),
            end_date=date(2027, 7, 31),
            duration=24,
            status="ACTIVE"
        )
        db.add(project)
        db.flush()
        default_project = project
    else:
        default_project = existing_project

    # 3. Seed Default Users (Super Admin, Admin, Accounts, Fellow)
    users_to_seed = [
        {
            "name": "Super Admin",
            "email": "superadmin@example.com",
            "role": RoleEnum.SUPER_ADMIN,
            "project": None
        },
        {
            "name": "Coordinator Admin",
            "email": "admin@example.com",
            "role": RoleEnum.ADMIN,
            "project": None
        },
        {
            "name": "Finance Accountant",
            "email": "finance@example.com",
            "role": RoleEnum.ACCOUNTS,
            "project": None
        },
        {
            "name": "Fellow User",
            "email": "fellow@example.com",
            "role": RoleEnum.USER,
            "project": default_project
        }
    ]

    for user_data in users_to_seed:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing_user:
            logger.info(f"Seeding default user account: {user_data['name']}")
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                password_hash=get_password_hash("password123"),
                role_id=role_mapping[user_data["role"].value].id,
                project_id=user_data["project"].id if user_data["project"] else None,
                is_active=True
            )
            db.add(user)
        else:
            if user_data["project"] and not existing_user.project_id:
                existing_user.project_id = user_data["project"].id
                db.add(existing_user)

    # 4. Seed Default Budget and Categories
    existing_budget = db.query(Budget).filter(Budget.project_id == default_project.id).first()
    if not existing_budget:
        logger.info(f"Seeding default project allocations for: {project_id}")
        budget = Budget(
            project_id=default_project.id,
            financial_year="2026-2027",
            total_allocated=500000.00,
            status="ACTIVE"
        )
        db.add(budget)
        db.flush()
        
        # Add budget heads
        heads = [
            ("Manpower", 240000.00),
            ("Travel", 60000.00),
            ("Equipment", 100000.00),
            ("Consumables", 60000.00),
            ("Contingency", 40000.00)
        ]
        for name, limit in heads:
            logger.info(f"Seeding budget head limit: {name} (${limit})")
            head = BudgetHead(
                budget_id=budget.id,
                name=name,
                limit_amount=limit
            )
            db.add(head)

    db.commit()
    logger.info("Database seeding successfully completed.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
