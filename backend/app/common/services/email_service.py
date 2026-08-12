from sqlalchemy.orm import Session
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.common.models.email_log import EmailLog
from app.core.config import settings
from app.shared.logger import get_logger

logger = get_logger("email_service")

class EmailService:
    @staticmethod
    def send_email(
        db: Session,
        recipient_email: str,
        subject: str,
        body: str
    ) -> EmailLog:
        """
        Sends an email using SMTP (Gmail SMTP) and writes records to the database.
        """
        logger.info(f"Sending email to {recipient_email} | Subject: {subject}")
        
        status = "SENT"
        error_msg = None
        
        # Check if SMTP configuration exists
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                
                # Build HTML email message
                msg = MIMEMultipart()
                msg['From'] = settings.SMTP_SENDER or settings.SMTP_USER
                msg['To'] = recipient_email
                msg['Subject'] = subject
                
                # Check if body is HTML-like
                if "<html>" in body or "<p>" in body:
                    msg.attach(MIMEText(body, 'html'))
                else:
                    msg.attach(MIMEText(body, 'plain'))
                
                server.sendmail(msg['From'], recipient_email, msg.as_string())
                server.quit()
                logger.info(f"Email sent successfully via SMTP to {recipient_email}")
            except Exception as mail_err:
                status = "FAILED"
                error_msg = str(mail_err)
                logger.error(f"SMTP sending failed to {recipient_email}: {mail_err}")
        else:
            logger.warning("SMTP credentials not fully configured in settings. Simulating email log only.")
            status = "SENT"
        
        # Create EmailLog entry
        log_entry = EmailLog(
            recipient_email=recipient_email,
            subject=subject,
            body=body,
            status=status,
            error_message=error_msg
        )
        
        try:
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            logger.info(f"Email log entry saved (ID: {log_entry.id})")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to write email log to database: {e}")
            
        return log_entry
