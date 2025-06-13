// backend/server.js

require('dotenv').config();
const express       = require('express');
const https         = require('https');
const fs            = require('fs');
const path          = require('path');
const session       = require('express-session');
const sharedSession = require('express-socket.io-session');
const { Server }    = require('socket.io');

const authRoutes   = require('./routes/authRoutes');
const gameRoutes   = require('./routes/gameRoutes');
const playerRoutes = require('./routes/playerRoutes');
const authenticate = require('./middleware/authenticateMiddleware');
const db           = require('./models/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// Trust proxy so secure cookies work under ngrok
app.set('trust proxy', 1);

// 1) Log every request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// 2) JSON parser
app.use(express.json());

// 3) Session middleware
const sessionMiddleware = session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'please_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure:   true,
    httpOnly: true,
    sameSite: 'none',
    maxAge:   24 * 60 * 60 * 1000
  }
});
app.use(sessionMiddleware);

// 4) API routes
app.use('/api/auth', authRoutes);
app.use('/api', authenticate, gameRoutes);
app.use('/api', playerRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// 5) Serve React build & catch-all
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));
// Fallback for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// 6) HTTPS + Socket.IO
const options = {
  key:  fs.readFileSync(path.join(__dirname, 'certs/server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/server.crt'))
};
const httpsServer = https.createServer(options, app);
const io = new Server(httpsServer, { cors: { origin: true, credentials: true } });
app.set('io', io);
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

io.on('connection', socket => {
  const user = socket.handshake.session.user;
  console.log(`🔌 Socket connected: ${socket.id} (${user?.username || 'Guest'})`);

  socket.on('joinGame', gameId => {
    socket.join(gameId);
    console.log(`${user?.username || 'Guest'} joined ${gameId}`);
  });
  socket.on('startGame', ({ gameId }) => io.to(gameId).emit('startGame', { gameId }));
  socket.on('endGame',   ({ gameId }) => io.to(gameId).emit('endGame',   { gameId }));
  socket.on('leaveGame', gameId => {
    socket.leave(gameId);
    console.log(`${user?.username || 'Guest'} left ${gameId}`);
  });
});

// 7) Start server after DB check
db.query('SELECT 1')
  .then(() => {
    console.log('✅ Database connected');
    httpsServer.listen(PORT, () =>
      console.log(`🔐 HTTPS server listening on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
