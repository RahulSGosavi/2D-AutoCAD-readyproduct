# KABS 2D Design Tool

A production-ready, industry-standard 2D CAD design tool built with React, TypeScript, and Konva. Features multi-tenant architecture, database connectivity, and enterprise-grade security.

## 🚀 Features

- **Professional CAD Tools**: Line, polyline, rectangle, circle, ellipse, arc, freehand drawing
- **Architectural Elements**: Walls, doors, windows with AutoCAD-style rendering
- **Furniture Library**: Comprehensive block library with furniture, appliances, fixtures
- **PDF Background Support**: Import and overlay PDF drawings
- **Multi-Tenant Architecture**: Company-based data isolation
- **Cloud Storage**: PostgreSQL database with version history
- **Authentication**: Secure JWT-based authentication
- **Auto-save**: Automatic project saving with version control
- **Snap & Grid**: Professional snapping and grid system
- **Dimension Tools**: Precise measurement and dimensioning
- **Export**: Export to PNG, SVG, PDF

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (for production)
- Git

## 🛠️ Quick Start

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd kab-2d-design-tool
```

2. **Install Frontend Dependencies**
```bash
npm install
```

3. **Setup Backend** (for production features)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run dev
```

4. **Start Frontend**
```bash
# From project root
npm run dev
```

5. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Production Setup

For detailed production deployment instructions, see **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)**

## 📁 Project Structure

```
kab-2d-design-tool/
├── backend/              # Express API server
│   ├── src/
│   │   ├── config/      # Database configuration
│   │   ├── db/          # Database schema
│   │   ├── middleware/  # Auth, error handling
│   │   ├── routes/      # API endpoints
│   │   └── server.ts    # Main server file
│   └── package.json
├── src/
│   ├── canvas/          # Canvas components
│   ├── components/      # UI components
│   ├── layout/          # Layout components
│   ├── services/        # API service
│   ├── state/           # Zustand store
│   └── tools/           # Drawing tools
└── package.json
```

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Register**: Create a new company and admin user
2. **Login**: Authenticate with email and password
3. **Projects**: All projects are company-scoped

## 🗄️ Database Schema

- **Companies**: Multi-tenant isolation
- **Users**: Company-scoped user accounts
- **Projects**: Project metadata
- **Project Data**: Versioned design data (JSONB)
- **PDF Backgrounds**: PDF file references

See `backend/src/db/schema.sql` for complete schema.

## 🔧 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=KABS 2D Design Tool
```

### Backend (.env)
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/kab_design_tool
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register company and user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/data` - Save project data
- `DELETE /api/projects/:id` - Delete project

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Vite + Konva
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 14+
- **State Management**: Zustand
- **Authentication**: JWT tokens
- **Storage**: PostgreSQL with JSONB for project data

## 🔒 Security Features

- JWT token authentication
- Password hashing (bcrypt)
- Company-based data isolation
- Rate limiting
- Input validation
- SQL injection prevention
- CORS configuration
- Security headers (Helmet)

## 📦 Deployment

### Render Deployment (Recommended)
See **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** for step-by-step Render deployment instructions.

**Quick Deploy:**
1. Backend: Web Service on Render (root: `backend`)
2. Frontend: Static Site on Render (root: `.`)
3. Set environment variables as documented

### Option 1: Traditional Server
- Deploy backend with PM2
- Deploy frontend to Nginx
- Use managed PostgreSQL

### Option 2: Docker
- Use provided docker-compose.yml
- Deploy to any Docker host

### Option 3: Cloud Platforms
- Railway, Render, Fly.io
- AWS, Google Cloud, Azure
- Use managed database services

See **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** for detailed instructions.

## 🧪 Development

```bash
# Frontend development
npm run dev

# Backend development
cd backend
npm run dev

# Build for production
npm run build
cd backend
npm run build
```

## 📝 Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server (watch mode)
- `npm run build` - Build TypeScript
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check connection string in .env
- Verify firewall rules

### CORS Errors
- Update CORS_ORIGIN in backend .env
- Ensure frontend URL matches exactly

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration
- Clear browser localStorage

## 📖 User Manual

### Getting Started

After launching the application, you'll see the main canvas with toolbars on all sides:
- **Left Toolbar**: Drawing and selection tools
- **Top Bar**: File operations, panels, and search
- **Bottom Bar**: View modes, zoom, export, and settings
- **Right Panels**: Blocks, Layers, and Properties

---

### 🖱️ Selection & Navigation Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| **Select** | V | Click to select elements. Shift+Click for multi-select. Drag to create selection window. |
| **Pan** | H | Click and drag to pan the canvas. Also use middle mouse button or hold Space. |
| **Zoom** | Mouse Wheel | Scroll to zoom in/out. Use zoom controls in top-right corner. |

---

### ✏️ Drawing Tools

| Tool | Shortcut | How to Use |
|------|----------|------------|
| **Line** | L | Click start point, click end point. |
| **Polyline** | PL | Click multiple points to create connected lines. Double-click or press Enter to finish. |
| **Rectangle** | R | Click and drag from corner to opposite corner. |
| **Circle** | C | Click center point, then click to set radius. |
| **Ellipse** | EL | Click center, drag to set horizontal and vertical radii. |
| **Arc** | A | Click center, then click to define the arc curve. |
| **Freehand/Pencil** | P | Click and drag to draw freehand lines. |
| **Text** | T | Click to place text, then type. Press Enter to confirm. |

---

### 🏗️ Architecture Tools

| Tool | Shortcut | How to Use |
|------|----------|------------|
| **Wall** | W | Click start point, click end point. Walls have thickness and snap to other walls. |
| **Door** | D | Click on a wall to place a door. Door will align with wall angle. |
| **Window** | N | Click on a wall to place a window. Window will align with wall angle. |

---

### 📐 Dimension & Measurement

| Tool | Shortcut | How to Use |
|------|----------|------------|
| **Dimension** | M | Click start point, click end point to create a dimension line with measurement. |

---

### 🗑️ Editing Tools

| Tool | Shortcut | How to Use |
|------|----------|------------|
| **Erase** | E | Click on elements to delete them. |
| **Delete** | Del/Backspace | Delete selected elements. |
| **Undo** | Ctrl+Z | Undo last action. |
| **Redo** | Ctrl+Y | Redo undone action. |

---

### 🪑 Blocks Panel (Right Side)

The Blocks panel contains furniture, appliances, and fixtures:

1. **Search**: Type to filter blocks by name
2. **Categories**: Click "All" or specific category buttons
3. **Drag & Drop**: Drag any block onto the canvas to place it
4. **Available Categories**:
   - Beds (Single, Double, King)
   - Sofas (2-seater, 3-seater, L-shaped)
   - Tables (Dining, Coffee, Side)
   - Cabinets (Base, Wall, Wardrobe)
   - Kitchen (Sink, Hob, Refrigerator)
   - Bathroom (WC, Basin, Shower)

---

### 📚 Layers Panel (Right Side)

Manage drawing layers for organization:

1. **Add Layer**: Click "+" to create new layer
2. **Select Layer**: Click layer name to make it active
3. **Toggle Visibility**: Click eye icon to show/hide layer
4. **Lock Layer**: Click lock icon to prevent editing
5. **Rename**: Double-click layer name to rename

---

### ⚙️ Properties Panel (Right Side)

When an element is selected:

1. **Position**: X and Y coordinates
2. **Size**: Width and Height (for applicable elements)
3. **Rotation**: Rotate element 0-360 degrees using slider
4. **Stroke Color**: Line/border color
5. **Fill Color**: Interior fill color
6. **Stroke Width**: Line thickness

---

### 🎨 Global Attributes (Top Bar → Toggle)

Apply changes to multiple elements at once:

1. **Category Selection**: All, Cabinets, Furniture, Walls, or Selected
2. **Stroke Color**: Apply stroke color to category
3. **Fill Color**: Apply fill color to category
4. Click "Apply to [Category]" to execute

---

### 📄 PDF Import & Export

#### Importing PDF:
1. Click **Upload** button (bottom bar)
2. Select a PDF file
3. PDF loads as background - use page navigation to switch pages
4. Draw on top of the PDF - drawings are page-specific

#### Exporting:
1. Click **Download** button (bottom bar)
2. Choose export format:
   - **PDF - Current Page**: Export only the current PDF page with your drawings
   - **PDF - All Pages**: Export all pages with their respective drawings
   - **PNG (4K)**: High-resolution image export
   - **JSON**: Save project for later editing

---

### 🖼️ View Modes (Bottom Bar)

| Mode | Description |
|------|-------------|
| **Floor Plan** | Main drawing canvas for creating floor plans |
| **Layout** | Arrange floor plans and title blocks for printing/export |

---

### 📐 Layout Page (Print Preparation)

1. Switch to **Layout** mode from bottom bar
2. **Paper Size**: Select A4, A3, A2, A1, Letter, Legal, or Tabloid
3. **Orientation**: Portrait or Landscape
4. **Title Block**: Edit company name, project name, customer info, date, scale
5. **Pages**: Add multiple pages, each can show different floor plan pages
6. **Export**: 
   - "Export This Page" - Single page PDF
   - "Export All Pages" - Multi-page PDF document

---

### 🔧 Bottom Bar Controls

| Control | Description |
|---------|-------------|
| **Grid** | Toggle snap grid visibility |
| **Snap** | Toggle snapping to grid/elements |
| **Collision** | Toggle collision detection |
| **Ortho** | Toggle orthogonal mode (horizontal/vertical lines only) |
| **Link** | Toggle link mode (keep elements attached) |
| **Zoom %** | Current zoom level - click to reset to 100% |
| **Unit** | Switch between mm, cm, m, in, ft |

---

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Ctrl+K** | Open command palette |
| **Delete/Backspace** | Delete selected |
| **Escape** | Cancel current operation / Deselect |
| **Space (hold)** | Temporary pan mode |
| **Shift+Click** | Add to selection |

---

### 🖱️ Right-Click Context Menu

Right-click on any selected element for:
- **Duplicate**: Create a copy offset by 20px
- **Delete**: Remove the element
- **Center On...**: Center element on another (select 2 elements first)
- **Rotate 90°**: Rotate element by 90 degrees
- **Flip Horizontal**: Mirror element horizontally
- **Flip Vertical**: Mirror element vertically

---

### 💾 Auto-Save & Manual Save

- **Auto-Save**: Enabled by default - saves every few seconds
- **Manual Save**: Click "Save" button in floor plan page tabs
- **AutoSave Toggle**: Check/uncheck "AutoSave" checkbox to enable/disable

---

### 📱 Multi-Page Floor Plans

1. **Add Page**: Click "+" next to page tabs at bottom of canvas
2. **Switch Pages**: Click on page tab (Page 1, Page 2, etc.)
3. **Rename Page**: Double-click page tab to rename
4. **Delete Page**: Right-click page tab (if more than one page)
5. Each page maintains separate drawings

---

## 📄 License

[Your License Here]

## 🤝 Contributing

[Contributing Guidelines]

## 📞 Support

For setup and deployment help, refer to:
- `PRODUCTION_SETUP.md` - Detailed setup guide
- `backend/README.md` - Backend documentation
- `IMPLEMENTATION_COMPLETE.md` - Implementation details

---

**Status**: ✅ Production-ready
**Version**: 1.0.0
