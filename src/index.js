import L from 'leaflet';

const map = L.map('map').setView([37.8534, -121.9018], 10); // Set view to Contra Costa County

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Load GeoJSON data from a local file
fetch('data.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data).addTo(map);
    })
    .catch(error => console.error('Error:', error));