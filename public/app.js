document.addEventListener('DOMContentLoaded', function() {
    // Connect to the server with Socket.io
    const socket = io();
    
    // Elements
    const connectionStatus = document.getElementById('connection-status');
    const fallIndicator = document.getElementById('fall-indicator');
    const accelerationValue = document.getElementById('acceleration-value');
    const heartRateElement = document.getElementById('heart-rate');
    const spo2Element = document.getElementById('spo2');
    const temperatureElement = document.getElementById('temperature');
    const latitudeElement = document.getElementById('latitude');
    const longitudeElement = document.getElementById('longitude');
    const satellitesElement = document.getElementById('satellites');
    const lastUpdateElement = document.getElementById('last-update');
    const historyDataElement = document.getElementById('history-data');
    const refreshHistoryButton = document.getElementById('refresh-history');
    
    // Chart configuration
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          display: true,
          beginAtZero: false
        }
      },
      animation: false,
      plugins: {
        legend: {
          display: false
        }
      }
    };
    
    // Initialize charts
    const heartRateChart = new Chart(
      document.getElementById('heart-rate-chart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Heart Rate',
            data: [],
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          ...chartOptions,
          scales: {
            ...chartOptions.scales,
            y: {
              ...chartOptions.scales.y,
              min: 40,
              max: 180,
              title: {
                display: true,
                text: 'BPM'
              }
            }
          }
        }
      }
    );
    
    const spo2Chart = new Chart(
      document.getElementById('spo2-chart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'SpO2',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          ...chartOptions,
          scales: {
            ...chartOptions.scales,
            y: {
              ...chartOptions.scales.y,
              min: 80,
              max: 100,
              title: {
                display: true,
                text: '%'
              }
            }
          }
        }
      }
    );
    
    const temperatureChart = new Chart(
      document.getElementById('temperature-chart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Temperature',
            data: [],
            borderColor: '#f39c12',
            backgroundColor: 'rgba(243, 156, 18, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          ...chartOptions,
          scales: {
            ...chartOptions.scales,
            y: {
              ...chartOptions.scales.y,
              min: 35,
              max: 42,
              title: {
                display: true,
                text: '°C'
              }
            }
          }
        }
      }
    );
    
    // Helper function to update charts
    function updateChart(chart, newValue, label) {
      if (newValue !== null && newValue !== undefined) {
        // Add new data
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(newValue);
        
        // Keep only the most recent 20 data points
        if (chart.data.labels.length > 20) {
          chart.data.labels.shift();
          chart.data.datasets[0].data.shift();
        }
        
        chart.update();
      }
    }
    
    // Update UI with sensor data
    function updateUI(data) {
      if (!data) return;
      
      // Update fall detection status
      if (data.fallDetected !== undefined) {
        fallIndicator.textContent = data.fallDetected ? 'FALL DETECTED!' : 'No Fall Detected';
        fallIndicator.className = data.fallDetected ? 'alert' : '';
      }
      
      // Update acceleration value
      if (data.accelerationMag !== undefined && data.accelerationMag !== null) {
        accelerationValue.textContent = data.accelerationMag.toFixed(2);
      }
      
      // Update heart rate
      if (data.heartRate !== undefined && data.heartRate !== null) {
        heartRateElement.textContent = data.heartRate.toFixed(1);
        updateChart(heartRateChart, data.heartRate, data.formattedTime || 'Now');
      }
      
      // Update SpO2
      if (data.spo2 !== undefined && data.spo2 !== null) {
        spo2Element.textContent = data.spo2.toFixed(1);
        updateChart(spo2Chart, data.spo2, data.formattedTime || 'Now');
      }
      
      // Update temperature
      if (data.temperature !== undefined && data.temperature !== null) {
        temperatureElement.textContent = data.temperature.toFixed(1);
        updateChart(temperatureChart, data.temperature, data.formattedTime || 'Now');
      }
      
      // Update GPS data
      if (data.latitude !== undefined && data.latitude !== null) {
        latitudeElement.textContent = data.latitude.toFixed(6);
      }
      
      if (data.longitude !== undefined && data.longitude !== null) {
        longitudeElement.textContent = data.longitude.toFixed(6);
      }
      
      if (data.satellites !== undefined && data.satellites !== null) {
        satellitesElement.textContent = data.satellites;
      }
      
      // Update last update time
      lastUpdateElement.textContent = new Date().toLocaleTimeString();
    }
    
    // Update history table
    function updateHistoryTable(historyData) {
      // Clear existing rows
      historyDataElement.innerHTML = '';
      
      // Add new rows
      historyData.forEach(data => {
        const row = document.createElement('tr');
        
        // Time column
        const timeCell = document.createElement('td');
        timeCell.textContent = data.formattedTime || new Date(data.timestamp).toLocaleTimeString();
        row.appendChild(timeCell);
        
        // Heart rate column
        const heartRateCell = document.createElement('td');
        heartRateCell.textContent = data.heartRate !== undefined && data.heartRate !== null 
          ? `${data.heartRate.toFixed(1)} BPM` 
          : 'N/A';
        row.appendChild(heartRateCell);
        
        // SpO2 column
        const spo2Cell = document.createElement('td');
        spo2Cell.textContent = data.spo2 !== undefined && data.spo2 !== null 
          ? `${data.spo2.toFixed(1)}%` 
          : 'N/A';
        row.appendChild(spo2Cell);
        
        // Temperature column
        const tempCell = document.createElement('td');
        tempCell.textContent = data.temperature !== undefined && data.temperature !== null 
          ? `${data.temperature.toFixed(1)}°C` 
          : 'N/A';
        row.appendChild(tempCell);
        
         // Fall column
      const fallCell = document.createElement('td');
      fallCell.textContent = data.fallDetected ? 'YES' : 'No';
      if (data.fallDetected) {
        fallCell.style.color = '#e74c3c';
        fallCell.style.fontWeight = 'bold';
      }
      row.appendChild(fallCell);
      
      // Add row to table
      historyDataElement.appendChild(row);
    });
  }
  
  // Socket.io event handlers
  socket.on('connect', () => {
    connectionStatus.textContent = 'Connected';
    connectionStatus.className = 'connected';
    console.log('Connected to server');
  });
  
  socket.on('disconnect', () => {
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.className = 'disconnected';
    console.log('Disconnected from server');
  });
  
  socket.on('initialData', (data) => {
    console.log('Received initial data:', data);
    
    // Update UI with current data
    updateUI(data.current);
    
    // Update history table
    if (data.history && data.history.length > 0) {
      updateHistoryTable(data.history);
    }
  });
  
  socket.on('newSensorData', (data) => {
    console.log('Received new sensor data:', data);
    updateUI(data);
    
    // Update history table (add the new entry to the top)
    const row = document.createElement('tr');
    
    // Time column
    const timeCell = document.createElement('td');
    timeCell.textContent = data.formattedTime || new Date(data.timestamp).toLocaleTimeString();
    row.appendChild(timeCell);
    
    // Heart rate column
    const heartRateCell = document.createElement('td');
    heartRateCell.textContent = data.heartRate !== undefined && data.heartRate !== null 
      ? `${data.heartRate.toFixed(1)} BPM` 
      : 'N/A';
    row.appendChild(heartRateCell);
    
    // SpO2 column
    const spo2Cell = document.createElement('td');
    spo2Cell.textContent = data.spo2 !== undefined && data.spo2 !== null 
      ? `${data.spo2.toFixed(1)}%` 
      : 'N/A';
    row.appendChild(spo2Cell);
    
    // Temperature column
    const tempCell = document.createElement('td');
    tempCell.textContent = data.temperature !== undefined && data.temperature !== null 
      ? `${data.temperature.toFixed(1)}°C` 
      : 'N/A';
    row.appendChild(tempCell);
    
    // Fall column
    const fallCell = document.createElement('td');
    fallCell.textContent = data.fallDetected ? 'YES' : 'No';
    if (data.fallDetected) {
      fallCell.style.color = '#e74c3c';
      fallCell.style.fontWeight = 'bold';
    }
    row.appendChild(fallCell);
    
    // Add row to the top of the table
    if (historyDataElement.firstChild) {
      historyDataElement.insertBefore(row, historyDataElement.firstChild);
    } else {
      historyDataElement.appendChild(row);
    }
    
    // Limit the number of rows
    const maxRows = 50;
    while (historyDataElement.children.length > maxRows) {
      historyDataElement.removeChild(historyDataElement.lastChild);
    }
  });
  
  // Refresh history button
  refreshHistoryButton.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/sensordata/history');
      const data = await response.json();
      updateHistoryTable(data);
      console.log('History refreshed from server');
    } catch (error) {
      console.error('Error refreshing history:', error);
    }
  });
  
  // Initial fetch of data (in case socket connection is delayed)
  async function fetchInitialData() {
    try {
      const response = await fetch('/api/sensordata/latest');
      const data = await response.json();
      
      // Only update if we received some data and socket hasn't connected yet
      if (data && Object.keys(data).length > 0 && connectionStatus.textContent !== 'Connected') {
        updateUI(data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }
  
  fetchInitialData();
});