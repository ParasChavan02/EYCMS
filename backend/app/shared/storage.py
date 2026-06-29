from abc import ABC, abstractmethod
import os
import shutil
from fastapi import UploadFile
from app.core.config import settings

class StorageService(ABC):
    """
    Abstract interface for managing file storage.
    Enables swapping local uploads with cloud storage providers (S3/Azure)
    without affecting business logic modules.
    """
    @abstractmethod
    def save_file(self, file: UploadFile, folder: str) -> str:
        """
        Save file to target folder directory and return metadata path/url.
        """
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file given its path/url.
        """
        pass

class LocalStorageService(StorageService):
    """
    Local filesystem storage provider implementation.
    """
    def __init__(self, base_dir: str = settings.UPLOAD_BASE_DIR):
        self.base_dir = base_dir
        # Initialize default structured folders
        os.makedirs(settings.UPLOAD_DIR_TRANSACTIONS, exist_ok=True)
        os.makedirs(settings.UPLOAD_DIR_REPORTS, exist_ok=True)
        os.makedirs(settings.UPLOAD_DIR_REPORT_IMAGES, exist_ok=True)
        os.makedirs(settings.UPLOAD_DIR_UC, exist_ok=True)
        os.makedirs(settings.UPLOAD_DIR_EVENTS, exist_ok=True)
        os.makedirs(settings.UPLOAD_DIR_SUPPORT, exist_ok=True)
        os.makedirs(settings.UPLOAD_DIR_AVATARS, exist_ok=True)
        os.makedirs(settings.UPLOAD_DIR_TEMPLATES, exist_ok=True)

    def save_file(self, file: UploadFile, folder: str) -> str:
        # Build path target
        target_dir = os.path.join(self.base_dir, folder)
        os.makedirs(target_dir, exist_ok=True)
        
        file_path = os.path.join(target_dir, file.filename)
        
        # Write binary stream locally
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

    def delete_file(self, file_path: str) -> bool:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                return True
            except OSError:
                return False
        return False

# Global S3-ready default storage instance
storage_service = LocalStorageService()
