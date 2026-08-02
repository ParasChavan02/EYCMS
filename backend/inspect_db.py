from app.core.database import SessionLocal
from app.common.models.project import Project
from app.common.models.team import Team
from app.common.models.budget import Budget
from app.common.models.budget_head import BudgetHead
from app.common.models.user import User

db = SessionLocal()
try:
    print("=== Users ===")
    for u in db.query(User).all():
        print(f"User: {u.name}, Email: {u.email}, Project ID: {u.project_id}, Team ID: {u.team_id}")
    
    print("\n=== Projects ===")
    for p in db.query(Project).all():
        print(f"Project: {p.title}, ID: {p.id}, Code: {p.project_id}")
        
    print("\n=== Teams ===")
    for t in db.query(Team).all():
        print(f"Team: {t.name}, ID: {t.id}, Project ID: {t.project_id}")
        
    print("\n=== Budgets ===")
    for b in db.query(Budget).all():
        print(f"Budget: {b.id}, FY: {b.financial_year}, Allocated: {b.total_allocated}, Project ID: {b.project_id}")
        for bh in b.budget_heads:
            print(f"  -> BudgetHead: {bh.name}, Limit: {bh.limit_amount}, ID: {bh.id}")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
