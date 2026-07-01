from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    port: int = 8000

    model_config = {"env_file": ".env"}

settings = Settings()