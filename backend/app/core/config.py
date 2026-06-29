import json
import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "E-YUVA ERP API"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "postgresql+pg8000://postgres:postgres@localhost:5432/eycms"
    
    # Security
    JWT_SECRET_KEY: str = "supersecretjwtkeyforlocaldevelopmentonly12345!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS setup
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]

    # File Storage Paths (relative to backend root)
    UPLOAD_BASE_DIR: str = "uploads"
    UPLOAD_DIR_TRANSACTIONS: str = os.path.join("uploads", "transactions")
    UPLOAD_DIR_REPORTS: str = os.path.join("uploads", "reports")
    UPLOAD_DIR_REPORT_IMAGES: str = os.path.join("uploads", "report-images")
    UPLOAD_DIR_UC: str = os.path.join("uploads", "uc")
    UPLOAD_DIR_EVENTS: str = os.path.join("uploads", "events")
    UPLOAD_DIR_SUPPORT: str = os.path.join("uploads", "support")
    UPLOAD_DIR_AVATARS: str = os.path.join("uploads", "avatars")
    UPLOAD_DIR_TEMPLATES: str = os.path.join("uploads", "templates")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                return []
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [i.strip() for i in v_stripped.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
