import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/authRoutes.js'; 
import taskRoutes from './routes/taskRoutes.js'; 
import journalRoutes from './routes/journalRoutes.js'; 
import focusRoutes from './routes/focusRoutes.js'; 
import habitRoutes from './routes/habitRoutes.js';

dotenv.config();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// --- SECURITY MIDDLEWARE ---
// Set security HTTP headers
app.use(helmet());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again in 15 minutes',
});
app.use('/api', limiter);

// --- DYNAMIC CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:5173', // Local Vite development (HTTP)
  'https://localhost:5173', // Local Vite development (HTTPS)
  'http://localhost:5174', // Local Vite development (HTTP) - alternate port
  'https://localhost:5174', // Local Vite development (HTTPS) - alternate port
  'https://streaks-tracker.vercel.app', // <--- REPLACE THIS WITH YOUR ACTUAL VERCEL URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// --- ROUTES (Registered before server start) ---
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/habits', habitRoutes); // Habit routes registered properly

app.get('/', (req, res) => {
  res.send('Momentum V2.0 API is Running 🚀');
});

// --- SERVE FRONTEND IN PRODUCTION ---
const clientPath = path.join(__dirname, '../streak-tracker/dist');
app.use(express.static(clientPath));

// Fallback for React Router routes (must be after API routes)
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(clientPath, 'index.html'));
});

// --- DATABASE CONNECTION ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host} 🍃`);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    // In production, we don't necessarily want to exit(1) immediately if the DB blips
  }
};

// --- START SERVER ---
app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
