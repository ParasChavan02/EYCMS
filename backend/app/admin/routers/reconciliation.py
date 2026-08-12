from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, verify_admin, require_admin_only
from app.common.models.user import User
from app.admin.schemas.financial_schemas import (
    ReconciliationSummaryKPIs,
    BankStatementStageResponse,
    BankStatementConfirmIn,
    BankTransactionItem,
    AutoMatchRequest,
    AutoMatchResponse,
    ManualMatchRequest,
    UnmatchRequest,
    JournalEntryRequest,
    ConfirmPeriodRequest,
    LockPeriodRequest,
    UnlockPeriodRequest,
)
from app.admin.services.reconciliation_service import ReconciliationService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/admin/reconciliation", tags=["Bank Reconciliation Operations"], dependencies=[Depends(verify_admin)])


@router.get("", response_model=ResponseEnvelope[dict])
def get_reconciliation_workspace(
    period_name: Optional[str] = Query(None, alias="period_name"),
    match_status: Optional[str] = Query(None, alias="match_status"),
    search: Optional[str] = Query(None, alias="search"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        summary = ReconciliationService.get_summary(db, period_name)
        bank_transactions = ReconciliationService.list_bank_transactions(db, period_name, match_status, search)
        periods = ReconciliationService.list_periods(db)
        return make_success_response({
            "summary": summary,
            "bank_transactions": bank_transactions,
            "periods": periods,
        })
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/summary", response_model=ResponseEnvelope[ReconciliationSummaryKPIs])
def get_reconciliation_summary(
    period_name: Optional[str] = Query(None, alias="period_name"),
    db: Session = Depends(get_db),
):
    try:
        summary = ReconciliationService.get_summary(db, period_name)
        return make_success_response(summary)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/import/stage", response_model=ResponseEnvelope[BankStatementStageResponse])
async def stage_import_bank_statement(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        file_bytes = await file.read()
        res = ReconciliationService.stage_import_bank_statement(
            db=db,
            file_bytes=file_bytes,
            filename=file.filename or "bank_statement.csv",
            current_admin=current_admin,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/import/confirm", response_model=ResponseEnvelope[dict])
def confirm_import_bank_statement(
    payload: BankStatementConfirmIn,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        res = ReconciliationService.confirm_import_bank_statement(
            db=db,
            stage_token=payload.stage_token,
            period_name=payload.period_name,
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/auto-match", response_model=ResponseEnvelope[AutoMatchResponse])
def auto_match_bank_transactions(
    payload: AutoMatchRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        res = ReconciliationService.auto_match(
            db=db,
            period_name=payload.period_name,
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/match", response_model=ResponseEnvelope[dict])
def manual_match_transaction(
    payload: ManualMatchRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        res = ReconciliationService.manual_match(
            db=db,
            bank_transaction_id=payload.bank_transaction_id,
            transaction_id=payload.transaction_id,
            notes=payload.notes,
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/unmatch", response_model=ResponseEnvelope[dict])
def unmatch_transaction(
    payload: UnmatchRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        res = ReconciliationService.unmatch(
            db=db,
            bank_transaction_id=payload.bank_transaction_id,
            notes=payload.notes,
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/journal-entry", response_model=ResponseEnvelope[dict])
def create_journal_entry_fallback(
    payload: JournalEntryRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        res = ReconciliationService.create_journal_entry(
            db=db,
            bank_transaction_id=payload.bank_transaction_id,
            debit_account=payload.debit_account,
            credit_account=payload.credit_account,
            amount=payload.amount,
            narration=payload.narration,
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/confirm", response_model=ResponseEnvelope[dict])
def confirm_reconciliation_period(
    payload: ConfirmPeriodRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        res = ReconciliationService.confirm_period(
            db=db,
            period_name=payload.period_name,
            notes=payload.notes,
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/lock", response_model=ResponseEnvelope[dict])
def lock_reconciliation_period(
    payload: LockPeriodRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        res = ReconciliationService.lock_period(
            db=db,
            period_name=payload.period_name,
            notes=payload.notes,
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/unlock", response_model=ResponseEnvelope[dict])
def unlock_reconciliation_period(
    payload: UnlockPeriodRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        res = ReconciliationService.unlock_period(
            db=db,
            period_name=payload.period_name,
            reason=payload.reason,
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/export")
def export_reconciliation(
    request: Request,
    period_name: Optional[str] = Query(None, alias="period_name"),
    match_status: Optional[str] = Query(None, alias="match_status"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        csv_content = ReconciliationService.export_reconciliation(
            db=db,
            period_name=period_name,
            match_status=match_status,
            current_admin=current_admin,
            ip_address=request.client.host if request and request.client else None,
        )
        export_name = f"reconciliation_{datetime.now().date().isoformat()}.csv"
        return StreamingResponse(
            iter([csv_content.encode("utf-8")]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{export_name}"'},
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
