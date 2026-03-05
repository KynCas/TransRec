# TransRec System - Setup & Deployment Guide

## Prerequisites

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MySQL Server** (v5.7 or higher) - [Download](https://www.mysql.com/downloads/mysql/)
3. **Git** (optional, for version control)

---

## Step-by-Step Setup

### Step 1: Install Node Dependencies

```bash
# Navigate to the project directory
cd transrec-web

# Install required packages
npm install
```

This will install:
- Express.js (web framework)
- MySQL2 (database driver)
- Socket.io (real-time updates)
- Bcrypt (password hashing)
- Express-session (session management)
- Multer (file uploads)

---

### Step 2: Configure MySQL Database

#### Option A: Using MySQL Command Line

1. **Open MySQL Command Line**:
   ```bash
   mysql -u root -p
   ```
   Enter your MySQL password (if set)

2. **Create the database**:
   ```sql
   CREATE DATABASE transrec;
   ```

3. **Exit MySQL**:
   ```sql
   EXIT;
   ```

#### Option B: Using DBeaver (Recommended for GUI)

1. Open DBeaver
2. Right-click "Databases" → New Database
3. Name: `transrec`
4. Click "Finish"

---

### Step 3: Update Server Configuration (if needed)

If your MySQL has a **password**, edit `server-mysql.js`:

```javascript
// Line ~14 - Update the password field
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'YOUR_PASSWORD_HERE',  // ← Change this
  database: 'transrec',
  port: 3306,
  ...
});
```

Also update `migrate-mysql.js` with the same password.

---

### Step 4: Run Database Migration

Create all required tables by running the migration:

```bash
node migrate-mysql.js
```

Output should show:
```
✓ Users table created
✓ Students table created
✓ Requirements table created
✓ Documents table created
✓ Timeline events table created
✓ Notifications table created

✅ Database migration completed successfully!
```

---

### Step 5: Start the Server

```bash
npm start
```

Output should show:
```
TransRec Server running on http://localhost:3000
Make sure MySQL is running with database 'transrec' on 127.0.0.1:3306
```

---

### Step 6: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

---

## Testing the System

### Create Test Users

#### Student Account
1. Click "Student" role
2. Email: `student@test.com`
3. Password: `test1234`
4. Sign Up
5. Login with same credentials

#### Teacher Account
1. Click "Teacher" role
2. Email: `teacher@test.com`
3. Password: `test1234`
4. Sign Up
5. Login with same credentials

#### Registrar Account
1. Click "Registrar" role
2. Email: `registrar@test.com`
3. Password: `test1234`
4. Sign Up
5. Login with same credentials

---

## Feature Overview

### Student Dashboard
- View overall application status
- See progress percentage
- Track application stage (Pending/In Review/For Completion/Approved)
- **Cannot** see detailed requirements (privacy feature)

### Teacher Dashboard
- View assigned students with pending requirements
- Upload documents for each requirement
- Mark assignments as complete
- Add new transfer students with comprehensive information
- Receive notifications from registrar

### Registrar Dashboard
- System overview with statistics
- Complete student list with status labels
- Search students by name or ID
- View detailed requirements checklist
- Verify requirement completion
- Real-time updates for all changes

---

## Troubleshooting

### "Connection refused" Error
**Problem**: MySQL is not running
**Solution**:
1. Start MySQL Server:
   - **Windows**: Services → MySQL → Start
   - **Mac**: System Preferences → MySQL → Start
   - **Linux**: `sudo systemctl start mysql`

### "Database doesn't exist" Error
**Problem**: Migration wasn't run
**Solution**:
```bash
node migrate-mysql.js
```

### "Password authentication failed"
**Problem**: MySQL password mismatch
**Solution**:
1. Update `server-mysql.js` with correct password
2. Update `migrate-mysql.js` with correct password
3. Restart the server: `npm start`

### "Port 3000 already in use"
**Problem**: Another app is using port 3000
**Solution**:
```bash
# On Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# On Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

Then restart: `npm start`

### "Empty response from server"
**Problem**: Server is not running or API endpoints not responding
**Solution**:
1. Make sure `npm start` is running
2. Check that MySQL database is connected
3. Look at server console for error messages

---

## Database Schema

### users
- id, email, password, role, created_at, updated_at

### students
- id, user_id, name, student_id, email, phone, grade, section, application_date, previous_school, notes, deadline, created_at, updated_at

### requirements
- id, student_id, name, status (Pending/Complete/Verified), description, created_at, updated_at

### documents
- id, student_id, requirement_id, file_name, file_path, uploaded_by, uploaded_at

### timeline_events
- id, student_id, stage, event_date, created_at

### notifications
- id, recipient_id, sender_id, message, type, read_at, created_at

---

## Deployment Notes

For **production** deployment:

1. Use environment variables for sensitive data (.env file)
2. Enable HTTPS/SSL
3. Use a process manager like PM2 (`npm install -g pm2`)
4. Set `NODE_ENV=production`
5. Use a reverse proxy like Nginx
6. Enable CORS if frontend is on different domain
7. Implement rate limiting and security headers

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify MySQL is running: `mysql -u root`
3. Check server logs in terminal for error messages
4. Ensure Node.js version: `node --version`

