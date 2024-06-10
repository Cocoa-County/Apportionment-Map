const http = require('http');
const https = require('https');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

function getRates(tra) {
  console.log('Getting rates for TRA:', tra);
  return new Promise((resolve, reject) => {
    const url = `http://cccounty.oli.us/EA9248/TRA${tra.substring(1)}.htm`;
    console.log('URL:', url);

    http.get(url, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const dom = new JSDOM(data);
        const document = dom.window.document;

        const rows = Array.from(document.querySelectorAll('table tr'));
        const rates = rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          let r = {
            name: cells[0].textContent.trim(),
            class: cells[0].textContent.trim(),
            rate: parseFloat(cells[1].textContent.trim().replace('%', '')) / 100
          };
          return r;
        });

        // Remove the last row (total)
        rates.pop();

        resolve(rates);
      });

      res.on('error', err => {
        reject(err);
      });
    });
  });
}

// Base URL for the ArcGIS REST API endpoint
const baseUrl = 'https://services6.arcgis.com/snwvZ3EmaoXJiugR/ArcGIS/rest/services/Contra_Costa_2023_Roll_Year/FeatureServer/1/query';

// Parameters for the query
const params = {
  where: '1=1',
  outFields: '*',
  outSR: '4326',
  f: 'geojson',
  resultOffset: 0,
  resultRecordCount: 1000  // Adjust this value based on the server's limit
};

// Function to make a request and return the data as a promise
function getData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });

    }).on("error", (err) => {
      reject(err);
    });
  });
}

// Recursive function to get all data
async function getAllData() {
  let allData = [];
  let moreData = true;

  while (moreData) {
    const url = new URL(baseUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const data = await getData(url);
    allData = allData.concat(data.features);

    if (data.features.length < params.resultRecordCount) {
      moreData = false;
    } else {
      params.resultOffset += params.resultRecordCount;
    }
  }

  return allData;
}

getAllData().then(async allData => {
  const dir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  const outputPath = path.join(dir, 'data.geojson');

  // Add apportionment rates to each feature
  const allDataWithRates = [];
  for (const feature of allData) {
    const tra = feature.properties.TRA;
    const apportionmentRates = await getRates(tra);

    allDataWithRates.push({
      ...feature,
      properties: {
        ...feature.properties,
        apportionmentRates,
      },
    });
  }

  // Write the GeoJSON data to a file
  fs.writeFileSync(outputPath, JSON.stringify({ type: 'FeatureCollection', features: allDataWithRates }));
}).catch(err => {
  console.error('Error:', err);
});