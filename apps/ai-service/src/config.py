from pathlib import Path

from pydantic_settings import BaseSettings

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    database_url: str
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    redis_url: str = ""
    port: int = 8000
    api_key: str = ""

    model_config = {"env_file": str(_env_path), "extra": "ignore"}


settings = Settings()  # pyright: ignore[reportCallIssue]
