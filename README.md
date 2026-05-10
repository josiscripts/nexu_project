# NEXU - Academic Networking Platform

A full-stack web application for academic networking, group collaboration, and real-time communication among students and educators across different knowledge areas.

## 🎯 Project Overview

NEXU is an academic networking platform that allows users to:
- **Connect** with other students and educators
- **Create and join study groups** organized by UNESCO knowledge areas
- **Share posts and ideas** with real-time feed updates
- **Join audio rooms** for live study sessions and discussions
- **Discover content** through powerful search and recommendations

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS v4
- **Components**: ShadcnUI
- **State Management**: Zustand
- **Real-time**: Socket.io Client
- **Language**: TypeScript

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Real-time**: Socket.io
- **Media Upload**: Cloudinary
- **Authentication**: JWT + HttpOnly Cookies

### Infrastructure
- **Frontend Hosting**: Vercel (ready)
- **Backend Hosting**: Railway (ready)
- **Database**: Supabase PostgreSQL

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/josiscripts/nexu_project.git
cd nexu_project
```

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

### Running Locally

**Terminal 1 - Backend**
```bash
cd backend
npm run start:dev
```
Backend will run on `http://localhost:3001`

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

Visit `http://localhost:3000` in your browser.

## 📋 Features

### User Management
- ✅ User registration & authentication
- ✅ Profile management
- ✅ Follow/unfollow system
- ✅ User search and discovery

### Social Features
- ✅ Create, read, update, delete posts
- ✅ Like system on posts
- ✅ Comments on posts
- ✅ Real-time notifications
- ✅ Area-based feed (UNESCO knowledge areas)

### Groups
- ✅ Create study groups
- ✅ Join/leave groups
- ✅ Group members management
- ✅ Real-time group updates

### Audio Rooms
- ✅ Create audio rooms
- ✅ Join/leave rooms
- ✅ WebRTC P2P audio streaming
- ✅ Real-time user presence
- ✅ Room auto-cleanup

### Discovery
- ✅ Global search (users, groups, rooms)
- ✅ UNESCO area filtering
- ✅ Real-time results

## 🗄️ Database Schema

### Core Models
- **User** - User accounts and profiles
- **Post** - Social posts with images
- **Like** - Post likes (composite key)
- **Comment** - Post comments
- **Group** - Study groups
- **GroupMember** - Group memberships
- **UserFollower** - Follow relationships
- **Room** - Audio rooms
- **Chat** - Direct messages
- **Notification** - User notifications

## 🔌 API Endpoints

See `PROGRESS_SUMMARY.md` for complete API documentation.

### Key Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /posts` - Get posts feed
- `POST /groups` - Create group
- `POST /rooms` - Create audio room
- `GET /users/search?q=` - Search

## 🔄 Real-time Features

### Socket.io Namespaces
- `/notifications` - Area-based real-time updates
- `/rooms` - WebRTC signaling and room events

### Events
- `group:created` - New group broadcast
- `group:user-joined` - User joined group
- `room:user-joined` - User joined room
- `post:new` - New post in area
- WebRTC signaling events

## 🎨 Design System

### Colors
- Primary Red: `#F2393B` (CTAs and important actions)
- Primary Navy: `#212D77` (Titles and hierarchy)
- Text Black: `#000000`
- Background White: `#FFFFFF`

### Components
- Responsive design (mobile-first)
- ShadcnUI for critical components
- Tailwind CSS for styling
- Custom AudioRoom component

## 📝 Environment Variables

### Backend (.env)
```
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/nexu
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_preset
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧪 Testing

See `TEST_CASE_GUIDE.md` for complete testing instructions.

### Test Case
The application includes a full test case with two users:
1. Usuario A creates a group and room
2. Usuario B follows User A and joins the group and room
3. Both users connect in the same audio room

## 📦 Build & Deployment

### Build Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Deploy to Production
- **Backend**: Push to Railway connected repo
- **Frontend**: Push to Vercel connected repo
- Update environment variables in hosting platform

See `PRODUCTION_CHECKLIST.md` for detailed deployment steps.

## 📚 Documentation

- `PROGRESS_SUMMARY.md` - Current project status and architecture
- `TEST_CASE_GUIDE.md` - Step-by-step testing instructions
- `PRODUCTION_CHECKLIST.md` - Production deployment checklist

## 🤝 Contributing

This project was built as an academic platform. To contribute:
1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is open source.

## 👨‍💻 Author

**Josías Quispe** (@josiscripts)

## 🙏 Acknowledgments

Built with modern web technologies and best practices for academic networking and real-time collaboration.

---

## 🎓 UNESCO Knowledge Areas

The platform supports posts and groups in these knowledge areas:
- SALUD (Health)
- INGENIERIA (Engineering)
- ARTES (Arts)
- CIENCIAS_EXACTAS (Exact Sciences)
- CIENCIAS_SOCIALES (Social Sciences)
- NEGOCIOS (Business)
- ARQUITECTURA_Y_URBANISMO (Architecture & Urban Planning)

---

**Status**: ✅ Ready for testing and deployment

**Last Updated**: May 10, 2026
