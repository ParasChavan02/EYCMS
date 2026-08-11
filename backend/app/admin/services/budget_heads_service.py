import uuid
from decimal import Decimal, InvalidOperation
from typing import Optional, List

from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.common.models.user import User
from app.common.models.team import Team
from app.common.models.user_budget import UserBudgetAllocation, UserBudgetSpending
from app.admin.schemas.budget_heads import (
    BudgetAllocationCreate,
    BudgetAllocationUpdate,
    BudgetSpendingCreate,
    BudgetSpendingUpdate,
)
from app.shared.logger import get_logger

logger = get_logger("budget_heads_service")


def _to_uuid(value: str, label: str = "id") -> uuid.UUID:
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {label}.")


def _to_float(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _utilization_status(allocated: float, utilized: float) -> str:
    if utilized <= 0:
        return "NOT_UTILIZED"
    if allocated <= 0:
        return "EXCEEDED"
    percent = (utilized / allocated) * 100
    if percent > 100:
        return "EXCEEDED"
    if percent > 80:
        return "HIGH"
    if percent >= 50:
        return "MEDIUM"
    return "LOW"


def _utilization_percent(allocated: float, utilized: float) -> float:
    if allocated <= 0:
        return 0.0 if utilized <= 0 else 100.0
    return round((utilized / allocated) * 100, 2)


class BudgetHeadsService:
    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_current_allocation(db: Session, user_id: uuid.UUID) -> Optional[UserBudgetAllocation]:
        return (
            db.query(UserBudgetAllocation)
            .filter(UserBudgetAllocation.user_id == user_id)
            .order_by(UserBudgetAllocation.created_at.desc())
            .first()
        )

    @staticmethod
    def _spending_total(db: Session, allocation_id: uuid.UUID, exclude_spending_id: Optional[uuid.UUID] = None) -> float:
        query = db.query(UserBudgetSpending).filter(UserBudgetSpending.allocation_id == allocation_id)
        if exclude_spending_id:
            query = query.filter(UserBudgetSpending.id != exclude_spending_id)
        total = sum((_to_float(s.amount) for s in query.all()), 0.0)
        return round(total, 2)

    @staticmethod
    def _serialize_user_summary(db: Session, user: User) -> dict:
        allocation = BudgetHeadsService._get_current_allocation(db, user.id)
        allocated = _to_float(allocation.allocated_amount) if allocation else 0.0
        utilized = BudgetHeadsService._spending_total(db, allocation.id) if allocation else 0.0
        remaining = round(allocated - utilized, 2)
        category_count = (
            db.query(UserBudgetSpending).filter(UserBudgetSpending.allocation_id == allocation.id).count()
            if allocation
            else 0
        )

        return {
            "user_id": str(user.id),
            "user_name": user.name,
            "email": user.email,
            "role": user.role.name if user.role else None,
            "team_id": str(user.team_id) if user.team_id else None,
            "team_name": user.team.name if user.team else None,
            "allocation_id": str(allocation.id) if allocation else None,
            "financial_year": allocation.financial_year if allocation else None,
            "allocated_amount": allocated,
            "utilized_amount": utilized,
            "remaining_amount": remaining,
            "utilization_percent": _utilization_percent(allocated, utilized),
            "utilization_status": _utilization_status(allocated, utilized),
            "category_count": category_count,
        }

    # ------------------------------------------------------------------
    # Overview: teams -> members, plus overall summary
    # ------------------------------------------------------------------

    @staticmethod
    def get_overview(db: Session) -> dict:
        users = (
            db.query(User)
            .options(joinedload(User.role), joinedload(User.team))
            .order_by(User.name.asc())
            .all()
        )

        summaries = [BudgetHeadsService._serialize_user_summary(db, u) for u in users]

        teams_map = {}
        for s in summaries:
            key = s["team_id"] or "UNASSIGNED"
            if key not in teams_map:
                teams_map[key] = {
                    "team_id": s["team_id"],
                    "team_name": s["team_name"] or "Unassigned",
                    "members": [],
                }
            teams_map[key]["members"].append(s)

        teams = []
        for team in teams_map.values():
            total_allocated = round(sum(m["allocated_amount"] for m in team["members"]), 2)
            total_utilized = round(sum(m["utilized_amount"] for m in team["members"]), 2)
            total_remaining = round(total_allocated - total_utilized, 2)
            teams.append(
                {
                    "team_id": team["team_id"],
                    "team_name": team["team_name"],
                    "total_allocated": total_allocated,
                    "total_utilized": total_utilized,
                    "total_remaining": total_remaining,
                    "utilization_percent": _utilization_percent(total_allocated, total_utilized),
                    "member_count": len(team["members"]),
                    "members": team["members"],
                }
            )

        # Sort teams: named teams first (alphabetically), Unassigned last
        teams.sort(key=lambda t: (t["team_id"] is None, t["team_name"].lower()))

        total_allocated = round(sum(t["total_allocated"] for t in teams), 2)
        total_utilized = round(sum(t["total_utilized"] for t in teams), 2)
        total_remaining = round(total_allocated - total_utilized, 2)

        summary = {
            "total_allocated": total_allocated,
            "total_utilized": total_utilized,
            "total_remaining": total_remaining,
            "utilization_percent": _utilization_percent(total_allocated, total_utilized),
            "total_users": len(users),
            "total_teams": len(teams),
        }

        return {"summary": summary, "teams": teams}

    # ------------------------------------------------------------------
    # Single user detail
    # ------------------------------------------------------------------

    @staticmethod
    def get_user_detail(db: Session, user_id: str) -> dict:
        uid = _to_uuid(user_id, "user id")
        user = db.query(User).options(joinedload(User.role), joinedload(User.team)).filter(User.id == uid).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        summary = BudgetHeadsService._serialize_user_summary(db, user)

        allocation = BudgetHeadsService._get_current_allocation(db, uid)
        spending_items = []
        if allocation:
            entries = (
                db.query(UserBudgetSpending)
                .filter(UserBudgetSpending.allocation_id == allocation.id)
                .order_by(UserBudgetSpending.created_at.desc())
                .all()
            )
            spending_items = [
                {
                    "id": str(e.id),
                    "category_name": e.category_name,
                    "amount": _to_float(e.amount),
                    "remarks": e.remarks,
                    "created_at": e.created_at,
                    "updated_at": e.updated_at,
                }
                for e in entries
            ]

        history_rows = (
            db.query(UserBudgetAllocation)
            .filter(UserBudgetAllocation.user_id == uid)
            .order_by(UserBudgetAllocation.updated_at.desc())
            .all()
        )
        history = [
            {
                "id": str(h.id),
                "financial_year": h.financial_year,
                "allocated_amount": _to_float(h.allocated_amount),
                "remarks": h.remarks,
                "created_by_name": h.created_by.name if h.created_by else None,
                "created_at": h.created_at,
                "updated_at": h.updated_at,
            }
            for h in history_rows
        ]

        summary["spending"] = spending_items
        summary["allocation_history"] = history
        return summary

    # ------------------------------------------------------------------
    # Allocation: create / update
    # ------------------------------------------------------------------

    @staticmethod
    def allocate_budget(db: Session, admin: User, user_id: str, payload: BudgetAllocationCreate) -> dict:
        uid = _to_uuid(user_id, "user id")
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        if payload.allocated_amount < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Allocated amount cannot be negative.")

        allocation = UserBudgetAllocation(
            user_id=uid,
            financial_year=payload.financial_year.strip(),
            allocated_amount=Decimal(str(payload.allocated_amount)),
            remarks=payload.remarks,
            created_by_id=admin.id,
        )
        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        logger.info(f"Admin {admin.email} allocated budget {payload.allocated_amount} to user {user.email}")
        return BudgetHeadsService._serialize_user_summary(db, user)

    @staticmethod
    def update_allocation(db: Session, admin: User, allocation_id: str, payload: BudgetAllocationUpdate) -> dict:
        aid = _to_uuid(allocation_id, "allocation id")
        allocation = db.query(UserBudgetAllocation).filter(UserBudgetAllocation.id == aid).first()
        if not allocation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget allocation not found.")

        if payload.allocated_amount is not None:
            if payload.allocated_amount < 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Allocated amount cannot be negative.")
            allocation.allocated_amount = Decimal(str(payload.allocated_amount))
        if payload.financial_year is not None:
            allocation.financial_year = payload.financial_year.strip()
        if payload.remarks is not None:
            allocation.remarks = payload.remarks

        db.commit()
        db.refresh(allocation)

        user = db.query(User).filter(User.id == allocation.user_id).first()
        logger.info(f"Admin {admin.email} updated allocation {allocation_id} for user {user.email if user else allocation.user_id}")
        return BudgetHeadsService._serialize_user_summary(db, user)

    # ------------------------------------------------------------------
    # Spending categories: create / update / delete
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_spending_amount(allocated: float, existing_total: float, new_amount: float):
        if new_amount < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount cannot be negative.")
        if allocated <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Allocate a budget to this user before adding spending categories.",
            )
        if round(existing_total + new_amount, 2) > allocated:
            remaining = round(allocated - existing_total, 2)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount exceeds the remaining budget (Rs {max(remaining, 0):,.2f} left).",
            )

    @staticmethod
    def add_spending(db: Session, admin: User, user_id: str, payload: BudgetSpendingCreate) -> dict:
        uid = _to_uuid(user_id, "user id")
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        allocation = BudgetHeadsService._get_current_allocation(db, uid)
        if not allocation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Allocate a budget to this user before adding spending categories.",
            )

        allocated = _to_float(allocation.allocated_amount)
        existing_total = BudgetHeadsService._spending_total(db, allocation.id)
        BudgetHeadsService._validate_spending_amount(allocated, existing_total, payload.amount)

        entry = UserBudgetSpending(
            allocation_id=allocation.id,
            user_id=uid,
            category_name=payload.category_name.strip(),
            amount=Decimal(str(payload.amount)),
            remarks=payload.remarks,
            created_by_id=admin.id,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        logger.info(f"Admin {admin.email} added spending category '{entry.category_name}' for user {user.email}")
        return {
            "id": str(entry.id),
            "category_name": entry.category_name,
            "amount": _to_float(entry.amount),
            "remarks": entry.remarks,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at,
        }

    @staticmethod
    def update_spending(db: Session, admin: User, spending_id: str, payload: BudgetSpendingUpdate) -> dict:
        sid = _to_uuid(spending_id, "spending id")
        entry = db.query(UserBudgetSpending).filter(UserBudgetSpending.id == sid).first()
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spending category not found.")

        allocation = db.query(UserBudgetAllocation).filter(UserBudgetAllocation.id == entry.allocation_id).first()
        allocated = _to_float(allocation.allocated_amount) if allocation else 0.0

        new_amount = payload.amount if payload.amount is not None else _to_float(entry.amount)
        if payload.amount is not None:
            existing_total = BudgetHeadsService._spending_total(db, entry.allocation_id, exclude_spending_id=entry.id)
            BudgetHeadsService._validate_spending_amount(allocated, existing_total, new_amount)
            entry.amount = Decimal(str(new_amount))

        if payload.category_name is not None:
            entry.category_name = payload.category_name.strip()
        if payload.remarks is not None:
            entry.remarks = payload.remarks

        db.commit()
        db.refresh(entry)

        logger.info(f"Admin {admin.email} updated spending category {spending_id}")
        return {
            "id": str(entry.id),
            "category_name": entry.category_name,
            "amount": _to_float(entry.amount),
            "remarks": entry.remarks,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at,
        }

    @staticmethod
    def delete_spending(db: Session, admin: User, spending_id: str) -> dict:
        sid = _to_uuid(spending_id, "spending id")
        entry = db.query(UserBudgetSpending).filter(UserBudgetSpending.id == sid).first()
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spending category not found.")

        db.delete(entry)
        db.commit()

        logger.info(f"Admin {admin.email} deleted spending category {spending_id}")
        return {"deleted": True, "id": spending_id}
