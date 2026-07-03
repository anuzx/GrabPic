from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    redis_url: str 
    port: int = 8000

    model_config = {"env_file": "../../.env", "extra": "ignore"}


settings = Settings()
