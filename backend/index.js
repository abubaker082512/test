const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Mock Game State for Crash
let crashState = {
  status: 'waiting', // waiting, running, crashed
  multiplier: 1.0,
  players: []
};

// Simple Crash Engine Loop
setInterval(() => {
  if (crashState.status === 'waiting') {
    crashState.status = 'running';
    crashState.multiplier = 1.0;
    io.emit('crashUpdate', crashState);
  } else if (crashState.status === 'running') {
    crashState.multiplier += 0.05; // increase multiplier
    io.emit('crashUpdate', crashState);
    
    // Random chance to crash
    if (Math.random() < 0.05) {
      crashState.status = 'crashed';
      io.emit('crashUpdate', crashState);
      
      // Reset after 5 seconds
      setTimeout(() => {
        crashState.status = 'waiting';
        crashState.multiplier = 1.0;
        crashState.players = [];
        io.emit('crashUpdate', crashState);
      }, 5000);
    }
  }
}, 500);

app.get('/', (req, res) => {
  res.send('BetPK Custom Game Engine Running');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.emit('crashUpdate', crashState);
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Game engine server listening on port ${PORT}`);
});
