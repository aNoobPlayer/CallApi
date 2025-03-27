const express = require('express');
const { AccessToken, VideoGrant } = require('livekit-server-sdk');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || '*'
}));
app.use(express.json());

app.post('/token', async (req, res) => {
  const { identity, roomName } = req.body;
  if (!identity || !roomName) {
    return res.status(400).json({ error: 'Identity and roomName are required' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      ttl: 3600,
    });

    const videoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };

    at.addGrant(videoGrant);

    const token = await at.toJwt();
    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate token', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});