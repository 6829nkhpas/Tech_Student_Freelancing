# Cyber Hunter Freelancing Platform

A comprehensive platform connecting students with real-world clients for freelance opportunities, portfolio building, and skill development.

## Project Overview

Cyber Hunter is a freelancing platform designed specifically for students to connect with startups, institutions, and MSMEs. The platform enables students to deliver freelance services, build portfolios, earn credits/points, and track performance with a focus on real-time project lifecycle management.

## Features

- **User Management**: Role-based authentication and profiles for students, clients, and admins
- **Project & Freelance Job Module**: Post, apply, search, and bid on projects
- **Team & Collaboration**: Create teams, assign roles, and collaborate in real-time
- **Task & Project Lifecycle**: Kanban boards, milestones, time tracking, and deliverables
- **Gamification & Ranking**: Points system, leaderboards, badges, and skill endorsements
- **Chat & Communication**: Real-time messaging and notifications
- **Admin Dashboard**: User management, project monitoring, analytics, and dispute resolution
- **Payments & Credits**: Token-based system with escrow functionality (Phase 2)
- **Tools and Resource Center**: Guides, templates, and auto-generated showcases

## Tech Stack

### Frontend
- Next.js
- Tailwind CSS
- ShadCN/UI

### Backend
- Node.js
- Express.js

### Database
- MongoDB with Mongoose ODM

### Authentication
- JWT + bcrypt

### File Storage
- Firebase Storage

### Real-time Features
- Socket.io

### DevOps
- GitHub Actions
- Railway
- Docker (optional)

## Project Structure

```
├── client/                  # Frontend Next.js application
│   ├── app/                 # App router structure
│   │   ├── (auth)/          # Authentication routes
│   │   ├── (dashboard)/     # Dashboard routes
│   │   ├── (projects)/      # Project routes
│   │   ├── (teams)/         # Team routes
│   │   ├── (admin)/         # Admin routes
│   │   └── api/             # API routes
│   ├── components/          # Reusable components
│   │   ├── ui/              # UI components from ShadCN
│   │   ├── forms/           # Form components
│   │   ├── layout/          # Layout components
│   │   └── shared/          # Shared components
│   ├── lib/                 # Utility functions
│   ├── hooks/               # Custom hooks
│   ├── context/             # Context providers
│   ├── public/              # Static assets
│   └── styles/              # Global styles
├── server/                  # Backend Express.js application
│   ├── config/              # Configuration files
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── app.js               # Express app entry point
├── .github/                 # GitHub Actions workflows
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## Development Milestones

| Week | Milestone |
| ---- | --------- |
| 1    | Finalize vision, branding, feature list |
| 2-3  | User Auth + Profile Module |
| 4    | Project Posting + Proposal Flow |
| 5    | Team/Chat Module |
| 6    | Admin Panel + Project Lifecycle |
| 7    | Gamification + Leaderboard |
| 8    | Final polish, testing, docs, deployment |

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies for both client and server
3. Set up environment variables
4. Run the development servers

```bash
# Clone the repository
git clone https://github.com/yourusername/cyber-hunter.git
cd cyber-hunter

# Install dependencies for client
cd client
npm install
cd ..

# Install dependencies for server
cd server
npm install
cd ..

# Run development servers
# Terminal 1 - Client
cd client
npm run dev

# Terminal 2 - Server
cd server
npm run dev
```

## License

MIT