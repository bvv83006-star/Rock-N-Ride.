const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve all static files from the root folder
app.use(express.static(__dirname));

// Health check for uptime pingers
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Fallback — always serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== MULTIPLAYER STATE =====
const players = {};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create default player entry
  players[socket.id] = {
    x: 88,
    y: 0,
    z: 88,
    rotY: -Math.PI / 2,
    carClass: 'sedan',
    color: 0xff3b30,
    name: 'Player'
  };

  // Send all existing players to the newcomer
  socket.emit('currentPlayers', players);

  // Tell everyone else about the new player
  socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

  // Player identity update (name / color / car)
  socket.on('setInfo', (info) => {
    if (!players[socket.id]) return;
    if (info.name) players[socket.id].name = String(info.name).slice(0, 20);
    if (info.color !== undefined) players[socket.id].color = info.color;
    if (info.carClass) players[socket.id].carClass = info.carClass;
    socket.broadcast.emit('playerMoved', { id: socket.id, ...players[socket.id] });
  });

  // Position updates
  socket.on('playerMovement', (data) => {
    if (!players[socket.id]) return;
    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].z = data.z;
    players[socket.id].rotY = data.rotY;
    if (data.carClass) players[socket.id].carClass = data.carClass;
    if (data.color !== undefined) players[socket.id].color = data.color;

    socket.broadcast.emit('playerMoved', { id: socket.id, ...players[socket.id] });
  });

  // Chat messages
  socket.on('chatMessage', (msg) => {
    if (typeof msg !== 'string') return;
    const clean = msg.slice(0, 100).trim();
    if (!clean) return;
    const name = players[socket.id]?.name || 'Player';
    io.emit('chatMessage', { id: socket.id, name, text: clean });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// ===== START =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('RocknRide Cars running on port ' + PORT);
});