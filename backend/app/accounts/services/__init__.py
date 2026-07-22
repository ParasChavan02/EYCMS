from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from app.common.models.budget import Budget
from app.common.models.budget_head import BudgetHead
from app.common.models.expense import Expense
from app.common.models.transaction import Transaction
from app.common.models.project import Project
from app.common.models.user import User

from app.accounts.schemas import (
    AccountsDashboardKPIs,
    AccountsTransactionItem,
    AccountsBudgetItem,
    AccountsBudgetHeadItem,
)

# Transaction statuses that represent funds actually disbursed/utilized.
APPROVED_STATUS = "APPROVED"
# Statuses that still require action / are awaiting verification or approval.
PENDING_STATUSES = ["DRAFT", "PENDING", "VERIFIED", "REVISION_REQUESTED"]


class AccountsService:
    """
    Read-only service layer for the Accounts role.
    Reuses the existing Budget / BudgetHead / Expense / Transaction models
    (the same tables Admin and User modules already write to) — no
    duplicate models, schemas, or write logic are introduced here.
    """

    @staticmethod
    def get_dashboard_kpis(db: Session) -> AccountsDashboardKPIs:
        total_allocated = db.query(func.sum(Budget.total_allocated)).scalar() or 0

        total_spent = (
            db.query(func.sum(Transaction.amount))
            .filter(Transaction.status == APPROVED_STATUS)
            .scalar()
            or 0
        )

        pending_transactions = (
            db.query(func.count(Transaction.id))
            .filter(Transaction.status.in_(PENDING_STATUSES))
            .scalar()
            or 0
        )

        active_budgets = (
            db.query(func.count(Budget.id)).filter(Budget.status == "ACTIVE").scalar() or 0
        )

        total_allocated = float(total_allocated)
        total_spent = float(total_spent)
        remaining = total_allocated - total_spent
        utilization_pct = round((total_spent / total_allocated) * 100, 1) if total_allocated else 0.0

        return AccountsDashboardKPIs(
            total_allocated_funds=total_allocated,
            total_spent_funds=total_spent,
            remaining_funds=remaining,
            budget_utilized_percent=utilization_pct,
            pending_transactions=int(pending_transactions),
            active_budgets=int(active_budgets),
        )

    @staticmethod
    def get_transactions(
        db: Session,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[AccountsTransactionItem]:
        query = (
            db.query(Transaction)
            .join(Expense, Transaction.expense_id == Expense.id)
            .join(BudgetHead, Expense.budget_head_id == BudgetHead.id)
            .join(Budget, BudgetHead.budget_id == Budget.id)
            .outerjoin(Project, Budget.project_id == Project.id)
            .outerjoin(User, Transaction.created_by_id == User.id)
            .options(
                joinedload(Transaction.expense).joinedload(Expense.budget_head),
            )
        )

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Transaction.status == status_filter.upper())

        if search:
            s = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.description.ilike(s),
                    BudgetHead.name.ilike(s),
                    Project.title.ilike(s),
                )
            )

        rows = (
            query.add_columns(BudgetHead.name, Project.title, User.name)
            .order_by(Transaction.created_at.desc())
            .all()
        )

        results: List[AccountsTransactionItem] = []
        for txn, budget_head_name, project_title, creator_name in rows:
            results.append(
                AccountsTransactionItem(
                    id=str(txn.id),
                    date=txn.created_at,
                    description=txn.description,
                    budget_head=budget_head_name or "Unassigned",
                    project_title=project_title,
                    amount=float(txn.amount),
                    status=txn.status,
                    created_by_name=creator_name,
                )
            )
        return results

    @staticmethod
    def get_budget_overview(db: Session) -> List[AccountsBudgetItem]:
        budgets = (
            db.query(Budget)
            .options(joinedload(Budget.budget_heads))
            .outerjoin(Project, Budget.project_id == Project.id)
            .add_columns(Project.title, Project.project_id)
            .order_by(Budget.created_at.desc())
            .all()
        )

        results: List[AccountsBudgetItem] = []
        for budget, project_title, project_code in budgets:
            head_items: List[AccountsBudgetHeadItem] = []
            budget_utilized_total = Decimal("0")

            for head in budget.budget_heads:
                utilized = (
                    db.query(func.sum(Transaction.amount))
                    .join(Expense, Transaction.expense_id == Expense.id)
                    .filter(
                        Expense.budget_head_id == head.id,
                        Transaction.status == APPROVED_STATUS,
                    )
                    .scalar()
                    or 0
                )
                utilized = Decimal(str(utilized))
                budget_utilized_total += utilized

                allocated = head.limit_amount or Decimal("0")
                remaining = allocated - utilized
                util_pct = round(float(utilized) / float(allocated) * 100, 1) if allocated else 0.0

                head_items.append(
                    AccountsBudgetHeadItem(
                        id=str(head.id),
                        name=head.name,
                        allocated=float(allocated),
                        utilized=float(utilized),
                        remaining=float(remaining),
                        utilization_percent=util_pct,
                    )
                )

            total_allocated = float(budget.total_allocated or 0)
            total_utilized = float(budget_utilized_total)
            total_remaining = total_allocated - total_utilized
            overall_pct = round(total_utilized / total_allocated * 100, 1) if total_allocated else 0.0

            results.append(
                AccountsBudgetItem(
                    id=str(budget.id),
                    project_id=project_code,
                    project_title=project_title,
                    financial_year=budget.financial_year,
                    status=budget.status,
                    total_allocated=total_allocated,
                    total_utilized=total_utilized,
                    total_remaining=total_remaining,
                    utilization_percent=overall_pct,
                    budget_heads=head_items,
                )
            )

        return results
