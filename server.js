const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Update allowed origins to include your Netlify URL
const allowedOrigins = [
  'http://localhost:3000', // Local dev
  'https://cheery-manatee-31b3b1.netlify.app', // Your Netlify app
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '1mb' }));

app.post('/token', async (req, res) => {
  const { identity, roomName } = req.body;

  if (!identity || !roomName) {
    return res.status(400).json({ error: 'Missing identity or roomName' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('Missing LiveKit API credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: 3600 });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Token generation failed:', error.message);
    return res.status(500).json({ error: 'Token generation failed' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: ' dissectingOK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});