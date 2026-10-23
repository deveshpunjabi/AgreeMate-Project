import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    MONGODB_URL: str = Field(default="mongodb://localhost:27017")
    DATABASE_NAME: str = Field(default="agreemate")
    JWT_SECRET: str = Field(...)
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_ISSUER: str = Field(default="agreemate-api")
    JWT_AUDIENCE: str = Field(default="agreemate-web")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    ENVIRONMENT: str = Field(default="development")
    ALLOW_MOCK_STORAGE: bool = Field(default=False)

    # Email configuration (Defaults to port 465 SSL for cloud container resilience)
    SMTP_HOST: str = Field(default="smtp.gmail.com")
    SMTP_PORT: int = Field(default=465)
    SMTP_USERNAME: str | None = Field(default=None)
    SMTP_PASSWORD: str | None = Field(default=None)
    SMTP_FROM: str | None = Field(default=None)
    SMTP_USE_TLS: bool = Field(default=True)

    # Serverless & Schedulers
    CRON_SECRET: str | None = Field(default=None)
    MONGODB_MIN_POOL_SIZE: int = Field(default=0)
    MONGODB_MAX_POOL_SIZE: int = Field(default=10)
    ENABLE_IN_PROCESS_SCHEDULER: bool = Field(default=False)

    CLOUDINARY_CLOUD_NAME: str | None = Field(default=None)
    CLOUDINARY_API_KEY: str | None = Field(default=None)
    CLOUDINARY_API_SECRET: str | None = Field(default=None)
    FRONTEND_URL: str = Field(default="https://agree-mate.vercel.app")

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters long.")
        return value

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
