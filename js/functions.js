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
    onDropdownSelect();
}

//SELECT DROPDOWN
function onDropdownSelect()
{
    [state.currentCountry.isoa2, state.currentCountry.isoa3, state.currentCountry.ison3, state.currentCountry.name] = $("#dropdown").val().split(',');
    drawCountryBorder();
    updateFlag();
}

//DRAW COUNTRY BORDER
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

//UPDATE FLAG
function updateFlag()
{
    if (state.currentCountry.isoa2 === "--") { return; }
    $("#flag").attr("src", "assets/unknown_flag.png");
    $.ajax({ url: "php/restcountries/getFlagFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.currentCountry.isoa3 } }).then((restCountriesResult) => 
    {
        if (restCountriesResult) { $("#flag").attr("src", restCountriesResult.data.flags.png); }
    });
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
    $("#pre-load-modal").removeClass("fade-out");
    $("#modal-title").html("National Overview");
    const html = await $.get("html/national_overview.html");
    $("#modal-inner").append(html);
    $("#modal").modal("show");
    $("#isoa2").html(state.currentCountry.isoa2);
    $("#isoa3").html(state.currentCountry.isoa3);
    $("#ison3").html(state.currentCountry.ison3);
    const restCountriesResult = await $.ajax({ url: "php/restcountries/getOverviewFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.currentCountry.isoa3 } });
    console.log(restCountriesResult);
    //COMMON NAME
    //OFFICAL NAME
    //ISO A2/A3/N3
    //REGION
    //CONTINENT
    //CAPITAL
    //AREA
    //INTERNATIONAL STATUS
    //POPULATION
    //ROADS
    //CURRENCIES
    //LANGUAGES
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN EXCHANGE RATE
async function openExchangeRate()
{
    $("#pre-load-modal").removeClass("fade-out");
    $("#modal-title").html("Exchange Rate");
    const html = await $.get("html/exchange_rate.html");
    $("#modal-inner").append(html);
    $("#modal").modal("show");
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN TIME ZONE CONVERSION
async function openTimeZoneConversion()
{
    $("#pre-load-modal").removeClass("fade-out");
    $("#modal-title").html("Time Zone Conversion");
    $("#modal").modal("show");
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LATEST NEWS
async function openLatestNews()
{
    $("#pre-load-modal").removeClass("fade-out");
    $("#modal-title").html("Latest News");
    $("#modal").modal("show");
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN WIKIPEDIA ARTICLE
async function openWikipediaArticle()
{
    $("#pre-load-modal").removeClass("fade-out");
    $("#modal-title").html("Wikipedia Article");
    $("#modal").modal("show");
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LOCAL FAVOURITES
async function openLocalFavourites()
{
    $("#pre-load-modal").removeClass("fade-out");
    // $("#flag").css("display", "none");
    $("#modal-title").html("Local Favourites");
    const html = await $.get("html/local_favourites.html");
    $("#modal-inner").append(html);
    $("#pre-load-modal").removeClass("fade-out");
    $("#modal").modal("show");
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LOCAL INFORMATION
async function openLocalInformation()
{

}

//CLOSE MODAL
function closeModal()
{
    $("#modal-title").html("");
    $("#modal-inner").empty();
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
    updateLatLng(state.currentLatLng);
    map.on("click", (event) => { onLocalSelect(event.latlng); } );
    map.on("move", onMoveMap);
    createEasyButtons();
    $("#modal").on("hidden.bs.modal", closeModal);
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