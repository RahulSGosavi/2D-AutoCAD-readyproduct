# Quick Setup Guide for 2D CAD Editor

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL (or use Supabase)

## Step 1: Backend Setup

```bash
cd backend_python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend_python/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/cad_editor
JWT_SECRET=your-secret-key-min-32-chars-change-in-production
CORS_ORIGINS=http://localhost:5173
```

Start backend:
```bash
uvicorn main:app --reload --port 8000
```

## Step 2: Frontend Setup

```bash
# Install dependencies
npm install

# Copy CAD-specific package.json if needed
# cp package.json.cad package.json

# Start dev server
npm run dev
```

Create `.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

## Step 3: Run Tests

Backend:
```bash
cd backend_python
pytest tests/
```

Frontend:
```bash
npm test
```

Integration:
```bash
npx playwright install
npx playwright test
```

## Step 4: Use the Editor

1. Open http://localhost:5173
2. Click "Wall" tool
3. Click and drag to draw walls
4. Click "Door" tool and click on a wall to place door
5. Use keyboard shortcuts (see README_CAD.md)

## File Structure

The new CAD editor is in:
- `src_cad/` - Frontend React components
- `backend_python/` - FastAPI backend

The original Konva-based editor remains in:
- `src/` - Original editor
- `backend/` - Original Node.js backend

You can run both side-by-side or migrate gradually.

## Next Steps

1. Integrate the new Editor component into your existing app
2. Connect to your database
3. Customize catalog items
4. Deploy to production

See `README_CAD.md` for full documentation.

