const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const moment = require('moment');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data storage (since we're not using a DB)
const sensorData = {
  current: {},
  history: []
};

// Maximum number of historical data points to keep
const MAX_HISTORY_LENGTH = 100;

// API endpoint to receive sensor data
app.post('/api/sensordata', (req, res) => {
  const data = req.body;
  
  // Add timestamp if not provided
  if (!data.timestamp) {
    data.timestamp = Date.now();
  }
  
  // Add formatted time for display
  data.formattedTime = moment(data.timestamp).format('HH:mm:ss');
  
  // Update current data
  sensorData.current = data;
  
  // Add to history (and maintain maximum length)
  sensorData.history.unshift(data);
  if (sensorData.history.length > MAX_HISTORY_LENGTH) {
    sensorData.history = sensorData.history.slice(0, MAX_HISTORY_LENGTH);
  }
  
  // Emit to all connected clients
  io.emit('newSensorData', data);
  
  console.log('Received new sensor data:', data);
  res.status(200).json({ message: 'Data received successfully' });
});

// API endpoint to get latest sensor data
app.get('/api/sensordata/latest', (req, res) => {
  res.json(sensorData.current);
});

// API endpoint to get historical sensor data
app.get('/api/sensordata/history', (req, res) => {
  // Optionally limit the number of data points
  const limit = parseInt(req.query.limit) || MAX_HISTORY_LENGTH;
  res.json(sensorData.history.slice(0, limit));
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Send current data to newly connected client
  socket.emit('initialData', {
    current: sensorData.current,
    history: sensorData.history
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});