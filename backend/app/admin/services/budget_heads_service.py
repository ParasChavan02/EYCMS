import uuid
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.common.models.user import User
from app.common.models.project import Project
from app.common.models.transaction import Transaction
from app.common.models.audit_log import AuditLog
from app.common.models.eyc_budget import EYCBudgetAllocation
from app.admin.schemas.budget_heads import EYCAllocationCreate
from app.shared.logger import get_logger

logger = get_logger("budget_heads_service")


class BudgetHeadsService:
    @staticmethod
    def add_common_budget_entry(db: Session, admin: User, payload: EYCAllocationCreate) -> dict:
        if payload.allocated_amount < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount cannot be negative.")

        allocation = EYCBudgetAllocation(
            section="COMMON",
            budget_head="Total BIRAC Grant",
            allocated_amount=Decimal(str(payload.allocated_amount)),
            financial_year=payload.financial_year.strip(),
            remarks=payload.remarks,
            created_by_id=admin.id
        )
        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        audit = AuditLog(
            user_id=admin.id,
            action="Add BIRAC Grant Entry",
            entity="Budget",
            remarks=f"Added BIRAC Grant Entry of Rs {payload.allocated_amount:,.2f} for FY {payload.financial_year}."
        )
        db.add(audit)
        db.commit()

        return {
            "id": str(allocation.id),
            "section": allocation.section,
            "budget_head": allocation.budget_head,
            "allocated_amount": float(allocation.allocated_amount),
            "financial_year": allocation.financial_year,
            "remarks": allocation.remarks
        }

    @staticmethod
    def super_allocate_budget(db: Session, admin: User, payload: EYCAllocationCreate) -> dict:
        if payload.allocated_amount < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Allocation amount cannot be negative.")
        if payload.budget_head not in ["E-YUVA Centre"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid destination allocation target.")

        # Compute Available Balance
        total_common = db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "COMMON",
            EYCBudgetAllocation.budget_head == "Total BIRAC Grant"
        ).scalar() or Decimal("0.0")

        total_allocated = db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "SUPER_ALLOC"
        ).scalar() or Decimal("0.0")

        available = total_common - total_allocated
        req_amount = Decimal(str(payload.allocated_amount))

        if req_amount > available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient Common Budget balance. Available: Rs {float(available):,.2f}, Attempted: Rs {float(req_amount):,.2f}."
            )

        allocation = EYCBudgetAllocation(
            section="SUPER_ALLOC",
            budget_head=payload.budget_head,
            allocated_amount=req_amount,
            financial_year=payload.financial_year.strip(),
            remarks=payload.remarks,
            created_by_id=admin.id
        )
        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        audit = AuditLog(
            user_id=admin.id,
            action="Super Allocate Budget",
            entity="Budget",
            remarks=f"Super Admin allocated Rs {payload.allocated_amount:,.2f} to {payload.budget_head} for FY {payload.financial_year}."
        )
        db.add(audit)
        db.commit()

        return {
            "id": str(allocation.id),
            "section": allocation.section,
            "budget_head": allocation.budget_head,
            "allocated_amount": float(allocation.allocated_amount),
            "financial_year": allocation.financial_year,
            "remarks": allocation.remarks
        }

    @staticmethod
    def get_super_admin_overview(db: Session) -> dict:
        total_common = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "COMMON",
            EYCBudgetAllocation.budget_head == "Total BIRAC Grant"
        ).scalar() or 0.0)

        total_allocated = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "SUPER_ALLOC"
        ).scalar() or 0.0)

        centre_allocation = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "SUPER_ALLOC",
            EYCBudgetAllocation.budget_head == "E-YUVA Centre"
        ).scalar() or 0.0)

        fellows_allocation = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "CENTRE",
            EYCBudgetAllocation.budget_head == "E-YUVA Fellows"
        ).scalar() or 0.0)

        # Get active allocated centre categories
        allocated_cats = db.query(EYCBudgetAllocation.budget_head).filter(
            EYCBudgetAllocation.section == "CENTRE",
            EYCBudgetAllocation.allocated_amount > 0
        ).all()
        allocated_cat_names = [c[0] for c in allocated_cats]

        # Get active allocated fellows projects
        allocated_projs = db.query(EYCBudgetAllocation.project_id).filter(
            EYCBudgetAllocation.section == "FELLOWS",
            EYCBudgetAllocation.allocated_amount > 0
        ).all()
        allocated_proj_ids = [p[0] for p in allocated_projs if p[0] is not None]

        centre_util = 0.0
        if allocated_cat_names:
            centre_util = float(db.query(func.sum(Transaction.amount)).filter(
                Transaction.status == "APPROVED",
                Transaction.project_id.is_(None),
                Transaction.category.in_(allocated_cat_names)
            ).scalar() or 0.0)

        fellows_util = 0.0
        if allocated_proj_ids:
            fellows_util = float(db.query(func.sum(Transaction.amount)).filter(
                Transaction.status == "APPROVED",
                Transaction.project_id.in_(allocated_proj_ids)
            ).scalar() or 0.0)

        utilization = round(centre_util + fellows_util, 2)

        common_records = db.query(EYCBudgetAllocation).options(joinedload(EYCBudgetAllocation.created_by)).filter(
            EYCBudgetAllocation.section == "COMMON",
            EYCBudgetAllocation.budget_head == "Total BIRAC Grant"
        ).order_by(EYCBudgetAllocation.created_at.desc()).all()

        common_history = [
            {
                "id": str(r.id),
                "amount": float(r.allocated_amount),
                "date": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None,
                "financial_year": r.financial_year,
                "remarks": r.remarks,
                "allocated_by": r.created_by.name if r.created_by else "System"
            }
            for r in common_records
        ]

        alloc_records = db.query(EYCBudgetAllocation).options(joinedload(EYCBudgetAllocation.created_by)).filter(
            EYCBudgetAllocation.section == "SUPER_ALLOC"
        ).order_by(EYCBudgetAllocation.created_at.desc()).all()

        allocation_history = [
            {
                "id": str(r.id),
                "destination": r.budget_head,
                "amount": float(r.allocated_amount),
                "date": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None,
                "financial_year": r.financial_year,
                "remarks": r.remarks,
                "allocated_by": r.created_by.name if r.created_by else "System",
                "status": "SUCCESS"
            }
            for r in alloc_records
        ]

        return {
            "total_common_budget": total_common,
            "total_allocated": total_allocated,
            "available_balance": round(total_common - total_allocated, 2),
            "centre_allocation": centre_allocation,
            "fellows_allocation": fellows_allocation,
            "utilization": utilization,
            "allocation_history": allocation_history,
            "common_history": common_history
        }

    @staticmethod
    def add_custom_category(db: Session, admin: User, payload: EYCAllocationCreate) -> dict:
        if payload.allocated_amount < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount cannot be negative.")

        category_name = payload.budget_head.strip()
        recurring_categories = [
            "E-YUVA Fellows",
            "Manpower",
            "Travel for E-YUVA Centre Staff",
            "Outreach & Publications",
            "Workshops",
            "Honorarium for Meetings",
            "Contingency"
        ]
        if category_name in recurring_categories:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"'{category_name}' is a built-in recurring category. Please choose a unique custom category name.")

        # Check total Centre limit from Super Admin
        centre_limit = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "SUPER_ALLOC",
            EYCBudgetAllocation.budget_head == "E-YUVA Centre"
        ).scalar() or 0.0)

        # Check current Centre allocated category sums
        current_allocated = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "CENTRE"
        ).scalar() or 0.0)

        new_total = current_allocated + payload.allocated_amount
        if new_total > centre_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Allocation exceeds the total E-YUVA Centre budget received from Super Admin. Limit: Rs {centre_limit:,.2f}, Total after allocation: Rs {new_total:,.2f}."
            )

        allocation = EYCBudgetAllocation(
            section="CENTRE",
            budget_head=category_name,
            allocated_amount=Decimal(str(payload.allocated_amount)),
            financial_year=payload.financial_year.strip(),
            remarks=payload.remarks,
            created_by_id=admin.id
        )
        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        audit = AuditLog(
            user_id=admin.id,
            action="Add Custom Centre Category",
            entity="Budget",
            remarks=f"Added custom Centre budget category '{category_name}' with Rs {payload.allocated_amount:,.2f}."
        )
        db.add(audit)
        db.commit()

        return {
            "id": str(allocation.id),
            "section": allocation.section,
            "budget_head": allocation.budget_head,
            "allocated_amount": float(allocation.allocated_amount),
            "financial_year": allocation.financial_year,
            "remarks": allocation.remarks
        }

    @staticmethod
    def allocate_fellow_budget(db: Session, admin: User, payload: EYCAllocationCreate) -> dict:
        if payload.allocated_amount < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount cannot be negative.")
        if not payload.project_uuid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required.")

        project_uuid = uuid.UUID(payload.project_uuid)
        project = db.query(Project).filter(Project.id == project_uuid).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        if project.status in ["SUSPENDED", "DELETED", "Suspended", "Deleted"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot disburse funds to a suspended/inactive project.")

        # Check total Fellows limit from Centre budget allocation
        fellows_limit = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "CENTRE",
            EYCBudgetAllocation.budget_head == "E-YUVA Fellows"
        ).scalar() or 0.0)

        # Check current allocated Fellows budget
        current_allocated = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "FELLOWS"
        ).scalar() or 0.0)

        new_total = current_allocated + payload.allocated_amount
        if new_total > fellows_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Allocation exceeds the total E-YUVA Fellows budget received from Super Admin. Limit: Rs {fellows_limit:,.2f}, Total after allocation: Rs {new_total:,.2f}."
            )

        allocation = EYCBudgetAllocation(
            section="FELLOWS",
            budget_head=project.title,
            project_id=project.id,
            allocated_amount=Decimal(str(payload.allocated_amount)),
            financial_year=payload.financial_year.strip(),
            remarks=payload.remarks,
            created_by_id=admin.id
        )
        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        audit = AuditLog(
            user_id=admin.id,
            action="Allocate Fellow Budget",
            entity="Budget",
            remarks=f"Allocated Rs {payload.allocated_amount:,.2f} to project {project.project_id} ({project.title})."
        )
        db.add(audit)
        db.commit()

        return {
            "id": str(allocation.id),
            "section": allocation.section,
            "budget_head": allocation.budget_head,
            "allocated_amount": float(allocation.allocated_amount),
            "financial_year": allocation.financial_year,
            "remarks": allocation.remarks
        }

    @staticmethod
    def get_overview(db: Session) -> dict:
        # 1. COMMON BUDGET SECTION (Legacy Compatibility)
        common_categories = ["Manpower", "Travel for E-YUVA Centre", "Outreach & Publications", "Workshops", "Honorarium", "Contingency"]
        birac_pot_record = db.query(EYCBudgetAllocation).filter(
            EYCBudgetAllocation.section == "COMMON",
            EYCBudgetAllocation.budget_head == "Total BIRAC Grant"
        ).order_by(EYCBudgetAllocation.created_at.desc()).first()

        total_birac_budget = float(birac_pot_record.allocated_amount) if birac_pot_record else 0.0
        common_heads_data = []
        common_allocated_sum = 0.0
        common_utilized_sum = 0.0

        for cat in common_categories:
            alloc_records = db.query(EYCBudgetAllocation).filter(
                EYCBudgetAllocation.section == "COMMON",
                EYCBudgetAllocation.budget_head == cat
            ).all()
            allocated = float(sum(a.allocated_amount for a in alloc_records))
            common_allocated_sum += allocated

            transactions = db.query(Transaction).filter(
                Transaction.category == cat,
                Transaction.status == "APPROVED"
            ).all()
            utilized = float(sum(t.amount for t in transactions))
            common_utilized_sum += utilized

            common_heads_data.append({
                "id": f"common-{cat.lower().replace(' ', '-')}",
                "name": cat,
                "allocated": allocated,
                "utilized": utilized,
                "remaining": round(allocated - utilized, 2),
                "unallocated": 0.0,
                "financial_year": alloc_records[0].financial_year if alloc_records else None,
                "remarks": alloc_records[0].remarks if alloc_records else None,
                "allocations": [{"id": str(a.id), "financial_year": a.financial_year, "amount": float(a.allocated_amount), "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else None, "remarks": a.remarks} for a in alloc_records],
                "transactions": [{"id": str(t.id), "date": t.transaction_date.strftime("%Y-%m-%d") if t.transaction_date else None, "description": t.description, "amount": float(t.amount), "status": t.status} for t in transactions]
            })

        common_budget = {
            "total": total_birac_budget,
            "allocated": common_allocated_sum,
            "utilized": common_utilized_sum,
            "remaining": round(common_allocated_sum - common_utilized_sum, 2),
            "unallocated": round(total_birac_budget - common_allocated_sum, 2),
            "heads": common_heads_data
        }

        # 2. CENTRE BUDGET SECTION
        centre_limit = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "SUPER_ALLOC",
            EYCBudgetAllocation.budget_head == "E-YUVA Centre"
        ).scalar() or 0.0)

        base_centre_categories = [
            "E-YUVA Fellows",
            "Manpower",
            "Travel for E-YUVA Centre Staff",
            "Outreach & Publications",
            "Workshops",
            "Honorarium for Meetings",
            "Contingency"
        ]
        
        db_heads = db.query(EYCBudgetAllocation.budget_head).filter(
            EYCBudgetAllocation.section == "CENTRE"
        ).distinct().all()
        centre_categories = list(base_centre_categories)
        for (h,) in db_heads:
            if h not in centre_categories:
                centre_categories.append(h)

        centre_heads_data = []
        centre_allocated_sum = 0.0
        centre_utilized_sum = 0.0
        centre_transactions_master = []

        for cat in centre_categories:
            alloc_records = db.query(EYCBudgetAllocation).filter(
                EYCBudgetAllocation.section == "CENTRE",
                EYCBudgetAllocation.budget_head == cat
            ).all()

            allocated = float(sum(a.allocated_amount for a in alloc_records))
            centre_allocated_sum += allocated

            utilized = 0.0
            transactions = []
            if allocated > 0:
                transactions = db.query(Transaction).options(joinedload(Transaction.creator)).filter(
                    Transaction.category == cat,
                    Transaction.project_id.is_(None),
                    Transaction.status == "APPROVED"
                ).all()
                utilized = float(sum(t.amount for t in transactions))
            centre_utilized_sum += utilized

            allocations_list = [
                {
                    "id": str(a.id),
                    "financial_year": a.financial_year,
                    "amount": float(a.allocated_amount),
                    "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else None,
                    "remarks": a.remarks
                }
                for a in alloc_records
            ]

            transactions_list = [
                {
                    "id": str(t.id),
                    "date": t.transaction_date.strftime("%Y-%m-%d") if t.transaction_date else None,
                    "description": t.description,
                    "amount": float(t.amount),
                    "status": t.status,
                    "uploaded_by": t.creator.name if t.creator else "System"
                }
                for t in transactions
            ]

            centre_transactions_master.extend(transactions_list)

            centre_heads_data.append({
                "id": f"centre-{cat.lower().replace(' ', '-')}",
                "name": cat,
                "allocated": allocated,
                "utilized": utilized,
                "remaining": round(allocated - utilized, 2),
                "unallocated": 0.0,
                "financial_year": alloc_records[0].financial_year if alloc_records else None,
                "remarks": alloc_records[0].remarks if alloc_records else None,
                "allocations": allocations_list,
                "transactions": transactions_list
            })

        centre_transactions_master.sort(key=lambda x: x["date"] or "", reverse=True)

        centre_budget = {
            "total": centre_limit,
            "allocated": centre_allocated_sum,
            "utilized": centre_utilized_sum,
            "remaining": round(centre_allocated_sum - centre_utilized_sum, 2),
            "unallocated": round(max(0.0, centre_limit - centre_allocated_sum), 2),
            "heads": centre_heads_data,
            "transactions": centre_transactions_master
        }

        # 3. FELLOWS BUDGET SECTION
        fellows_limit = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
            EYCBudgetAllocation.section == "CENTRE",
            EYCBudgetAllocation.budget_head == "E-YUVA Fellows"
        ).scalar() or 0.0)

        fellows_alloc_records = db.query(EYCBudgetAllocation).options(
            joinedload(EYCBudgetAllocation.project),
            joinedload(EYCBudgetAllocation.created_by)
        ).filter(
            EYCBudgetAllocation.section == "FELLOWS"
        ).all()

        fellows_allocated_sum = float(sum(a.allocated_amount for a in fellows_alloc_records))

        fellows_transactions = db.query(Transaction).filter(
            Transaction.project_id.is_not(None),
            Transaction.status == "APPROVED"
        ).all()
        fellows_utilized_sum = float(sum(t.amount for t in fellows_transactions))

        allocations_list = [
            {
                "id": str(a.id),
                "project_uuid": str(a.project_id) if a.project_id else None,
                "project_id": a.project.project_id if a.project else "N/A",
                "project_name": a.project.title if a.project else "N/A",
                "amount": float(a.allocated_amount),
                "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else None,
                "financial_year": a.financial_year,
                "remarks": a.remarks,
                "allocated_by": a.created_by.name if a.created_by else "System",
                "status": "SUCCESS"
            }
            for a in fellows_alloc_records
        ]

        from app.common.models.team import Team
        from app.common.models.user import User

        all_projects = db.query(Project).all()
        projects_rollup = []
        
        # Eager load category allocations and transactions
        cat_alloc_records = db.query(EYCBudgetAllocation).options(
            joinedload(EYCBudgetAllocation.created_by)
        ).filter(
            EYCBudgetAllocation.section == "FELLOWS_CAT"
        ).all()
        


        for p in all_projects:
            # Main/First Team Leader associated with this project
            leader_name = "None"
            main_team = db.query(Team).filter(Team.project_id == p.id).first()
            if main_team and main_team.leader:
                leader_name = main_team.leader.name

            member_count = db.query(User).filter(User.project_id == p.id).count()

            # Project level disbursements
            proj_allocs = [a for a in fellows_alloc_records if a.project_id == p.id]
            p_allocated = float(sum(a.allocated_amount for a in proj_allocs))
            
            # Project level transactions
            p_txs = [t for t in fellows_transactions if t.project_id == p.id]
            p_utilized = float(sum(t.amount for t in p_txs))
            
            # Category level rollup
            proj_cats = [a for a in cat_alloc_records if a.project_id == p.id]
            cat_names = sorted(list(set(c.budget_head for c in proj_cats)))
            categories_data = []
            
            for cat_name in cat_names:
                cat_records = [c for c in proj_cats if c.budget_head == cat_name]
                cat_allocated = float(sum(c.allocated_amount for c in cat_records))
                cat_txs = [t for t in p_txs if t.category == cat_name]
                cat_utilized = float(sum(t.amount for t in cat_txs))
                
                categories_data.append({
                    "name": cat_name,
                    "allocated": cat_allocated,
                    "utilized": cat_utilized,
                    "remaining": round(cat_allocated - cat_utilized, 2),
                    "utilization_percent": round((cat_utilized / cat_allocated) * 100, 1) if cat_allocated > 0 else 0.0,
                    "allocations": [
                        {
                            "id": str(a.id),
                            "financial_year": a.financial_year,
                            "amount": float(a.allocated_amount),
                            "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else None,
                            "remarks": a.remarks
                        } for a in cat_records
                    ],
                    "transactions": [
                        {
                            "id": str(t.id),
                            "date": t.transaction_date.strftime("%Y-%m-%d") if t.transaction_date else None,
                            "description": t.description,
                            "amount": float(t.amount),
                            "status": t.status
                        } for t in cat_txs
                    ]
                })
                
            # Project specific charts
            p_chart_categories = [c["name"] for c in categories_data]
            p_chart_allocated = [c["allocated"] for c in categories_data]
            p_chart_utilized = [c["utilized"] for c in categories_data]
            
            p_budget_vs_actual = {
                "categories": p_chart_categories,
                "allocated": p_chart_allocated,
                "utilized": p_chart_utilized
            }
            
            p_breakdown_cats = [c["name"] for c in categories_data if c["utilized"] > 0]
            p_breakdown_spent = [c["utilized"] for c in categories_data if c["utilized"] > 0]
            p_category_breakdown = {
                "categories": p_breakdown_cats,
                "spent": p_breakdown_spent
            }
            
            p_trend_map = {}
            for t in p_txs:
                if t.status == "APPROVED" and t.transaction_date:
                    m_str = t.transaction_date.strftime("%Y-%m")
                    p_trend_map[m_str] = p_trend_map.get(m_str, 0.0) + float(t.amount)
            
            p_trend_months = sorted(list(p_trend_map.keys()))
            p_trend_spent = [p_trend_map[m] for m in p_trend_months]
            p_monthly_trend = {
                "months": p_trend_months,
                "spent": p_trend_spent
            }
            
            projects_rollup.append({
                "project_uuid": str(p.id),
                "project_id": p.project_id,
                "project_name": p.title,
                "team_leader_name": leader_name,
                "member_count": member_count,
                "status": p.status,
                "allocated": p_allocated,
                "utilized": p_utilized,
                "remaining": round(p_allocated - p_utilized, 2),
                "utilization_percent": round((p_utilized / p_allocated) * 100, 1) if p_allocated > 0 else 0.0,
                "categories": categories_data,
                "allocations": [
                    {
                        "id": str(a.id),
                        "amount": float(a.allocated_amount),
                        "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else None,
                        "remarks": a.remarks,
                        "financial_year": a.financial_year
                    } for a in proj_allocs
                ],
                "transactions": [
                    {
                        "id": str(t.id),
                        "date": t.transaction_date.strftime("%Y-%m-%d") if t.transaction_date else None,
                        "description": t.description,
                        "amount": float(t.amount),
                        "category": t.category,
                        "status": t.status
                    } for t in p_txs
                ],
                "analytics": {
                    "budget_vs_actual": p_budget_vs_actual,
                    "category_breakdown": p_category_breakdown,
                    "monthly_trend": p_monthly_trend
                }
            })

        fellows_budget = {
            "total": fellows_limit,
            "allocated": fellows_allocated_sum,
            "utilized": fellows_utilized_sum,
            "remaining": round(fellows_allocated_sum - fellows_utilized_sum, 2),
            "unallocated": round(max(0.0, fellows_limit - fellows_allocated_sum), 2),
            "allocations": allocations_list,
            "projects": projects_rollup
        }

        # 4. REAL-TIME ANALYTICS SECTION
        chart_categories = [h["name"] for h in centre_heads_data]
        chart_allocated = [h["allocated"] for h in centre_heads_data]
        chart_utilized = [h["utilized"] for h in centre_heads_data]

        budget_vs_actual = {
            "categories": chart_categories,
            "allocated": chart_allocated,
            "utilized": chart_utilized
        }

        breakdown_cats = []
        breakdown_spent = []
        for h in centre_heads_data:
            if h["utilized"] > 0:
                breakdown_cats.append(h["name"])
                breakdown_spent.append(h["utilized"])

        category_breakdown = {
            "categories": breakdown_cats,
            "spent": breakdown_spent
        }

        # Select dialect-dependent function for date formatting (SQLite vs PostgreSQL)
        is_sqlite = db.bind.dialect.name == "sqlite"
        if is_sqlite:
            date_format_expr = func.strftime("%Y-%m", Transaction.transaction_date)
        else:
            date_format_expr = func.to_char(Transaction.transaction_date, "YYYY-MM")

        trend_records = db.query(
            date_format_expr.label("month"),
            func.sum(Transaction.amount).label("spent")
        ).filter(
            Transaction.status == "APPROVED",
            Transaction.project_id.is_(None),
            Transaction.transaction_date.is_not(None)
        ).group_by(date_format_expr).order_by(date_format_expr).all()

        trend_months = [r.month for r in trend_records]
        trend_spent = [float(r.spent) for r in trend_records]

        monthly_trend = {
            "months": trend_months,
            "spent": trend_spent
        }

        analytics = {
            "budget_vs_actual": budget_vs_actual,
            "category_breakdown": category_breakdown,
            "monthly_trend": monthly_trend
        }

        return {
            "common_budget": common_budget,
            "centre_budget": centre_budget,
            "fellows_budget": fellows_budget,
            "analytics": analytics
        }

    @staticmethod
    def allocate_eyc_budget(db: Session, admin: User, payload: EYCAllocationCreate) -> dict:
        if payload.allocated_amount < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Allocation amount cannot be negative.")

        project_uuid = None
        team_uuid = None

        if payload.project_uuid:
            project_uuid = uuid.UUID(payload.project_uuid)

        utilized_amount = 0.0
        if payload.section == "FELLOWS":
            if not payload.project_uuid:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required for Fellows allocations.")
            project_uuid = uuid.UUID(payload.project_uuid)
            
            transactions = db.query(Transaction).filter(
                Transaction.project_id == project_uuid,
                Transaction.status == "APPROVED"
            ).all()
            utilized_amount = float(sum(t.amount for t in transactions))
        else:
            transactions = db.query(Transaction).filter(
                Transaction.category == payload.budget_head,
                Transaction.status == "APPROVED"
            ).all()
            utilized_amount = float(sum(t.amount for t in transactions))

        if payload.allocated_amount < utilized_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Allocation amount (Rs {payload.allocated_amount:,.2f}) cannot be less than the current utilization (Rs {utilized_amount:,.2f} already spent)."
            )

        # Handle CENTRE limit validation
        if payload.section == "CENTRE":
            centre_limit = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
                EYCBudgetAllocation.section == "SUPER_ALLOC",
                EYCBudgetAllocation.budget_head == "E-YUVA Centre"
            ).scalar() or 0.0)

            current_allocated = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
                EYCBudgetAllocation.section == "CENTRE"
            ).scalar() or 0.0)

            existing = db.query(EYCBudgetAllocation).filter(
                EYCBudgetAllocation.section == "CENTRE",
                EYCBudgetAllocation.budget_head == payload.budget_head,
                EYCBudgetAllocation.financial_year == payload.financial_year.strip(),
                EYCBudgetAllocation.project_id == project_uuid
            ).first()

            old_amount = float(existing.allocated_amount) if existing else 0.0
            new_total = current_allocated - old_amount + payload.allocated_amount

            if new_total > centre_limit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Allocation exceeds the total E-YUVA Centre budget received from Super Admin. Limit: Rs {centre_limit:,.2f}, Total after allocation: Rs {new_total:,.2f}."
                )

        # Handle FELLOWS_CAT limit and suspension validation
        if payload.section == "FELLOWS_CAT":
            if not payload.project_uuid:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID is required for Fellows Category allocation.")
            project = db.query(Project).filter(Project.id == project_uuid).first()
            if not project:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
            if project.status in ["SUSPENDED", "DELETED", "Suspended", "Deleted"]:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot allocate budget to a suspended/inactive project.")

            # Check total project budget (sum of section == "FELLOWS" and project_id == project_uuid)
            project_total = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
                EYCBudgetAllocation.section == "FELLOWS",
                EYCBudgetAllocation.project_id == project_uuid
            ).scalar() or 0.0)

            # Check current category allocations for this project
            current_allocated = float(db.query(func.sum(EYCBudgetAllocation.allocated_amount)).filter(
                EYCBudgetAllocation.section == "FELLOWS_CAT",
                EYCBudgetAllocation.project_id == project_uuid
            ).scalar() or 0.0)

            existing = db.query(EYCBudgetAllocation).filter(
                EYCBudgetAllocation.section == "FELLOWS_CAT",
                EYCBudgetAllocation.budget_head == payload.budget_head,
                EYCBudgetAllocation.financial_year == payload.financial_year.strip(),
                EYCBudgetAllocation.project_id == project_uuid
            ).first()

            old_amount = float(existing.allocated_amount) if existing else 0.0
            new_total = current_allocated - old_amount + payload.allocated_amount

            if new_total > project_total:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Allocation exceeds the total project budget pot. Project budget limit: Rs {project_total:,.2f}, Total after allocation: Rs {new_total:,.2f}."
                )

        existing = db.query(EYCBudgetAllocation).filter(
            EYCBudgetAllocation.section == payload.section,
            EYCBudgetAllocation.budget_head == payload.budget_head,
            EYCBudgetAllocation.financial_year == payload.financial_year.strip(),
            EYCBudgetAllocation.project_id == project_uuid
        ).first()

        if existing:
            existing.allocated_amount = Decimal(str(payload.allocated_amount))
            existing.remarks = payload.remarks
            existing.created_by_id = admin.id
            db.add(existing)
            allocation = existing
            remarks_log = f"Updated allocation for {payload.budget_head} in section {payload.section} to {payload.allocated_amount}."
        else:
            allocation = EYCBudgetAllocation(
                section=payload.section,
                budget_head=payload.budget_head,
                project_id=project_uuid,
                team_id=team_uuid,
                allocated_amount=Decimal(str(payload.allocated_amount)),
                financial_year=payload.financial_year.strip(),
                remarks=payload.remarks,
                created_by_id=admin.id
            )
            db.add(allocation)
            remarks_log = f"Created allocation for {payload.budget_head} in section {payload.section} with {payload.allocated_amount}."

        db.commit()
        db.refresh(allocation)

        audit = AuditLog(
            user_id=admin.id,
            action="Allocate EYC Budget",
            entity="Budget",
            remarks=remarks_log
        )
        db.add(audit)
        db.commit()

        return {
            "id": str(allocation.id),
            "section": allocation.section,
            "budget_head": allocation.budget_head,
            "allocated_amount": float(allocation.allocated_amount),
            "financial_year": allocation.financial_year,
            "remarks": allocation.remarks
        }

    # ---------- Legacy Stubs (to prevent compiler errors) ----------
    @staticmethod
    def get_user_detail(db: Session, user_id: str) -> dict:
        return {}

    @staticmethod
    def allocate_budget(db: Session, admin: User, user_id: str, payload) -> dict:
        return {}

    @staticmethod
    def update_allocation(db: Session, admin: User, allocation_id: str, payload) -> dict:
        return {}

    @staticmethod
    def add_spending(db: Session, admin: User, user_id: str, payload) -> dict:
        return {}

    @staticmethod
    def update_spending(db: Session, admin: User, spending_id: str, payload) -> dict:
        return {}

    @staticmethod
    def delete_spending(db: Session, admin: User, spending_id: str) -> dict:
        return {}
