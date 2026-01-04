# GEIMS Complaint Portal

A production-ready complaint management system with a modern React frontend and secure Node.js/Express backend.

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, Rate Limiting, Mongo Sanitize
- **Email**: Nodemailer
- **File Upload**: Multer

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: React Icons

## Features

### User Roles
- **Admin**: Manage students, review complaints, update status
- **Student**: Submit complaints, track status, view responses

### Admin Features
- Dashboard with statistics and status breakdown
- Add students individually or via CSV upload
- Review and manage complaints
- Update complaint status (Read → Under Review → Resolved)
- Add acknowledgment/response to complaints
- Email notifications on status changes

### Student Features
- Secure login with forced password change on first login
- Submit complaints (10-5000 words) with optional image attachment
- Track complaint status
- View admin responses

### Security Features
- OWASP Top 10 compliance
- Rate limiting (5 attempts/15min for login, 100 req/15min API)
- Input validation with Zod
- JWT authentication
- Password hashing (bcrypt, 12 salt rounds)
- NoSQL injection prevention
- HTTP security headers (Helmet)
- CORS configuration
- File upload validation

## Project Structure

```
GEIMS_complaint-portal/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & email config
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Auth, validation, rate limiting
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Email service
│   │   ├── utils/          # Helper utilities
│   │   ├── validators/     # Zod schemas
│   │   └── index.js        # App entry point
│   └── uploads/            # Image uploads directory
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context (Auth)
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin dashboard pages
│   │   │   └── student/    # Student dashboard pages
│   │   ├── services/       # API client
│   │   ├── App.jsx         # Router setup
│   │   └── main.jsx        # Entry point
│   └── index.html
└── README.md
```

## Requirements

- Node.js 18+
- MongoDB 6+
- npm or yarn

## Setup

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Environment Configuration

**Backend** - Create `backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/geims_complaints

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Admin Seed
ADMIN_EMAIL=admin@geims.edu
ADMIN_PASSWORD=Admin@123456
ADMIN_NAME=System Administrator

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=GEIMS Complaint Portal
SMTP_FROM_EMAIL=noreply@geims.edu

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**Frontend** - Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=GEIMS Complaint Portal
```

### 3. Start MongoDB

Make sure MongoDB is running locally or update `MONGODB_URI` to point to your MongoDB instance.

### 4. Run the Application

**Development mode** (from root):
```bash
npm run dev
```

Or run separately:
```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Default Admin Login

On first run, an admin account is automatically seeded:
- **Email**: admin@geims.edu (or as set in `ADMIN_EMAIL`)
- **Password**: Admin@123456 (or as set in `ADMIN_PASSWORD`)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password

### Admin Routes (Protected)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/students` - List all students
- `POST /api/admin/students` - Add single student
- `POST /api/admin/students/csv` - Import students from CSV
- `DELETE /api/admin/students/:id` - Delete student
- `GET /api/admin/complaints` - List all complaints
- `GET /api/admin/complaints/:id` - Get complaint details
- `PATCH /api/admin/complaints/:id/status` - Update status

### Student Routes (Protected)
- `GET /api/student/stats` - User statistics
- `GET /api/student/complaints` - List user's complaints
- `POST /api/student/complaints` - Submit new complaint

## CSV Upload Format

For bulk student import, use this CSV format:
```csv
name,email,college,password
John Doe,john@example.com,Engineering College,TempPass@123
Jane Smith,jane@example.com,Medical College,TempPass@456
```

## License

MIT
