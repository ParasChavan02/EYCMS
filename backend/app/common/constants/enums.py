from enum import Enum

class RoleEnum(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    ACCOUNTS = "ACCOUNTS"
    USER = "USER"

class TransactionStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVISION_REQUESTED = "REVISION_REQUESTED"

class UCStatusEnum(str, Enum):
    PENDING = "PENDING"
    TEMPLATE_GRANTED = "TEMPLATE_GRANTED"
    SUBMITTED = "SUBMITTED"
    VERIFIED = "VERIFIED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class TicketStatusEnum(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class ReportStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVISION_REQUESTED = "REVISION_REQUESTED"

class EventStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class NotificationStatusEnum(str, Enum):
    READ = "READ"
    UNREAD = "UNREAD"

class ApprovalStatusEnum(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVISION_REQUESTED = "REVISION_REQUESTED"
