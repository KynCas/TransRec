const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MySQL Connection Pool
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '', // UPDATE THIS if your MySQL has a password
  database: 'transrec',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use(session({
  secret: 'transrec-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

// File upload configuration
const upload = multer({ 
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Authentication Middleware
function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'not authenticated' });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.session.role === role) return next();
    res.status(403).json({ error: 'forbidden' });
  };
}

// ============== AUTH ROUTES ==============

app.post('/api/signup', async (req, res) => {
  const { email, password, role, name } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  try {
    const conn = await pool.getConnection();
    
    // Check if user exists
    const [users] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      conn.release();
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await conn.execute(
      'INSERT INTO users (email, password, role, created_at) VALUES (?, ?, ?, NOW())',
      [email, hash, role]
    );
    const userId = result.insertId;

    // If student, create student record
    if (role === 'student') {
      const studentId = `S${Date.now()}`;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 90); // 90 days from now

      const [studentResult] = await conn.execute(
        'INSERT INTO students (user_id, name, student_id, deadline, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [userId, name || '', studentId, deadline.toISOString().split('T')[0]]
      );
      const studentId_db = studentResult.insertId;

      // Create timeline entry
      await conn.execute(
        'INSERT INTO timeline_events (student_id, stage, event_date, created_at) VALUES (?, ?, NOW(), NOW())',
        [studentId_db, 'Registered']
      );
    }

    conn.release();
    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const conn = await pool.getConnection();
    const [users] = await conn.execute('SELECT id, email, password, role FROM users WHERE email = ?', [email]);
    conn.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ success: true, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ success: true });
  });
});

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.execute('SELECT id, email, role FROM users WHERE id = ?', [req.session.userId]);
    conn.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============== STUDENT ROUTES ==============

app.get('/api/students', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Get all students with their requirements
    const [students] = await conn.execute(`
      SELECT s.id, s.name, s.student_id, s.email, s.phone, s.grade, 
             s.section, s.application_date, s.previous_school, s.notes,
             s.deadline, s.created_at, s.updated_at
      FROM students s
      ORDER BY s.created_at DESC
    `);

    // For each student, get their requirements
    for (let student of students) {
      const [requirements] = await conn.execute(
        'SELECT id, name, status, description, updated_at FROM requirements WHERE student_id = ?',
        [student.id]
      );
      student.requirements = requirements;
    }

    conn.release();
    res.json(students);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.post('/api/students', requireAuth, async (req, res) => {
  const { name, student_id, email, phone, grade, section, application_date, previous_school, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const conn = await pool.getConnection();

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 90);

    const [result] = await conn.execute(
      'INSERT INTO students (name, student_id, email, phone, grade, section, application_date, previous_school, notes, deadline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, student_id || null, email, phone || null, grade || null, section || null, application_date || null, previous_school || null, notes || null, deadline.toISOString().split('T')[0]]
    );

    const studentId = result.insertId;

    // Create default requirements
    const defaultRequirements = [
      { name: 'Transcript', description: 'Official school transcript' },
      { name: 'Birth Certificate', description: 'Certified copy' },
      { name: 'Good Moral Character', description: 'Certificate of Good Moral Character' },
      { name: 'Form 137', description: 'Official Report Card' },
      { name: 'Medical Records', description: 'Updated medical records' }
    ];

    for (let req of defaultRequirements) {
      await conn.execute(
        'INSERT INTO requirements (student_id, name, status, description, created_at) VALUES (?, ?, ?, ?, NOW())',
        [studentId, req.name, 'Pending', req.description]
      );
    }

    // Add timeline event
    await conn.execute(
      'INSERT INTO timeline_events (student_id, stage, event_date, created_at) VALUES (?, ?, NOW(), NOW())',
      [studentId, 'Student Added']
    );

    conn.release();

    // Notify all connected clients
    io.emit('studentAdded', { id: studentId, name });

    res.json({ success: true, id: studentId });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

app.post('/api/students/:id/submit', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { requirementId } = req.body;

  try {
    const conn = await pool.getConnection();

    await conn.execute(
      'UPDATE requirements SET status = ?, updated_at = NOW() WHERE id = ? AND student_id = ?',
      ['Complete', requirementId, id]
    );

    conn.release();

    // Notify all clients
    io.emit('studentUpdated', { id, requirementId });

    res.json({ success: true });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Failed to submit requirement' });
  }
});

app.get('/api/students/:id/timeline', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const conn = await pool.getConnection();
    const [events] = await conn.execute(
      'SELECT stage, event_date as date FROM timeline_events WHERE student_id = ? ORDER BY event_date ASC',
      [id]
    );
    conn.release();
    res.json(events);
  } catch (err) {
    console.error('Get timeline error:', err);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

app.post('/api/students/:sid/requirement/:rid/status', requireAuth, requireRole('registrar'), async (req, res) => {
  const { sid, rid } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const conn = await pool.getConnection();

    await conn.execute(
      'UPDATE requirements SET status = ?, updated_at = NOW() WHERE id = ? AND student_id = ?',
      [status, rid, sid]
    );

    conn.release();

    io.emit('studentUpdated', { id: sid });

    res.json({ success: true });
  } catch (err) {
    console.error('Update requirement status error:', err);
    res.status(500).json({ error: 'Failed to update requirement' });
  }
});

// ============== FILE UPLOAD ==============

app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const { studentId, requirementId } = req.body;
    const conn = await pool.getConnection();

    // Store file metadata
    const [result] = await conn.execute(
      'INSERT INTO documents (student_id, requirement_id, file_name, file_path, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [studentId, requirementId, req.file.originalname, req.file.path, req.session.userId]
    );

    conn.release();

    res.json({ success: true, fileId: result.insertId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// ============== SOCKET.IO EVENTS ==============

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============== ERROR HANDLING ==============

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============== START SERVER ==============

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`TransRec Server running on http://localhost:${PORT}`);
  console.log(`Make sure MySQL is running with database 'transrec' on 127.0.0.1:3306`);
});
