# wehandle.ai

Monorepo:
- `client/` - Merchant frontend (Vite/React)
- `admin/` - Admin frontend (Vite/React)
- `server/` - FastAPI backend

## Fast + Simple Run Mode (Default)

Use this mode for local dev and early server deployments.

### What you need running
- PostgreSQL
- Backend API (`uvicorn`)
- Frontend (`vite`)

### What you do NOT need by default
- Redis
- Celery worker

Knowledge embeddings now run inline unless `USE_CELERY=true`.

## Backend Setup (`server/`)

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:
- API root: `http://localhost:8000`
- Health: `http://localhost:8000/health`

## Frontend Setup (`client/`)

```powershell
cd client
npm install
npm run dev
```

Frontend URL:
- `http://localhost:5173`

## Optional: Re-enable Background Queue Later

When you need scale, flip to queue mode:

1. In `server/.env`, set:
   - `USE_CELERY=true`
2. Start Redis
3. Start Celery worker:

```powershell
cd server
.\.venv\Scripts\Activate.ps1
celery -A app.core.celery_app.celery_app worker --loglevel=info --pool=solo
```

Notes:
- `--pool=solo` is recommended on Windows.
- If Redis/Celery are not running, keep `USE_CELERY` unset/false.