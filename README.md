# TransRec System

A modern, web-based **Student Transfer Records Management System** for Cordova Catholic School Multipurpose Cooperative (CCSMPC).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-v20+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

## 🌟 Overview

TransRec System streamlines the process of tracking student transfer credits and requirements across multiple roles with **real-time updates**, **progress tracking**, and **comprehensive analytics**.

Perfect for schools managing student transfers with role-based workflows:
- **Students** track their transfer progress
- **Teachers** manage student submissions and document uploads
- **Registrars** verify requirements and monitor system analytics

## ✨ Key Features

✅ **Role-Based Access Control**
- Student Portal: View transfer progress, timeline, status updates
- Teacher Dashboard: Create students, upload documents, mark requirements complete
- Registrar Dashboard: System overview, search/filter, verify requirements, export analytics

✅ **Real-Time Updates**
- Socket.io powered live notifications
- Instant dashboard refreshes across all roles
- Timeline tracking of all student activities

✅ **Progress Tracking**
- Visual progress bars (0-100%)
- Status labels: **Pending** → **For Completion** → **In Review** → **Approved**
- Deadline management and automated alerts

✅ **Professional Design**
- Green gradient theme (#0b8457 → #19a974)
- Fully responsive (desktop, tablet, mobile)
- Smooth CSS animations and transitions
- Custom form controls and UI components

✅ **Secure Authentication**
- bcrypt password hashing
- Session-based auth (express-session)
- Multi-step login flow with role selection
- Automatic session timeout

✅ **File Management**
- Document upload for student requirements (via Multer)
- Organized storage per student
- File metadata tracking

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Flexbox, Grid, animations
- **JavaScript (ES6)** - Async/await, fetch API, DOM manipulation
- **Socket.io Client** - Real-time WebSocket communication

### Backend
- **Node.js** (v20+) - JavaScript runtime
- **Express.js** - HTTP server & routing
- **MySQL** (8.0+) - Relational database
- **bcrypt** - Password hashing
- **express-session** - Session management
- **Multer** - File upload handling
- **Socket.io** - WebSocket server

### Hosting
- **Frontend:** FTP hosting (e.g., unaux.com)
- **Backend:** DigitalOcean App Platform, Railway, Heroku, or self-hosted
- **Database:** MySQL (managed or self-hosted)

---

## 📁 Project Structure

```
transrec-web/
├── 📄 index.html              # Landing page
├── 📄 login.html              # Authentication (signup/login)
├── 📄 student.html            # Student dashboard
├── 📄 teacher.html            # Teacher dashboard
├── 📄 registrar.html          # Registrar dashboard
├── 🎨 styles.css              # Global CSS (green theme)
├── 🖼️ logo.png                # School logo
├── 
├── 🔧 server.js               # Express backend server
├── 📊 migrate.js              # MySQL schema initialization
├── 📦 package.json            # Dependencies
├── 📖 README.md               # This file
├── .gitignore                 # Git ignore rules
│
└── 📂 ftp-deploy/             # Frontend-only FTP package
    ├── config.js              # Backend URL configuration
    ├── [HTML/CSS files]
    └── SETUP_NOTES.txt
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20+ ([Download](https://nodejs.org))
- **MySQL** 8.0+ ([Download](https://www.mysql.com))
- **Git** ([Download](https://git-scm.com))

### Local Development (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/YOUR-USERNAME/transrec-web.git
cd transrec-web

# 2. Install dependencies
npm install

# 3. Start MySQL (ensure it's running)
# Windows: Use MySQL Workbench or Services
# macOS:   brew services start mysql-server
# Linux:   sudo systemctl start mysql

# 4. Initialize database
node migrate.js

# 5. Start backend server
npm start
# Server runs on: http://localhost:3000
```

**Access the app:**
- Frontend: `http://localhost:3000`
- Login page: `http://localhost:3000/login.html`

**Test Accounts (create via signup):**
```
Email: student@example.com    | Password: test123 | Role: Student
Email: teacher@example.com    | Password: test123 | Role: Teacher
Email: registrar@example.com  | Password: test123 | Role: Registrar
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/signup               # Register user
POST   /api/login                # Login & create session
POST   /api/logout               # Destroy session
GET    /api/me                   # Get current user
```

### Students
```
GET    /api/students             # List students (role-filtered)
POST   /api/students             # Create student (teacher/registrar)
GET    /api/students/:id/timeline    # Get student timeline
POST   /api/students/:id/submit        # Mark requirement complete
```

### Requirements  
```
POST   /api/students/:sid/requirement/:rid/status    # Verify requirement
```

### File Upload
```
POST   /api/upload               # Upload document
```

---

## 🗄️ Database Schema

**7 Tables:**
- `users` - Accounts (email, password, role)
- `students` - Student records (name, deadline, notes)
- `requirements` - Student requirements (transcript, documents, etc.)
- `documents` - Uploaded files metadata
- `timeline_events` - Activity log per student
- `notifications` - System alerts
- Plus indexes for performance

See `migrate.js` for SQL schema details.

---

## 📤 Deployment

### Option 1: DigitalOcean App Platform (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"  
git push origin main

# 2. On DigitalOcean:
# - Create App
# - Connect GitHub repo (auto-deploy on push)
# - Create MySQL Managed Database
# - Set env variables (DB_HOST, DB_USER, DB_PASSWORD, etc.)
# - Deploy!

# 3. Update frontend config.js:
# const API_BASE_URL = 'https://YOUR-APP.ondigitalocean.app';
```

### Option 2: Railway.app (Free Tier)
```bash
# Connect GitHub repo at railway.app
# Add MySQL plugin
# Deploy
# Update frontend config.js with Railway URL
```

### Option 3: Traditional VPS (DigitalOcean Droplet)
```bash
# SSH into droplet
ssh root@your_droplet_ip

# Install Node.js, MySQL
curl -sL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install nodejs mysql-server

# Clone & run
git clone https://github.com/YOUR-USERNAME/transrec-web.git
cd transrec-web
npm install
node migrate.js
npm start  # or use PM2 for auto-restart
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` (not tracked by Git):

```env
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=transrec
SESSION_SECRET=your_random_secret_key_here
NODE_ENV=production
```

### Frontend API URL

Edit `ftp-deploy/config.js`:

```javascript
// Local testing
const API_BASE_URL = 'http://localhost:3000';

// Production (DigitalOcean, Railway, etc.)
const API_BASE_URL = 'https://your-api-domain.com';
```

---

## 📊 Usage Examples

### Student Workflow
1. Sign up as Student
2. View transfer application status
3. Check requirements progress
4. View timeline of activities

### Teacher Workflow  
1. Login as Teacher
2. Add new transfer student
3. Upload documents for requirements
4. Mark assignments as complete

### Registrar Workflow
1. Login as Registrar
2. View system overview (total students, completion rates)
3. Search for specific student
4. Click "Details" to verify each requirement
5. Update requirement status

---

## 🐛 Troubleshooting

### MySQL Won't Connect
```bash
# Check MySQL is running
mysql -u root -p

# If error: ensure MySQL service is started
# Windows: Services > MySQL > Start
# macOS:   brew services list
# Linux:   sudo systemctl status mysql
```

### Port 3000 Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Frontend Can't Connect to Backend
- ✅ Check `config.js` has correct `API_BASE_URL`
- ✅ Verify backend server is running (`npm start`)
- ✅ Check browser console (F12 > Console) for errors
- ✅ Test API in Postman: `GET http://localhost:3000/api/me`

### Database Migration Fails
```bash
# Ensure MySQL server is running
# Check credentials in server.js
# Run again: node migrate.js
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes
4. Commit: `git commit -m "Add new feature"`
5. Push: `git push origin feature/new-feature`
6. Open Pull Request

---

## 📝 License

MIT License © 2026 CCSMPC

---

## 🗺️ Roadmap

- [ ] Email notifications for deadlines
- [ ] PDF report generation
- [ ] Two-factor authentication
- [ ] Bulk student import (CSV)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] LDAP/Active Directory integration

---

## 📞 Support

- **Issues?** Open a GitHub Issue
- **Questions?** Start a Discussion
- **Email:** contact@your-school.edu

---

**Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Status:** Production Ready ✅
