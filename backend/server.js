require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'tododb',
  port: Number(process.env.DB_PORT || 3306)
});

// Connect to MySQL and create the table
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }

  console.log('Connected to MySQL database.');

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT NOT NULL AUTO_INCREMENT,
      task VARCHAR(255) NOT NULL,
      completed TINYINT NOT NULL DEFAULT 0,
      PRIMARY KEY (id)
    ) ENGINE = InnoDB;
  `;

  connection.query(createTableQuery, (err) => {
    if (err) {
      console.error('Table creation failed:', err.message);
      return;
    }

    console.log('Tasks table is ready.');
  });
});

// GET: Retrieve all tasks
app.get('/tasks', (req, res) => {
  connection.query(
    'SELECT * FROM tasks ORDER BY id DESC',
    (err, results) => {
      if (err) {
        console.error('Failed to fetch tasks:', err.message);
        return res.status(500).json({
          error: 'Failed to fetch tasks'
        });
      }

      res.json(results);
    }
  );
});

// POST: Add a new task
app.post('/tasks', (req, res) => {
  const task = req.body.task?.trim();

  if (!task) {
    return res.status(400).json({
      error: 'Task cannot be empty'
    });
  }

  connection.query(
    'INSERT INTO tasks (task, completed) VALUES (?, 0)',
    [task],
    (err, results) => {
      if (err) {
        console.error('Failed to insert task:', err.message);
        return res.status(500).json({
          error: 'Failed to save task'
        });
      }

      console.log(
        `Task saved successfully: "${task}", ID: ${results.insertId}`
      );

      res.status(201).json({
        id: results.insertId,
        task: task,
        completed: 0
      });
    }
  );
});

// PUT: Update task completion status
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const completed = req.body.completed;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'Invalid task ID'
    });
  }

  if (typeof completed !== 'boolean' &&
      completed !== 0 && completed !== 1) {
    return res.status(400).json({
      error: 'completed must be a boolean or 0/1'
    });
  }

  connection.query(
    'UPDATE tasks SET completed = ? WHERE id = ?',
    [Number(Boolean(completed)), id],
    (err, results) => {
      if (err) {
        console.error('Failed to update task:', err.message);
        return res.status(500).json({
          error: 'Failed to update task'
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          error: 'Task not found'
        });
      }

      res.json({
        id,
        completed: Boolean(completed)
      });
    }
  );
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

