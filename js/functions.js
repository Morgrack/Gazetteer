//LEAFLET MAP
const stadiaOSMBright = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}', { minZoom: 0, maxZoom: 20, ext: 'png'/*, attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const stadiaAlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', { minZoom: 0, maxZoom: 20, ext: 'jpg'/*, attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const layers = { "Street": stadiaOSMBright, "Satellite": stadiaAlidadeSatellite }
const map = L.map("map").setView([34.52, 69.18], 5);
const layerControl = L.control.layers(layers).addTo(map);
stadiaOSMBright.addTo(map)

//LOCAL SELECT
function localSelect(event)
{
    map.panTo([event.latlng.lat, event.latlng.lng], { duration: 0.25 });
    
}

//DOCUMENT READY
$(document).ready(() => 
{
    map.on("click", (event) => { localSelect(event); } );
});

