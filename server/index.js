import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { config } from 'dotenv';
import authRouter from './routes/auth.js';
import doorRouter from './routes/door.js';
import adminRouter from './routes/admin.js';
import { initDatabase } from './db/database.js';
import { initBot } from './discord/bot.js';
import { initGPIO } from './gpio/controller.js';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize database
await initDatabase();

// Initialize Discord bot
await initBot();

// Initialize GPIO
initGPIO();

// Routes
app.use('/api/auth', authRouter);
app.use('/api/door', doorRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
