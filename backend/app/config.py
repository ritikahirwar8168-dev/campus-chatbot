from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str = "campus-copilot-demo-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "sqlite:///./campus_copilot.db"

    # Legacy OpenAI-compatible settings (kept for backwards compat)
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"

    # Ollama / Gemma settings (primary AI provider)
    ollama_enabled: bool = True
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "gemma3:4b"
    ollama_api_key: str = ""  # Ollama doesn't require a key, but the field is here for proxied setups

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


settings = Settings()
