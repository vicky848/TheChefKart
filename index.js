const express = require('express');
const app = express();
require('dotenv').config();
const sqlite3 = require('sqlite3');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const path = require('path');
const { open } = require('sqlite');

const dbPath = path.join(__dirname, 'database.db');
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Initialize users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile_number TEXT UNIQUE NOT NULL,
        address TEXT NOT NULL,
        post_count INTEGER DEFAULT 0,
        password TEXT NOT NULL
      );
    `);
    console.log('Table users created successfully');

    // Initialize posts table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        images JSON,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    console.log('Table posts created successfully');

    console.log('Database connected successfully');

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error(`DB Initialization Error: ${error}`);
    process.exit(1);
  }
};

initializeDBAndServer();



app.use(express.json());
app.use(express.static('public'));

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  jwt.verify(token, 'MY_SECRET_TOKEN', async (err, payload) => {
    if (err) {
      return res.status(401).send({ message: 'Invalid JWT token' });
    }
    req.username = payload.username;
    next();
  });
};

// Get users API
app.get('/users', authenticateToken, async (req, res) => {

  try {
    const selectUsersQuery = `
      SELECT * FROM users;
    `;
    const users = await db.all(selectUsersQuery);
    res.json(users);
  } catch (error) {
    console.error(`Error getting users: ${error}`);
    res.status(500).send({ message: 'Server error' });
  }

});

// Register user API
app.post('/users', async (req, res) => {
  const { name, mobile_number, address, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `
    SELECT * FROM users WHERE mobile_number = '${mobile_number}';
  `;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser) {
    return res.status(400).send({ message: 'User already exists' });
  }

  const insertUserQuery = `
    INSERT INTO users (name, mobile_number, address, password)
    VALUES (?, ?, ?, ?);
  `;
  await db.run(insertUserQuery, [name, mobile_number, address, hashedPassword]);
  res.status(201).send({ message: 'User created successfully' });
});

// Login user API
app.post('/login', async (req, res) => {
  const { mobile_number, password } = req.body;

  const selectUserQuery = `
    SELECT * FROM users WHERE mobile_number = '${mobile_number}';
  `;
  const dbUser = await db.get(selectUserQuery);

  if (!dbUser) {
    return res.status(400).send({ message: 'Invalid user' });
  }

  const isValidPassword = await bcrypt.compare(password, dbUser.password);
  if (!isValidPassword) {
    return res.status(400).send({ message: 'Invalid password' });
  }

  const payload = { username: dbUser.name };
  const token = jwt.sign(payload, 'MY_SECRET_TOKEN');
  res.send({ token });
});

// Create post API
app.post('/posts', authenticateToken, async (req, res) => {

  try {
    const { title, description, images } = req.body;

    const insertPostQuery = `
      INSERT INTO posts (title, description, user_id, images)
      VALUES (?,?, (SELECT id FROM users WHERE name =?),?);
    `;
    await db.run(insertPostQuery, [title, description, req.username, JSON.stringify(images)]);

    const selectUserQuery = `
      SELECT * FROM users WHERE name = '${req.username}';
    `;
    const updatedUser = await db.get(selectUserQuery);

    res.status(201).send({ message: 'Post created successfully', user: updatedUser });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(500).send({ message: 'Server error' });
  }
});


// Get All posts
app.get('/posts/', authenticateToken, async (request, response) => {
   
    try {
        const getAllPostsQuery = `
        SELECT * FROM posts;
        `;
        const posts = await db.all(getAllPostsQuery);
        response.send(posts);
    } catch (error) {
        console.error(error);
        response.status(500).send("Internal Server Error");
    }

   
    });
    
    // Get Post by ID
    app.get('/posts/:postId', async (request, response) => {
       
        try {
            const { postId } = request.params;
            const getPostQuery = `
            SELECT * FROM posts WHERE id =?;
            `;
            const post = await db.get(getPostQuery, [postId]);
            if (!post) {
                return response.status(404).send("Post not found");
            }
            response.send(post);
        } catch (error) {
            console.error(error);
            response.status(500).send("Internal Server Error");
        }
       
    });
    
    // Update post
    app.put('/posts/:postId',authenticateToken, async (request, response) => {
    
    try {
            const { postId } = request.params;
            const { title, description, images } = request.body;
            const updatePostQuery = `
            UPDATE posts SET title =?, description =?, images =? WHERE id =?;
            `;
            await db.run(updatePostQuery, [title, description, JSON.stringify(images), postId]);
            response.send("Post updated successfully");
        } catch (error) {
            console.error(error);
            response.status(500).send("Internal Server Error");
        }
       
    });
    
   
    
    // Delete Post
    app.delete('/posts/:postId',authenticateToken, async (request, response) => {
   
    try {
            const { postId } = request.params;
            const deletePostQuery = `
            DELETE FROM posts WHERE id =?;
            `;
            await db.run(deletePostQuery, [postId]);
            response.send("Post deleted successfully");
        } catch (error) {
            console.error(error);
            response.status(500).send("Internal Server Error");
        }
       
    });