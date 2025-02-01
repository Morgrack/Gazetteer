//STATE
const state = 
{
    allowLatLngUpdate: true,
    currentCountry: { isoa2: "AF", isoa3: "AFG", ison3: "004", name: "Afghanistan" },
    currentGraphics: { border: null },
    currentLatLng: { lat: 34.52, lng: 69.18 },
    geoJSON: {}
}

//MAP
const stadiaOSMBright = L.tileLayer("https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}", { minZoom: 0, maxZoom: 20, ext: "png"/*, attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const stadiaAlidadeSatellite = L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}", { minZoom: 0, maxZoom: 20, ext: "jpg"/*, attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const layers = { "Street": stadiaOSMBright, "Satellite": stadiaAlidadeSatellite }
const map = L.map("map").setView([state.currentLatLng.lat, state.currentLatLng.lng], 5);
const layerControl = L.control.layers(layers).addTo(map);
stadiaOSMBright.addTo(map);

//GET GEOJSON
async function getGeoJSON()
{
    state.geoJSON = await $.ajax({ url: "php/local/getGeoJSON.php", type: "GET", dataType: "json" });
}

//GET CURRENT COUNTRY
async function getCurrentCountry()
{
    try
    {
        const geolocation = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true }));
        if (!geolocation) { return; }
        const openCageResult = await $.ajax({ url: "php/opencage/getCountryFromLatLng.php", type: "GET", dataType: "json", data: { lat: geolocation.coords.latitude, lng: geolocation.coords.longitude } });
        if (!openCageResult.data) { return; }
        for (let feature of state.geoJSON.features)
        {
            if (feature.properties.iso_a2 === openCageResult.data)
            { 
                state.currentCountry.isoa2 = feature.properties.iso_a2;
                state.currentCountry.isoa3 = feature.properties.iso_a3;
                state.currentCountry.ison3 = feature.properties.iso_n3;
                state.currentCountry.name = feature.properties.name;
                state.currentLatLng.lat = geolocation.coords.latitude;
                state.currentLatLng.lng = geolocation.coords.longitude;
                map.setView([state.currentLatLng.lat, state.currentLatLng.lng]);
            }
        }
    }
    catch
    {

    }   
}

//POPULATE DROPDOWN
function populateDropdown()
{
    $("#dropdown").append('<option value="--,--,--">--</option>');
    const results = [];
    for (let result of state.geoJSON.features)
    {
        const properties = result.properties;
        results.push({ isoa2: properties.iso_a2, isoa3: properties.iso_a3, ison3: properties.iso_n3, name: properties.name });
    }
    results.sort((a, b) => { return a.name > b.name ? 1 : -1 });
    for (let result of results)
    {
        $("#dropdown").append(`<option value="${result.isoa2},${result.isoa3},${result.ison3},${result.name}">${result.name}</option>`);
    }
    $("#dropdown").val(`${state.currentCountry.isoa2},${state.currentCountry.isoa3},${state.currentCountry.ison3},${state.currentCountry.name}`);
}

//SELECT DROPDOWN
function onDropdownSelect()
{
    [state.currentCountry.isoa2, state.currentCountry.isoa3, state.currentCountry.ison3, state.currentCountry.name] = $("#dropdown").val().split(',');
    drawCountryBorder();
}

//GREY OUT MAP
function drawCountryBorder()
{
    if (state.currentGraphics.border !== null) { state.currentGraphics.border.remove(); }
    for (let feature of state.geoJSON.features)
    {
        if (feature.properties.iso_a2 === state.currentCountry.isoa2)
        {
            state.currentGraphics.border = L.geoJSON(feature, { color: "black", dashArray: 5, fillOpacity: 0, weight: 3 }).addTo(map);
            map.fitBounds(state.currentGraphics.border.getBounds());
        }
    }
}

//ROUND TO DECIMAL PLACE
function roundToDecimalPlace(value, degrees)
{
    const factor = Math.pow(10, degrees);
    return Math.round(value*factor)/factor;
}

//UPDATE LATLNG
function updateLatLng(newLatLng)
{
    state.currentLatLng = newLatLng;
    $("#lat").val(roundToDecimalPlace(state.currentLatLng.lat, 4));
    $("#lng").val(roundToDecimalPlace(state.currentLatLng.lng, 4));
}

//LOCAL SELECT
function onLocalSelect(newLatLng)
{
    updateLatLng(newLatLng);
    state.allowLatLngUpdate = false;
    map.panTo([newLatLng.lat, newLatLng.lng], { duration: 0.25 });
    setTimeout(() => { state.allowLatLngUpdate = true; }, 270);
}

//LATLNG SEARCH
function onLatLngSearch()
{
    onLocalSelect({ lat: $("#lat").val(), lng: $("#lng").val() });
}

//ON MOVE MAP
function onMoveMap()
{
    if (state.allowLatLngUpdate) { updateLatLng(map.getCenter()); }
}

//OPEN NATIONAL OVERVIEW
async function openNationalOverview()
{
    $("#modal").modal("show");
    const restCountriesResult = await $.ajax({ url: "php/restcountries/getOverviewFromISO3.php", type: "GET", dataType: "json", data: { iso3: state.currentCountry.isoa3 } });
}

//OPEN EXCHANGE RATE
async function openExchangeRate()
{

}

//OPEN TIME ZONE CONVERSION
async function openTimeZoneConversion()
{

}

//OPEN LATEST NEWS
async function openLatestNews()
{

}

//OPEN WIKIPEDIA ARTICLE
async function openWikipediaArticle()
{

}

//OPEN LOCAL FAVOURITES
async function openLocalFavourites()
{

}

//CLOSE MODAL
function closeModal()
{
    
}

//CREATE EASY BUTTONS
function createEasyButtons()
{
    L.easyButton("fa-solid fa-globe", openNationalOverview).addTo(map);
    L.easyButton("fa-solid fa-money-bill-transfer", openExchangeRate).addTo(map);
    L.easyButton("fa-solid fa-clock-rotate-left", openTimeZoneConversion).addTo(map);
    L.easyButton("fa-solid fa-newspaper", openLatestNews).addTo(map);
    L.easyButton("fa-brands fa-wikipedia-w", openWikipediaArticle).addTo(map);
    L.easyButton("fa-solid fa-heart", openLocalFavourites).addTo(map);
}

//DOCUMENT READY
$(document).ready(async () => 
{
    await getGeoJSON();
    //await getCurrentCountry();
    populateDropdown(); 
    $("#dropdown").change(onDropdownSelect);
    drawCountryBorder();
    updateLatLng(state.currentLatLng);
    map.on("click", (event) => { onLocalSelect(event.latlng); } );
    map.on("move", onMoveMap);
    createEasyButtons();
    $("#latlng-search").click(onLatLngSearch);
    $("#pre-load-page").addClass("fade-out");
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