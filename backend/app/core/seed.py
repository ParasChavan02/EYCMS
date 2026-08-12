from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.common.constants.enums import RoleEnum
from app.common.models.role import Role
from app.common.models.user import User
from app.common.models.project import Project
from app.common.models.team import Team
from app.common.models.budget import Budget
from app.common.models.budget_head import BudgetHead
from app.shared.logger import get_logger
from decimal import Decimal
from datetime import date, timedelta

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

    db.flush()

    # Seed default Project, Team, Budget & Budget Heads
    logger.info("Seeding default project and budgets...")
    
    # 1. Project
    project = db.query(Project).filter(Project.project_id == "PROJ-2026-001").first()
    if not project:
        project = Project(
            project_id="PROJ-2026-001",
            title="Project Leadership & Development",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            duration=12,
            status="ACTIVE"
        )
        db.add(project)
        db.flush()

    # 2. Default User (user@example.com) config
    default_user = db.query(User).filter(User.email == "user@example.com").first()
    
    # 3. Team
    team = None
    if default_user:
        team = db.query(Team).filter(Team.project_id == project.id).first()
        if not team:
            team = Team(
                project_id=project.id,
                name="E-YUVA Core Team",
                leader_id=default_user.id
            )
            db.add(team)
            db.flush()
        
        # Associate user with project and team
        default_user.project_id = project.id
        default_user.team_id = team.id
        default_user.team_configured = True
        db.add(default_user)

    # 4. Budget
    budget = db.query(Budget).filter(Budget.project_id == project.id).first()
    if not budget:
        budget = Budget(
            project_id=project.id,
            financial_year="2026-2027",
            total_allocated=Decimal("300000.00"),
            status="ACTIVE"
        )
        db.add(budget)
        db.flush()

    # 5. Budget Heads (sum = 300,000)
    budget_heads_data = [
        {"name": "Travel", "limit": 50000.00},
        {"name": "Food", "limit": 50000.00},
        {"name": "Venue", "limit": 100000.00},
        {"name": "Marketing", "limit": 40000.00},
        {"name": "Printing", "limit": 30000.00},
        {"name": "Equipment", "limit": 30000.00},
        {"name": "Miscellaneous", "limit": 10000.00},
    ]

    for bh_info in budget_heads_data:
        bh_name = bh_info["name"]
        existing_bh = db.query(BudgetHead).filter(
            BudgetHead.budget_id == budget.id,
            BudgetHead.name == bh_name
        ).first()
        
        if not existing_bh:
            new_bh = BudgetHead(
                budget_id=budget.id,
                name=bh_name,
                limit_amount=Decimal(str(bh_info["limit"]))
            )
            db.add(new_bh)

    db.commit()

    logger.info("Authentication users seeded successfully.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()