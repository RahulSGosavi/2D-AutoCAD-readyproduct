# 2D CAD Editor - Production Ready

A production-ready 2D CAD editor built with React, TypeScript, Tailwind, Zustand, and FastAPI. Designed for smooth interactions similar to 2020 Design.

## Features

### ✅ Core Features

1. **Wall Tool** - Smooth click-drag drawing with:
   - Snap to grid and other walls (8px tolerance)
   - Temporary dimensions while drawing
   - Handles for resizing/extending
   - Move, rotate, and offset walls (Alt + drag = parallel copy)
   - Split wall on "S" key at nearest point
   - 60fps smooth rendering

2. **Door & Window Tool** - Insert openings on walls:
   - Auto-align with wall angle
   - Live swing arc visualization (left/right toggle)
   - Collision detection with furniture/openings
   - Auto centerline dimension updates

3. **Snap & Grid System**:
   - Configurable grid spacing
   - Snap to grid, endpoints, midpoints, intersections
   - Visual snap indicators (blue nodes)
   - Global settings: enableSnap, snapTolerance, gridVisible

4. **Dimension Tool**:
   - Auto-generate linear dimensions for:
     - Wall-to-wall distances
     - Room width/height
     - Item-to-item spacing
     - Centerlines for appliances and doors
   - Auto-update on wall/object movement
   - Units: mm, cm, inch
   - Export as DXF entities

5. **Furniture/Cabinet Placement**:
   - Drag items from sidebar
   - Footprint preview while dragging
   - Snap to wall or grid
   - Rotate (R), flip (F), delete (Del)
   - Metadata: width_mm, depth_mm, height_mm, sku, price

6. **Collision & Clearance Check**:
   - Door swing clearance (900mm)
   - Appliance clearance (fridge/oven)
   - Overlapping geometry detection
   - Suggested fixes (shift by X mm)

7. **Export Functions**:
   - DXF with layers: WALLS, DOORS, WINDOWS, ITEMS, DIMENSIONS
   - SVG with scale bar and units
   - BOM CSV

8. **Performance Optimization**:
   - requestAnimationFrame for pointer-based rendering
   - Debounced expensive geometry operations
   - Web Workers for heavy math (snapping, collision)
   - Minimal React re-renders using memo + Zustand selectors
   - 50-60 FPS maintained

9. **Undo/Redo System**:
   - Command pattern (create, update, delete actions)
   - Ctrl+Z, Ctrl+Y support
   - Group multiple edits into transactions
   - History persists across reloads via backend sync

## Project Structure

```
.
├── backend_python/          # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API routes (auth, catalog, bom, collision, export)
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── utils/          # Geometry, collision utilities
│   ├── tests/             # PyTest tests
│   └── requirements.txt
│
├── src_cad/               # React frontend
│   ├── components/        # React components
│   │   ├── Editor.tsx     # Main editor wrapper
│   │   ├── WallTool.tsx
│   │   ├── DoorWindowTool.tsx
│   │   ├── FurnitureTool.tsx
│   │   ├── GridSnap.tsx
│   │   └── DimensionLayer.tsx
│   ├── store/
│   │   └── useEditorStore.ts  # Zustand store
│   └── utils/
│       ├── geometry.ts    # Geometry utilities
│       ├── snapping.ts    # Snap calculations
│       └── dimensions.ts  # Dimension calculations
│
└── tests/
    └── integration/       # Playwright tests
```

## Setup Instructions

### Backend (FastAPI)

1. **Install dependencies:**
   ```bash
   cd backend_python
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/cad_editor
   JWT_SECRET=your-secret-key-min-32-chars
   CORS_ORIGINS=http://localhost:5173
   ```

3. **Run database migrations:**
   ```bash
   # Create tables (SQLAlchemy will auto-create on startup)
   python -m app.database
   ```

4. **Start server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend (React)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Testing

### Backend Tests

```bash
cd backend_python
pytest tests/
```

### Frontend Tests

```bash
npm test
```

### Integration Tests (Playwright)

```bash
npx playwright install
npx playwright test
```

## Usage

### Drawing Walls

1. Click "Wall" tool
2. Click and drag on canvas to draw
3. Release to finish wall
4. Temporary dimensions show while drawing
5. Press "S" while wall is selected to split at nearest point

### Placing Doors/Windows

1. Click "Door" or "Window" tool
2. Hover over a wall (it will highlight)
3. Click to place opening
4. Door swing arc shows automatically

### Placing Furniture

1. Click "Furniture" tool
2. Select item from catalog sidebar
3. Click on canvas to place
4. Use "R" to rotate, "F" to flip, "Del" to delete

### Keyboard Shortcuts

- `Ctrl+Z` / `Ctrl+Y` - Undo/Redo
- `S` - Split wall at nearest point
- `R` - Rotate selected furniture
- `F` - Flip selected furniture
- `Del` / `Backspace` - Delete selected items
- `Ctrl+Click` - Pan canvas
- `Wheel` - Zoom in/out

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Catalog
- `GET /api/catalog/items` - Get catalog items
- `POST /api/catalog/items` - Create catalog item
- `PUT /api/catalog/items/{id}` - Update catalog item
- `DELETE /api/catalog/items/{id}` - Delete catalog item

### BOM
- `POST /api/bom/update` - Calculate BOM from furniture list

### Collision
- `POST /api/collision/check` - Check for collisions and clearance violations

### Export
- `GET /api/export?format=dxf|svg|csv&project_id={id}` - Export project

## Performance Tips

1. **Use Web Workers** for heavy geometry calculations (already implemented)
2. **Debounce** expensive operations (snapping, collision checks)
3. **Memoize** React components with `React.memo`
4. **Use Zustand selectors** to minimize re-renders
5. **RequestAnimationFrame** for smooth pointer interactions

## Deployment

### Backend (Render/Railway/Heroku)

1. Set environment variables
2. Deploy from Git repository
3. Ensure PostgreSQL database is configured

### Frontend (Vercel/Netlify)

1. Set `VITE_API_URL` environment variable
2. Deploy from Git repository
3. Build command: `npm run build`
4. Publish directory: `dist`

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.

