const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '', // UPDATE THIS if your MySQL has a password
    port: 3306
  });

  try {
    console.log('Creating database...');
    await conn.execute('CREATE DATABASE IF NOT EXISTS transrec');
    await conn.execute('USE transrec');

    console.log('Creating tables...');

    // Users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'teacher', 'registrar') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Students table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        student_id VARCHAR(50),
        email VARCHAR(255),
        phone VARCHAR(20),
        grade VARCHAR(50),
        section VARCHAR(100),
        application_date DATE,
        previous_school VARCHAR(255),
        notes LONGTEXT,
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Students table created');

    // Requirements table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS requirements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        status ENUM('Pending', 'Complete', 'Verified') DEFAULT 'Pending',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Requirements table created');

    // Documents table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        requirement_id INT,
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        uploaded_by INT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE SET NULL,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Documents table created');

    // Timeline events table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        stage VARCHAR(255) NOT NULL,
        event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Timeline events table created');

    // Notifications table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_id INT NOT NULL,
        sender_id INT,
        message TEXT,
        type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Notifications table created');

    console.log('\n✅ Database migration completed successfully!');
    console.log('\nYour MySQL database "transrec" is now ready.');
    
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
