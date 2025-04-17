const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const port = process.env.PORT || 5010;

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// SQLite database setup
const dbFile = path.join(__dirname, 'students.db');
let db;

// Initialize database
async function initializeDatabase() {
  try {
    // Open the database
    db = await open({
      filename: dbFile,
      driver: sqlite3.Database
    });
    
    console.log('✅ Connected to SQLite database');
    
    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS student_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    process.exit(1); // Exit if we can't set up the database
  }
}

// API Routes
// CREATE - Add a new student
app.post('/students', async (req, res) => {
  const { name, email, age, gender } = req.body;
  
  // Input validation
  if (!name || !email || !age || !gender) {
    return res.status(400).json({ 
      error: 'Bad Request', 
      message: 'All fields (name, email, age, gender) are required' 
    });
  }
  
  try {
    const result = await db.run(
      'INSERT INTO student_details (name, email, age, gender) VALUES (?, ?, ?, ?)',
      [name, email, parseInt(age, 10), gender]
    );
    
    // Get the inserted student
    const student = await db.get('SELECT * FROM student_details WHERE id = ?', result.lastID);
    
    res.status(201).json(student);
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to add student: ' + err.message 
    });
  }
});

// READ - Get all students
app.get('/students', async (req, res) => {
  try {
    const students = await db.all('SELECT * FROM student_details ORDER BY id DESC');
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve students: ' + err.message 
    });
  }
});

// READ - Get a specific student by ID
app.get('/students/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const student = await db.get('SELECT * FROM student_details WHERE id = ?', id);
    
    if (!student) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: `Student with ID ${id} not found` 
      });
    }
    
    res.json(student);
  } catch (err) {
    console.error(`Error fetching student ${id}:`, err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve student: ' + err.message 
    });
  }
});

// UPDATE - Update a student by ID
app.put('/students/:id', async (req, res) => {
  const id = req.params.id;
  const { name, email, age, gender } = req.body;
  
  // Input validation
  if (!name || !email || !age || !gender) {
    return res.status(400).json({ 
      error: 'Bad Request', 
      message: 'All fields (name, email, age, gender) are required' 
    });
  }
  
  try {
    const result = await db.run(
      'UPDATE student_details SET name = ?, email = ?, age = ?, gender = ? WHERE id = ?',
      [name, email, parseInt(age, 10), gender, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: `Student with ID ${id} not found` 
      });
    }
    
    // Get the updated student
    const student = await db.get('SELECT * FROM student_details WHERE id = ?', id);
    
    res.json(student);
  } catch (err) {
    console.error(`Error updating student ${id}:`, err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update student: ' + err.message 
    });
  }
});

// DELETE - Delete a student by ID
app.delete('/students/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    // Get the student before deleting (for the response)
    const student = await db.get('SELECT * FROM student_details WHERE id = ?', id);
    
    if (!student) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: `Student with ID ${id} not found` 
      });
    }
    
    await db.run('DELETE FROM student_details WHERE id = ?', id);
    
    res.json(student);
  } catch (err) {
    console.error(`Error deleting student ${id}:`, err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete student: ' + err.message 
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await db.get('SELECT COUNT(*) as count FROM student_details');
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      studentCount: result.count
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error',
      message: err.message
    });
  }
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'An unexpected error occurred' 
  });
});

// Start the server after initializing the database
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });
});