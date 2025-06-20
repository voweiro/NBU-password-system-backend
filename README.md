# Password Management System Backend

Backend service for the Nigerian British University Password Management System.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT for authentication
- Winston for logging
- Express Rate Limit for API protection
- Helmet for security headers

## Project Structure

```
src/
├── config/         # Configuration files (database, etc.)
├── controllers/    # Route controllers
├── middlewares/    # Custom middlewares
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── server.js       # Entry point
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and copy the contents from `.env.example`

3. Set up the PostgreSQL database:
   - Create a new database
   - Run the schema file: `src/config/schema.sql`

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Users
- GET /api/users - Get all users (Super-Admin only)
- GET /api/users/:id - Get user by ID
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user (Super-Admin only)

### Systems
- GET /api/systems - Get all systems
- POST /api/systems - Create new system (Admin+)
- GET /api/systems/:id - Get system by ID
- PUT /api/systems/:id - Update system (Admin+)
- DELETE /api/systems/:id - Delete system (Super-Admin only)

### Activity Logs
- GET /api/activities - Get all activity logs (Super-Admin only)

## Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting
- Security headers with Helmet
- Password hashing with bcrypt
- Activity logging
- Hidden Ultra-Admin functionality 