# Cyber Hunter Freelancing Platform - Backend

This is the backend server for the Cyber Hunter Freelancing Platform, a specialized platform connecting cybersecurity professionals with clients.

## Features

- User authentication and authorization
- Project management
- Team collaboration
- Task tracking
- Real-time chat
- Notifications
- Admin dashboard

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io for real-time features
- JWT for authentication
- Nodemailer for email services

## Project Structure

```
├── config/              # Configuration files
│   ├── config.js        # Application configuration
│   └── db.js            # Database connection
├── controllers/         # Route controllers
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── chat.controller.js
│   ├── notification.controller.js
│   ├── project.controller.js
│   ├── task.controller.js
│   ├── team.controller.js
│   └── user.controller.js
├── middleware/         # Custom middleware
│   └── auth.middleware.js
├── models/             # Mongoose models
│   ├── chat.model.js
│   ├── notification.model.js
│   ├── project.model.js
│   ├── task.model.js
│   ├── team.model.js
│   └── user.model.js
├── routes/             # API routes
│   ├── admin.routes.js
│   ├── auth.routes.js
│   ├── chat.routes.js
│   ├── notification.routes.js
│   ├── project.routes.js
│   ├── task.routes.js
│   ├── team.routes.js
│   └── user.routes.js
├── socket/             # Socket.io handlers
│   └── socketHandlers.js
├── utils/              # Utility functions
│   ├── emailService.js
│   └── errorHandler.js
├── app.js              # Express app setup
└── package.json        # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Navigate to the server directory
3. Install dependencies
   ```
   npm install
   ```
4. Create a `.env` file based on `.env.example`
5. Start the development server
   ```
   npm run dev
   ```

## API Documentation

The API is organized around RESTful principles. It uses standard HTTP response codes and accepts/returns JSON in the request/response bodies.

### Base URL

```
http://localhost:5000/api
```

### Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Available Endpoints

- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/projects` - Project management
- `/api/teams` - Team management
- `/api/tasks` - Task management
- `/api/chats` - Chat functionality
- `/api/admin` - Admin dashboard

For detailed API documentation, refer to the API documentation or use a tool like Postman to explore the endpoints.

## Socket.IO Events

The server uses Socket.IO for real-time communication. Here are the main events:

- `connection` - Client connects to the server
- `private-message` - Send a private message
- `team-message` - Send a message to a team
- `project-update` - Send project updates
- `typing` - User is typing indicator
- `stop-typing` - User stopped typing

## License

This project is licensed under the MIT License.