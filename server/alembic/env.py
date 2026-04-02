from logging.config import fileConfig

from sqlalchemy import create_engine


import sys
import os

# Alembic context/config
from alembic import context

# Add the server directory to python path so we can import 'app'
sys.path.append(os.getcwd())

# Alembic must run migrations using a synchronous SQLAlchemy engine.
# Our app uses asyncpg, so we convert `postgresql+asyncpg://` -> `postgresql://` for migrations only.
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL environment variable is required")

sync_database_url = database_url
if sync_database_url.startswith("postgresql+asyncpg://"):
    sync_database_url = sync_database_url.replace("postgresql+asyncpg://", "postgresql://", 1)

# Override alembic.ini value so all modes use env-provided URL.
config = context.config
config.set_main_option("sqlalchemy.url", sync_database_url)

# Import your models
from app.core.database import Base
from app.models import * # Registers all models (Merchant, Ticket, etc)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata
# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_engine(sync_database_url)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
