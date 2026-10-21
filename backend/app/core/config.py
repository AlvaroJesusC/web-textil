from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración global de la aplicación leída de variables de entorno."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Sistema de Ventas e Inventario Textilería"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Base de datos (SQLite local / PostgreSQL / MySQL)
    DATABASE_URL: str = "sqlite:///./textileria.db"

    # Autenticación y JWT (RNF-22, RNF-23)
    SECRET_KEY: str = "textileria_super_secreta_jwt_key_2026_ucv_calidad_software_98234710293847"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Límite configurable de descuento para vendedor (RN-03, RF-20)
    MAX_DESCUENTO_VENDEDOR: float = 10.0

    # Orígenes permitidos en CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]


settings = Settings()
