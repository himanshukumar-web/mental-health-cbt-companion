from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    supabase_url: str = ""
    supabase_service_key: str = ""
    encryption_key: str = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
    cors_origins: str = "http://localhost:3000,http://localhost:8100,http://10.0.2.2:8000,http://192.168.1.4:3000,capacitor://localhost,https://localhost,http://localhost,https://*.vercel.app"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
