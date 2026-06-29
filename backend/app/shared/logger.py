import logging
import sys

# Standardized logging pattern format
LOG_FORMAT = "%(asctime)s - %(levelname)s - [%(name)s] - %(message)s"

# Setup basic logging configurations
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Root application logger
logger = logging.getLogger("eycms")

def get_logger(name: str) -> logging.Logger:
    """
    Retrieve a named sub-logger instance for specific modules.
    """
    return logger.getChild(name)
