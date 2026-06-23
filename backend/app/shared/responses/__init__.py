from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class ResponseEnvelope(BaseModel, Generic[T]):
    """
    Standard API response envelope structure.
    """
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

def make_success_response(data: Any = None) -> dict:
    """
    Helper to generate a successful JSON response dictionary.
    """
    return {"success": True, "data": data, "error": None}

def make_error_response(error: str) -> dict:
    """
    Helper to generate an error JSON response dictionary.
    """
    return {"success": False, "data": None, "error": error}
