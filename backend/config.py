import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Application
    APP_NAME = "FraudShield"
    VERSION = "2.0.0"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fraudshield.db")
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # CORS
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    
    # SSL
    SSL_CERTFILE = os.getenv("SSL_CERTFILE")
    SSL_KEYFILE = os.getenv("SSL_KEYFILE")
    
    # AWS S3 (for file storage)
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

settings = Settings()