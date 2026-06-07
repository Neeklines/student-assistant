import os
from dotenv import load_dotenv

load_dotenv()  # REQUIRED for dev

ENV = os.getenv("ENV", "dev")

# Database
MYSQL_URL = os.getenv("MYSQL_URL", "mysql+pymysql://user:password@localhost/demo_db")
SQLITE_URL = os.getenv("SQLITE_URL", "sqlite:///./local.db")

# Auth
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

# Meta
GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")
DEPLOYED_AT = os.getenv("DEPLOYED_AT", "unknown")


def get_database_url():
    if ENV == "prod":
        return MYSQL_URL
    return SQLITE_URL
