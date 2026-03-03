from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# Note: We will move this to a secure .env file later.
# We are using asyncpg for high-concurrency operations.
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/wehandle"

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=20, max_overflow=10)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    """Dependency for injecting the DB session into our FastAPI routes."""
    async with AsyncSessionLocal() as session:
        yield session