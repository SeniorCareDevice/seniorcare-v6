document.addEventListener('DOMContentLoaded', () => {
    // Initialize map with default center (will be updated with actual GPS data)
    const map = L.map('map').setView([0, 0], 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Create marker for current position (hidden initially)
    const marker = L.marker([0, 0], {
        title: 'Current Position'
    });
    
    let markerAdded = false;
    
    // Connect to Socket.io server
    const socket = io();
    
    // Handle connection status
    const connectionStatus = document.getElementById('connectionStatus');
    
    socket.on('connect', () => {
        connectionStatus.textContent = 'Connected';
        connectionStatus.className = 'connected';
    });
    
    socket.on('disconnect', () => {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.className = 'disconnected';
    });
    
    // Handle incoming sensor data
    socket.on('sensorData', (data) => {
        updateDashboard(data);
    });
    
    // Initial data fetch
    fetch('/api/sensor-data')
        .then(response => response.json())
        .then(data => {
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error fetching initial data:', error);
        });
    
    // Function to update dashboard with sensor data
    function updateDashboard(data) {
        // Update pulse oximeter data
        document.getElementById('heartRate').textContent = data.heartRate ? data.heartRate.toFixed(1) : '--';
        document.getElementById('spo2').textContent = data.spo2 ? data.spo2.toFixed(1) : '--';
        
        // Update temperature data
        document.getElementById('temperature').textContent = data.temperature ? data.temperature.toFixed(1) : '--';
        
        // Update fall detection data
        document.getElementById('acceleration').textContent = data.acceleration ? data.acceleration.toFixed(2) : '--';
        
        const fallStatus = document.getElementById('fallStatus');
        if (data.fallDetected) {
            fallStatus.textContent = 'Fall Detected!';
            fallStatus.className = 'status fall';
        } else {
            fallStatus.textContent = 'Safe';
            fallStatus.className = 'status safe';
        }
        
        // Update GPS data
        document.getElementById('latitude').textContent = data.latitude ? data.latitude.toFixed(6) : '--';
        document.getElementById('longitude').textContent = data.longitude ? data.longitude.toFixed(6) : '--';
        document.getElementById('satellites').textContent = data.satellites || '--';
        
        // Update map if valid coordinates
        if (data.latitude && data.longitude) {
            const position = [data.latitude, data.longitude];
            
            // Add marker if not added, otherwise update position
            if (!markerAdded) {
                marker.setLatLng(position).addTo(map);
                markerAdded = true;
            } else {
                marker.setLatLng(position);
            }
            
            // Center map on the new position
            map.setView(position, 15);
        }
        
        // Update last update time
        if (data.timestamp) {
            const timestamp = new Date(data.timestamp);
            document.getElementById('lastUpdate').textContent = timestamp.toLocaleTimeString();
        }
    }
});