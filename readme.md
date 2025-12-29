# 🚀 Streak Tracker: Ultimate Productivity Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.2.0-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0.0-green)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)](https://vitejs.dev/)

> Transform your daily habits into unbreakable streaks with this cutting-edge productivity application. Built with modern web technologies, featuring real-time analytics, gamified tracking, and an intuitive user experience that keeps you motivated and on track.

## 🌟 Features

### 🔥 Core Functionality
- **🔐 Secure Authentication**: JWT-based user authentication with bcrypt password hashing
- **⏱️ Focus Timer**: Pomodoro-style focus sessions with customizable durations and break intervals
- **📊 Habit Tracking**: Create, monitor, and maintain streaks for daily/weekly habits
- **📝 Digital Journal**: Record thoughts, reflections, and insights with rich text support
- **✅ Task Management**: Organize tasks with priorities, deadlines, and progress tracking
- **📈 Live Metrics Dashboard**: Real-time analytics with interactive charts and heatmaps
- **🎵 Audio Integration**: Custom sound notifications and ambient audio for focus sessions

### 🎨 User Experience
- **🌙 Dark/Light Theme**: Seamless theme switching with persistent preferences
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **⚡ Real-time Updates**: Live synchronization across all devices
- **🎯 Gamification**: Achievement badges, streak milestones, and motivational notifications
- **📊 Data Visualization**: Beautiful charts powered by Recharts library
- **🔍 Advanced Filtering**: Sort, filter, and search through your data effortlessly

### 🛠️ Technical Excellence
- **⚡ High Performance**: Built with Vite for lightning-fast development and builds
- **🔧 Modern Stack**: React 19, Node.js, Express 5, MongoDB with Mongoose
- **🎨 Styled with Tailwind**: Utility-first CSS framework for consistent design
- **📦 Modular Architecture**: Clean separation of concerns with controllers, models, and routes
- **🧪 Type-Safe**: TypeScript support in development with ESLint for code quality

## 🏗️ Architecture

```
streak-tracker/
├── 📁 server/                 # Backend API Server
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Authentication & validation
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   └── index.js             # Server entry point
│
└── 📁 streak-tracker/        # Frontend React App
    ├── public/              # Static assets
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── Pages/          # Route components
    │   ├── context/        # React context providers
    │   └── assets/         # Images and icons
    └── vite.config.js      # Build configuration
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (>= 18.0.0)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/streak-tracker.git
   cd streak-tracker
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev           # Start development server on port 5000
   ```

3. **Setup Frontend**
   ```bash
   cd ../streak-tracker
   npm install
   npm run dev           # Start development server on port 5173
   ```

4. **Access the Application**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## ⚙️ Environment Configuration

Create `.env` files in both `server/` and `streak-tracker/` directories:

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/streaktracker
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Habit Management
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/log` - Log habit completion

### Task Management
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Focus Sessions
- `GET /api/focus` - Get focus logs
- `POST /api/focus` - Log focus session
- `GET /api/focus/stats` - Get focus statistics

### Journal Entries
- `GET /api/journal` - Get journal entries
- `POST /api/journal` - Create journal entry
- `PUT /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry

## 🎯 Usage Examples

### Creating a Habit
```javascript
const newHabit = {
  name: "Morning Meditation",
  description: "10 minutes of mindfulness",
  frequency: "daily",
  targetStreak: 30
};

fetch('/api/habits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newHabit)
});
```

### Starting a Focus Session
```javascript
const focusSession = {
  duration: 25, // minutes
  type: "pomodoro",
  task: "Complete project proposal"
};

fetch('/api/focus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(focusSession)
});
```

## 🧪 Testing

```bash
# Run frontend tests
cd streak-tracker
npm run lint

# Run backend tests (if implemented)
cd ../server
npm test
```

## 🚢 Deployment

### Backend Deployment
```bash
cd server
npm run build
npm start
```

### Frontend Deployment
```bash
cd streak-tracker
npm run build
npm run preview
```

### Docker Support (Future Enhancement)
```dockerfile
# Planned: Multi-stage Docker build for production
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Use conventional commits format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Icons**: [Lucide React](https://lucide.dev/) for beautiful icons
- **Charts**: [Recharts](https://recharts.org/) for data visualization
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- **Build Tool**: [Vite](https://vitejs.dev/) for fast development

## 📞 Support

- 📧 Email: support@streaktracker.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/streak-tracker/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/streak-tracker/discussions)

---

**Made with ❤️ by [Your Name]**

*Stay consistent, build habits, achieve greatness!* 🌟