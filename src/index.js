import L from 'leaflet';

const map = L.map('map').setView([37.8534, -121.9018], 10); // Set view to Contra Costa County

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Create a control for the sidebar
const info = L.control();

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this._div.style.backgroundColor = 'white'; // set the background color to white
    this._div.style.padding = '10px'; // add some padding
    this._div.style.border = '1px solid black'; // add a border
    this.update();
    return this._div;
};

info.update = function (props) {
    this._div.innerHTML = (props ?
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
        </table>`
        : 'Click a TRA');
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
        }
    });

    if (feature.properties && feature.properties.TRA) {
        let popupContent = `<h3>TRA: ${feature.properties.TRA}</h3>`;
        layer.bindPopup(popupContent);
    }
}

// Load GeoJSON data from a local file
fetch('data.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(error => console.error('Error:', error));