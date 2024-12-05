import L from 'leaflet';

async function searchAddress(searchString) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchString)}&addressdetails=1&countrycodes=us&viewbox=-122.444352643124,37.7116795066314,-121.532634862124,38.1058385973016&bounded=1`);
    const data = await response.json();
    return data;
}

const map = L.map('map', {zoomControl: false}).setView([37.8534, -121.9018], 10); // Set view to Contra Costa County

L.control.zoom({
    position: 'bottomleft'
}).addTo(map)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Create a title screen
function createTitleScreen() {
    const titleScreen = L.DomUtil.create('div', 'title-screen');
    titleScreen.style.position = 'fixed';
    titleScreen.style.top = '0';
    titleScreen.style.left = '0';
    titleScreen.style.width = '100vw';
    titleScreen.style.height = '100vh';
    titleScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    titleScreen.style.display = 'flex';
    titleScreen.style.justifyContent = 'center';
    titleScreen.style.alignItems = 'center';
    titleScreen.style.zIndex = '1000';

    const titleContent = L.DomUtil.create('div', 'title-content', titleScreen);
    titleContent.style.backgroundColor = '#f8f9fa'; // Light gray background
    titleContent.style.padding = '40px';
    titleContent.style.borderRadius = '10px';
    titleContent.style.textAlign = 'center';
    titleContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';

    const titleText = L.DomUtil.create('h1', undefined, titleContent);
    titleText.textContent = 'Contra Costa County Property Tax Apportionment Map';
    titleText.style.marginBottom = '20px';
    titleText.style.color = '#333';

    const descriptionText = L.DomUtil.create('p', undefined, titleContent);
    descriptionText.textContent = 'This map illustrates the distribution of property taxes to local agencies within Contra Costa County, CA for the 2023-24 tax year.';
    descriptionText.style.marginBottom = '20px';
    descriptionText.style.color = '#555';

    const disclaimerText = L.DomUtil.create('p', undefined, titleContent);
    disclaimerText.textContent = 'Disclaimer: This map was created by a third party without collaboration or authorization by Contra Costa County.';
    disclaimerText.style.marginBottom = '20px';
    disclaimerText.style.color = '#ff0000';

    const sourceCodeLink = L.DomUtil.create('p', undefined, titleContent);
    sourceCodeLink.innerHTML = 'Source code: <a href="https://github.com/Cocoa-County/Apportionment-Map" target="_blank" style="color: #007bff;">GitHub</a>';
    sourceCodeLink.style.marginBottom = '10px';

    const dataSourceInfo = L.DomUtil.create('p', undefined, titleContent);
    dataSourceInfo.innerHTML = `<i>Generated using public data<br />
        <a href="https://www.contracosta.ca.gov/6581/Where-Your-Taxes-Go" target="_blank" style="color: #007bff;">2023-24 Tax Apportionment Data</a><br />
        <a href="https://services6.arcgis.com/snwvZ3EmaoXJiugR/ArcGIS/rest/services/Contra_Costa_2023_Roll_Year/FeatureServer/" target="_blank" style="color: #007bff;">Tax Rate Area GIS Shape Data</a></i>`;
    dataSourceInfo.style.marginBottom = '20px';

    const startButton = L.DomUtil.create('button', undefined, titleContent);
    startButton.textContent = 'Enter';
    startButton.style.padding = '10px 20px';
    startButton.style.fontSize = '16px';
    startButton.style.color = 'white';
    startButton.style.backgroundColor = '#007bff';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '5px';
    startButton.style.cursor = 'pointer';
    startButton.style.transition = 'background-color 0.3s';
    startButton.onmouseover = function() {
        startButton.style.backgroundColor = '#0056b3';
    };
    startButton.onmouseout = function() {
        startButton.style.backgroundColor = '#007bff';
    };
    startButton.onclick = function() {
        document.body.removeChild(titleScreen);
    };

    document.body.appendChild(titleScreen);
}

// Show the title screen
createTitleScreen();

// SearchBar Component
function SearchBar(map) {
    const div = L.DomUtil.create('div');
    const form = L.DomUtil.create('form', undefined, div);
    const input = L.DomUtil.create('input', undefined, form);
    input.type = 'text';
    input.placeholder = 'Enter an address';
    const button = L.DomUtil.create('button', undefined, form);
    button.type = 'submit';
    button.textContent = 'Search';

    let lastMarker; // Keep a reference to the last marker

    // Handle form submission
    form.onsubmit = async function(e) {
        e.preventDefault();
        const searchString = input.value;
        const results = await searchAddress(searchString);
        console.log(results);
        if (results[0]) {
            if (lastMarker) {
                map.removeLayer(lastMarker); // Remove the last marker
            }
            lastMarker = L.marker([results[0].lat, results[0].lon]).addTo(map)
                .bindPopup(results[0].display_name)
                .openPopup();
            map.setView([results[0].lat, results[0].lon],14);
        }
    };

    return div;
}

// Create a new control for the search bar
const searchBarControl = L.control({position: 'topleft'});

searchBarControl.onAdd = function () {
    // Create a div for the SearchBar component
    const div = L.DomUtil.create('div', 'search-bar');
    div.style.left = '50vw';
    div.style.transform = 'translateX(-50%)';

    // Add the SearchBar component to the div
    const searchBar = new SearchBar(map);
    div.appendChild(searchBar);

    return div;
};

searchBarControl.addTo(map);

// Create a control for the sidebar
const info = L.control();

// Info Component
info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this._div.style.backgroundColor = 'white'; // set the background color to white
    this._div.style.padding = '10px'; // add some padding
    this._div.style.border = '1px solid black'; // add a border
    this._div.style.display = 'none'; // initially hide the sidebar
    this._div.style.maxHeight = '400px'; // set max height
    this._div.style.overflowY = 'auto'; // make it scrollable vertically
    
    this.update();

    return this._div;
};

info.update = function (props) {
    if(!props) {
        this._div.style.display = 'none';
        return;
    }
    this._div.innerHTML = 
        `<h3 style="text-align: center; margin: 0 0; text-decoration: underline;">1% Tax Apportionment</h3>
        <table class="striped">
            <tr>
                <th>Name</th>
                <th>Rate</th>
            </tr>
            ${props.apportionmentRates.map(rate => 
                `<tr>
                    <td>${rate.name}</td>
                    <td style="text-align: right;">${(rate.rate * 100).toFixed(2)}%</td>
                </tr>`).join('')}
        </table>`;
};

info.addTo(map);

let selectedLayer = null;

function onEachFeature(feature, layer) {
    // Set the initial style to be invisible
    layer.setStyle({
        fillOpacity: 0,
        opacity: 0,
        color: '#000000', // black border
        weight: 0 // no border
    });

    layer.on({
        mouseover: function(e) {
            // When mouse is over, set the style to have a light gray border
            layer.setStyle({
                weight: 2, // border width
                fillOpacity: 0.2
            });
        },
        mouseout: function(e) {
            // When mouse is out, reset the border unless the layer is selected
            if (layer !== selectedLayer) {
                layer.setStyle({
                    weight: 0, // no border
                    fillOpacity: 0
                });
            }
        },
        click: function(e) {
            // When clicked, set the style to have a dark gray border and update the info
            if (selectedLayer) {
                // Reset the style of the previously selected layer
                selectedLayer.setStyle({
                    weight: 0, // no border
                    opacity: 0,
                    fillOpacity: 0
                });
            }
            selectedLayer = layer;
            layer.setStyle({
                weight: 2, // border width
                opacity: 1
            });
            info.update(feature.properties);
            info.getContainer().style.display = 'block'; // show the sidebar
        }
    });

    if (feature.properties && feature.properties.TRA) {
        let popupContent = `<h3>TRA: ${feature.properties.TRA}</h3>`;
        layer.bindPopup(popupContent);
    }
}

map.on('popupclose', function(e) {
    if (selectedLayer) {
        selectedLayer.setStyle({
            weight: 0, // no border
            opacity: 0,
            fillOpacity: 0
        });
        selectedLayer = null;
        info.update();
    }
});

// Load GeoJSON data from a local file
fetch('data.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(error => {
        console.error('Error:', error);
    });
console.log(map);