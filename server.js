const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store the latest sensor data
let latestSensorData = {
    heartRate: 0,
    spo2: 0,
    temperature: 0,
    acceleration: 0,
    fallDetected: false,
    latitude: 0,
    longitude: 0,
    satellites: 0,
    timestamp: new Date()
};

// API endpoint to receive sensor data
app.post('/api/sensor-data', (req, res) => {
    const data = req.body;
    
    // Update the latest sensor data
    latestSensorData = {
        ...data,
        timestamp: new Date()
    };
    
    // Emit the data to all connected clients
    io.emit('sensorData', latestSensorData);
    
    res.status(200).json({ status: 'success', message: 'Data received' });
});

// API endpoint to get the latest sensor data
app.get('/api/sensor-data', (req, res) => {
    res.status(200).json(latestSensorData);
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Send the latest sensor data to the new client
    socket.emit('sensorData', latestSensorData);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});