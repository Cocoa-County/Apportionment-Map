# Apportionment-Map

This is an interactive property tax apportionment map. It uses the Leaflet.js library to create a map and markers. The map features a search bar control [`searchBarControl`](src/index.js) and a sidebar control [`info`](src/index.js) for displaying property tax apportionment information.

## Demo

https://cocoa-county.github.io/Apportionment-Map/

## Installation

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm run build` to build the project

## Usage

1. Run `npm run start` to start the server
2. Open your browser and navigate to `http://localhost:8080`
3. Use the search bar to find specific locations on the map
4. Click on a marker to view the property tax apportionment information in the sidebar

## Development

For development, you can use the `npm run start:dev` command. This will start the webpack dev server. The project uses webpack for bundling and transpiling the code.

## Advanced Development

### Gathering GIS Data

This project includes a script for gathering GIS data, which is used to populate the map with property tax apportionment information. The data is already included in the repository, but if you need to gather fresh data, you can use the `npm run gather:data` command.

This command runs the `gisdata.js` script located in the `scripts/` directory of the project. The script fetches all the GIS data from an ArcGIS REST API endpoint, processes the data, and writes it to a file named `data.geojson` in the `public/` directory of the project.

Here's how to use it:

1. Run `npm run gather:data` in your terminal. This will start the data gathering process.
2. The script will fetch data in chunks from the API and process it. This might take a while depending on the amount of data.
3. Once the script finishes running, you'll find the updated `data.geojson` file in the `public/` directory.

Please note that this is an optional step. You only need to run this command if you want to update the GIS data used by the map, which you should not have to do.

## License

This project is licensed under the terms of the GNU General Public License. For more information, see the [LICENSE](LICENSE) file.