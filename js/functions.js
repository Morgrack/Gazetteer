//STATE
const state = 
{
    allowLatLngUpdate: true,
    currentLatLng: { lat: 34.52, lng: 69.18 },
    currentISO2: "AF",
    currentISO3: "AFG"
}

//LEAFLET MAP
const stadiaOSMBright = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}', { minZoom: 0, maxZoom: 20, ext: 'png'/*, attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const stadiaAlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', { minZoom: 0, maxZoom: 20, ext: 'jpg'/*, attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const layers = { "Street": stadiaOSMBright, "Satellite": stadiaAlidadeSatellite }
const map = L.map("map").setView([state.currentLatLng.lat, state.currentLatLng.lng], 5);
const layerControl = L.control.layers(layers).addTo(map);
stadiaOSMBright.addTo(map);

//LOCAL SELECT
function localSelect(event)
{
    state.currentLatLng = event.latlng;
    state.allowLatLngUpdate = false;
    map.panTo([state.currentLatLng.lat, state.currentLatLng.lng], { duration: 0.25 });
    setTimeout(() => { state.allowLatLngUpdate = true; }, 251);
}

//UPDATE LATLNG
function updateLatLng()
{
    if (state.allowLatLngUpdate)
    {
        state.currentLatLng = map.getCenter();
    }
}

//DOCUMENT READY
$(document).ready(async () => 
{
    map.on("click", (event) => { localSelect(event); } );
    map.on("move", updateLatLng);
    $('#pre-load-page').addClass('fadeOut');
});

//LOCAL INFORMATION SCROLLABLE (e.g. weather, landmarks, also changes current nation to one selected if possible, thereby greying out all others)

//TOP RIGHT FILTERS SHOW WORLDWIDE UNLESS COUNTRY IS SELECTED

//of each modal top black bar: flag, title

//overview-modal (black and white table)

//time-modal (black and white table)

//exchange-modal (simple dropdown box to dropdown box with text)

//news-modal (laid out boxes with red outlines)

//wikipedia-modal (just the article)

//favourites-modal (name, date of saving, latitude, longitude)