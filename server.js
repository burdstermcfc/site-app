// File: server.js
// Instructions: Deploy this file to a Node.js service like Render.
// You will also need to create a PostgreSQL database and run the SQL commands below.
// You must set the DATABASE_URL and JWT_SECRET environment variables in your Render service.

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// --- DATABASE SETUP ---
// Use the DATABASE_URL environment variable provided by Render.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if no token, unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // if token is no longer valid
        req.user = user.user; // Set req.user to the payload inside the token
        next();
    });
};


// --- API ROUTES ---

// 1. AUTHENTICATION
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
            [name, email, hashedPassword]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already in use.' });
        }
        res.status(500).send('Server error');
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const payload = { user: { id: user.id, name: user.name, email: user.email } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: payload.user });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// 2. PROJECTS (Protected Route)
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        // Only get projects created by the logged-in user
        const projects = await pool.query("SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
        res.json(projects.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, number, location } = req.body;
    try {
        const newProject = await pool.query(
            "INSERT INTO projects (name, number, location, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, number, location, req.user.id]
        );
        res.status(201).json(newProject.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// 3. SNAGS (Protected Route)
app.get('/api/projects/:projectId/snags', authenticateToken, async (req, res) => {
    try {
        const snags = await pool.query("SELECT * FROM snags WHERE project_id = $1 ORDER BY created_at DESC", [req.params.projectId]);
        res.json(snags.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


app.post('/api/projects/:projectId/snags', authenticateToken, async (req, res) => {
    const { title, description, assignedTo, status, image } = req.body;
    try {
        const newSnag = await pool.query(
            "INSERT INTO snags (project_id, title, description, assigned_to, status, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [req.params.projectId, title, description, assignedTo, status, image]
        );
        res.status(201).json(newSnag.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// --- SERVER START ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


/*
-- DATABASE SCHEMA (PostgreSQL)
-- Instructions: Run these SQL commands in your PostgreSQL database to create the required tables.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    number VARCHAR(100),
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE snags (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    assigned_to VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

*/
