# KAB 2D Design Tool

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
VITE_APP_NAME=KAB 2D Design Tool
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
