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
    .catch(error => console.error('Error:', error));
console.log(map);