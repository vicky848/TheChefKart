Social Media API

Overview

This is a RESTful API for a social media platform, built using Node.js, Express.js, and SQLite. The API allows users to create accounts, login, create posts, and interact with each other.

Features

- User registration and login
- Post creation, updating, and deletion
- Authentication and authorization using JSON Web Tokens (JWT)
- Data storage using SQLite

API Endpoints

User Endpoints

- POST /users: Create a new user account
- POST /login: Login to an existing user account
- GET /users: Get a list of all users (authenticated users only)

Post Endpoints

- POST /posts: Create a new post (authenticated users only)
- GET /posts: Get a list of all posts (authenticated users only)
- GET /posts/:postId: Get a specific post by ID (authenticated users only)
- PUT /posts/:postId: Update a specific post by ID (authenticated users only)
- DELETE /posts/:postId: Delete a specific post by ID (authenticated users only)

Installation and Setup

1. Clone the repository using git clone.
2. Install the dependencies using npm install.
3. Create a new SQLite database file named database.db.
4. Start the server using node server.js.

Contributing

Contributions are welcome! Please fork the repository, make your changes, and submit a pull request.

License

This project is licensed under the MIT License. See the LICENSE file for details.
