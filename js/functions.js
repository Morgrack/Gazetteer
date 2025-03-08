//STATE
const state =
{
    allowLatLngUpdate: true,
    currentCountry: { isoa2: "AF", isoa3: "AFG", ison3: "004", name: "Afghanistan" },
    currentFlag: "assets/unknown.png",
    currentGraphics: { border: null },
    currentLatLng: { lat: 34.52, lng: 69.18 }
}

//MAP
const stadiaOSMBright = L.tileLayer("https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}", { minZoom: 0, maxZoom: 20, ext: "png"/*, attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const stadiaAlidadeSatellite = L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}", { minZoom: 0, maxZoom: 20, ext: "jpg"/*, attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const layers = { "Street": stadiaOSMBright, "Satellite": stadiaAlidadeSatellite }
const map = L.map("map").setView([state.currentLatLng.lat, state.currentLatLng.lng], 5);
const layerControl = L.control.layers(layers).addTo(map);
stadiaOSMBright.addTo(map);


//GET GEOJSON
let geoJSON = {}
async function getGeoJSON()
{
    geoJSON = await $.ajax({ url: "php/local/getGeoJSON.php", type: "GET", dataType: "json" });
}

//GET CURRENT COUNTRY
async function getCurrentCountry()
{
    try
    {
        const geolocation = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true }));
        if (!geolocation) { return; }
        const openCageResult = await $.ajax({ url: "php/opencage/getISOA3FromLatLng.php", type: "GET", dataType: "json", data: { lat: geolocation.coords.latitude, lng: geolocation.coords.longitude } });
        if (!openCageResult.data) { return; }
        for (let feature of geoJSON.features)
        {
            if (feature.properties.iso_a3 !== openCageResult.data) { continue; }
            state.currentCountry.isoa2 = feature.properties.iso_a2;
            state.currentCountry.isoa3 = feature.properties.iso_a3;
            state.currentCountry.ison3 = feature.properties.iso_n3;
            state.currentCountry.name = feature.properties.name;
            state.currentLatLng.lat = geolocation.coords.latitude;
            state.currentLatLng.lng = geolocation.coords.longitude;
            map.setView([state.currentLatLng.lat, state.currentLatLng.lng]);
        }
    }
    catch(error)
    {
        throw(error);
    }
}

//POPULATE DROPDOWN
function populateDropdown()
{
    $("#dropdown").append('<option value="--,--,--">--</option>');
    const results = [];
    for (let result of geoJSON.features)
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
    drawCountryBorder(false);
    updateFlag();
}

//ROUND TO DECIMAL PLACE
function roundToDecimalPlace(value, degrees)
{
    const factor = Math.pow(10, degrees);
    return Math.round(value*factor)/factor;
}

//DRAW COUNTRY BORDER
function drawCountryBorder(fitBounds)
{
    if (state.currentGraphics.border !== null) { state.currentGraphics.border.remove(); }
    if (state.currentCountry.isoa3 === "--") { return; }
    for (let feature of geoJSON.features)
    {
        if (feature.properties.iso_a3 !== state.currentCountry.isoa3) { continue; }
        state.currentGraphics.border = L.geoJSON(feature, { color: "black", dashArray: 5, fillOpacity: 0, weight: 3 }).addTo(map);
        if (fitBounds) { map.fitBounds(state.currentGraphics.border.getBounds()); }
    }
}

//UPDATE FLAG
function updateFlag()
{
    $("#flag").attr("src", "assets/unknown.png");
    if (state.currentCountry.isoa3 === "--") { return; }
    $.ajax({ url: "php/restcountries/getFlagFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.currentCountry.isoa3 } }).then((restCountriesResult) => 
    {
        if (restCountriesResult.data)
        { 
            state.currentFlag = restCountriesResult.data.flags.png
            $("#flag").attr("src", state.currentFlag); 
        }
    });
}

//ON DROPDOWN SELECT
function onDropdownSelect()
{
    [state.currentCountry.isoa2, state.currentCountry.isoa3, state.currentCountry.ison3, state.currentCountry.name] = $("#dropdown").val().split(',');
    drawCountryBorder(true);
    updateFlag();
}

//UPDATE LATLNG
function updateLatLng(newLatLng)
{
    state.currentLatLng = newLatLng;
    $("#lat").val(roundToDecimalPlace(state.currentLatLng.lat, 4));
    $("#lng").val(roundToDecimalPlace(state.currentLatLng.lng, 4));
}

//ON LOCAL SELECT
function onLocalSelect(newLatLng)
{
    updateLatLng(newLatLng);
    state.allowLatLngUpdate = false;
    map.panTo([newLatLng.lat, newLatLng.lng], { duration: 0.25 });
    setTimeout(() => { state.allowLatLngUpdate = true; openLocalInformation(); }, 270);
}

//ON MOVE MAP
function onMoveMap()
{
    if (state.allowLatLngUpdate) { updateLatLng(map.getCenter()); }
}

//ON LATLNG SEARCH
function onLatLngSearch()
{
    onLocalSelect({ lat: $("#lat").val(), lng: $("#lng").val() });
}

//ON EXCHANGE RATE CHANGE
function onExchangeRateChange(collatedInfo)
{
    const inputCurrency = $("#exchange-rate-input-dropdown").val();
    const outputCurrency = $("#exchange-rate-output-dropdown").val();
    $("#exchange-rate-input-symbol").html(collatedInfo[inputCurrency].symbol);
    $("#exchange-rate-output-symbol").html(collatedInfo[outputCurrency].symbol);
    const outputValue = roundToDecimalPlace($("#exchange-rate-input-text").val()/collatedInfo[inputCurrency].rate*collatedInfo[outputCurrency].rate, 2);
    $("#exchange-rate-output-text").val(outputValue);
}

//OFFSET MINUTES
function offsetMinutes(totalMinutes, offset)
{
    let newTime = (totalMinutes + offset) % 1440; //1440 is the total minutes in one day
    if (newTime < 0) { newTime = 1440 + newTime; } //if time is negative, how much it should take away from 24:00
    return newTime;
}

//DIGITAL TIME TO MINUTES
function digitalTimeToMinutes(digitalTime)
{ 
    const regex = /^[+-]?\d{2}:\d{2}$/;
    if (!regex.test(digitalTime)) { return 0; }
    let negative = digitalTime[0] === "-";
    digitalTime = digitalTime.slice(-5);
    const [hours, minutes] = digitalTime.split(":");
    const totalMinutes = Number(hours)*60 + Number(minutes);
    return negative ? 0 - totalMinutes : totalMinutes;
}

//MINUTES TO DIGITAL TIME
function minutesToDigitalTime(totalMinutes)
{
    const negative = totalMinutes < 0;
    totalMinutes = Math.abs(totalMinutes);
    const hours = ((totalMinutes - (totalMinutes % 60)) / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
    return negative ? "-" + hours + ":" + minutes : hours + ":" + minutes;
}

//ON TIME ZONE CHANGE
function onTimeZoneChange()
{
    const inputUTCOffset = digitalTimeToMinutes($("#time-conversion-input-dropdown").val().slice(-6));
    const outputUTCOffset = digitalTimeToMinutes($("#time-conversion-output-dropdown").val().slice(-6));
    const inputTime = digitalTimeToMinutes($("#time-conversion-input-text").val().slice(-6));
    const offsetDifference = outputUTCOffset - inputUTCOffset;
    const newTime = offsetMinutes(inputTime, offsetDifference);
    const outputTime = minutesToDigitalTime(newTime); 
    $("#time-conversion-output-text").val(outputTime);
}

//FIND MIN TEMP
function findMinTemp(forecasts)
{
    let minTemp = forecasts[0].main.temp_min;
    for (let i = 1; i < forecasts.length; i++)
    {
        if (forecasts[i].main.temp_min < minTemp) { minTemp = forecasts[i].main.temp_min; }
    }
    return minTemp;
}

//FIND MAX TEMP
function findMaxTemp(forecasts)
{
    let maxTemp = forecasts[0].main.temp_max;
    for (let i = 1; i < forecasts.length; i++)
    {
        if (forecasts[i].main.temp_max > maxTemp) { maxTemp = forecasts[i].main.temp_max; }
    }
    return maxTemp;
}

//FIND MOST COMMON WEATHER
function findMostCommonWeather(forecasts)
{
    return "https://openweathermap.org/img/wn/01d@2x.png"
}

//GET LOCAL FLAG
function getLocalFlag()
{
    $.ajax({ url: "php/opencage/getISOA3FromLatLng.php", type: "GET", dataType: "json", data: { lat: state.currentLatLng.lat, lng: state.currentLatLng.lng } }).then((result) => 
    {  
        $.ajax({ url: "php/restcountries/getFlagFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: result.data } }).then((restCountriesResult) => 
        {
            if (!restCountriesResult.data) { return; }
            if (restCountriesResult.data.flags)
            {
                $("#flag").attr("src", restCountriesResult.data.flags.png);
            }
            else
            {
                $("#flag").attr("src", "assets/pirate.png");
            }
        });
    })
}

//OPEN NATIONAL OVERVIEW
async function openNationalOverview() //TODO: add UN data for GDP
{
    $("#modal-title").html("National Overview");
    $("#modal-container").append(await $.get("html/single/national_overview.html"));
    $("#modal").modal("show");
    const restCountriesResult = await $.ajax({ url: "php/restcountries/getOverviewFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.currentCountry.isoa3 } });
    if (restCountriesResult.data)
    {
        $("#iso").html(`${state.currentCountry.isoa2} / ${state.currentCountry.isoa3} / ${state.currentCountry.ison3}`);
        $("#common-name").html(restCountriesResult.data.name.common);
        $("#official-name").html(restCountriesResult.data.name.official);
        $("#diplomatic-status").html(`${restCountriesResult.data.independent ? "Sovereign" : "Contested"}, ${restCountriesResult.data.unMember ? "UN Member" : "Non-UN Member"}`);
        $("#continents").html(restCountriesResult.data.continents.join(", "));
        $("#region").html(restCountriesResult.data.region);
        $("#subregion").html(restCountriesResult.data.subregion);
        $("#area").html(`${restCountriesResult.data.area}km&sup2`);
        $("#capital").html(restCountriesResult.data.capital[0]);
        $("#currencies").html(Object.keys(restCountriesResult.data.currencies).join(", "));
        $("#languages").html(Object.values(restCountriesResult.data.languages).join(", "));
        $("#population").html(restCountriesResult.data.population);
        $("#roads").html(`Drives on ${restCountriesResult.data.car.side}`);
        $("#time-zones").html(restCountriesResult.data.timezones.join(", "));
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN EXCHANGE RATE
async function openExchangeRate()
{
    $("#modal-title").html("Exchange Rate");
    $("#modal-container").append(await $.get("html/single/exchange_rate.html"));
    $("#modal").modal("show");
    const [restCountriesCurrentCurrency, restCountriesAllCurrencies, openExchangeRatesResult] = await Promise.all([
        $.ajax({ url: "php/restcountries/getCurrencyFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.currentCountry.isoa3 } }),
        $.ajax({ url: "php/restCountries/getCurrencies.php", type: "GET", dataType: "json" }),
        $.ajax({ url: "php/openexchangerates/getExchangeRates.php", type: "GET", dataType: "json" })
    ]);
    if (restCountriesCurrentCurrency.data && restCountriesAllCurrencies.data && openExchangeRatesResult.data)
    {
        const collatedInfo = {}
        for (let result of restCountriesAllCurrencies.data)
        {
            for (let currency of Object.keys(result.currencies))
            {
                if (!openExchangeRatesResult.data.rates.hasOwnProperty(currency)) { continue; }
                collatedInfo[currency] =
                {
                    code: currency,
                    name: result.currencies[currency].name,
                    symbol: result.currencies[currency].symbol,
                    rate: openExchangeRatesResult.data.rates[currency]
                }
            }
        }
        const sortedInfo = Object.values(collatedInfo).sort((a, b) => { return a.code > b.code ? 1 : -1 });
        for (let result of sortedInfo)
        {
            $("#exchange-rate-input-dropdown").append(`<option value="${result.code}">${result.code} (${result.name})</option>`);
            $("#exchange-rate-output-dropdown").append(`<option value="${result.code}">${result.code} (${result.name})</option>`);
        }
        const current = Object.keys(restCountriesCurrentCurrency.data.currencies)[0];
        $("#exchange-rate-input-dropdown").val(current);
        $("#exchange-rate-output-dropdown").val("USD");
        $("#exchange-rate-input-text").val("100.00");
        $("#exchange-rate-input-text").change(() => { onExchangeRateChange(collatedInfo); });
        $("#exchange-rate-input-dropdown").change(() => { onExchangeRateChange(collatedInfo); });
        $("#exchange-rate-output-dropdown").change(() => { onExchangeRateChange(collatedInfo); });
        onExchangeRateChange(collatedInfo);
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN TIME ZONE CONVERSION
async function openTimeZoneConversion() //TODO: add tick box to keep sync with current time
{
    $("#modal-title").html("Time Zone Conversion");
    $("#modal-container").append(await $.get("html/single/time_zone_conversion.html"));
    $("#modal").modal("show");
    const [restCountriesCurrentTimeZone, restCountriesAllTimeZones] = await Promise.all([
        $.ajax({ url: "php/restcountries/getTimeZoneFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.currentCountry.isoa3 } }),
        $.ajax({ url: "php/restCountries/getTimeZones.php", type: "GET", dataType: "json" })    
    ]);
    if (restCountriesCurrentTimeZone.data && restCountriesAllTimeZones.data)
    {
        const uniqueTimeZones = {}
        for (let result of restCountriesAllTimeZones.data)
        {
            for (let timeZone of result.timezones)
            {
                uniqueTimeZones[timeZone] = timeZone;
            }
        }
        const sortedTimeZones = Object.values(uniqueTimeZones).sort((a, b) => { return a > b ? 1 : -1 });
        for (let result of sortedTimeZones)
        {
            $("#time-conversion-input-dropdown").append(`<option value="${result}">${result}</option>`);
            $("#time-conversion-output-dropdown").append(`<option value="${result}">${result}</option>`);
        }
        const current = restCountriesCurrentTimeZone.data.timezones[0];
        $("#time-conversion-input-dropdown").val(current);
        $("#time-conversion-output-dropdown").val(current);
        const offset = digitalTimeToMinutes(current.slice(-6));
        const newTime = offsetMinutes(Math.floor(Date.now() / 60000), offset);
        const newTimeFormatted = minutesToDigitalTime(newTime);
        $("#time-conversion-input-text").val(newTimeFormatted);
        $("#time-conversion-input-text").change(onTimeZoneChange);
        $("#time-conversion-input-dropdown").change(onTimeZoneChange);
        $("#time-conversion-output-dropdown").change(onTimeZoneChange);
        onTimeZoneChange();
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LATEST NEWS
async function openLatestNews()
{
    $("#modal-title").html("Latest News");
    $("#modal").modal("show");
    const newsDataResult = await $.ajax({ url: "php/newsdata/getNewsFromISOA2.php", type: "GET", dataType: "json", data: { isoa2: state.currentCountry.isoa2 } });
    if (newsDataResult.data)
    {
        const html = $(await $.get("html/multiple/news.html"));
        for (let result of newsDataResult.data)
        {
            const newElement = $(html[0].outerHTML);
            newElement.find(".latest-news-image").attr("src", result.image_url);
            newElement.find(".latest-news-title").attr("href", result.source_url);
            newElement.find(".latest-news-title").html(result.title);
            newElement.find(".latest-news-categories").html(result.category.map(word => word.slice(0, 1).toUpperCase() + word.slice(1)).join(", "));
            $("#modal-container").append(newElement);
        }
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN WIKIPEDIA ARTICLE
async function openWikipediaArticle()
{
    $("#modal-title").html("Wikipedia Article");
    $("#modal").modal("show");
    $("#modal-container").append(await $.get("html/single/wikipedia_article.html"));
    const geoNamesResult = await $.ajax({ url: "php/geonames/getWikipediaFromCountryName.php", type: "GET", dataType: "json", data: { name: state.currentCountry.name.replace(' ', "%20") } });
    if (geoNamesResult.data)
    {
        $("#wikipedia-article-title").html(geoNamesResult.data.title);
        $("#wikipedia-article-summary").html(geoNamesResult.data.summary);
        $("#wikipedia-article-link").attr("href", geoNamesResult.data.wikipediaURL);
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LOCAL FAVOURITES
async function openLocalFavourites() //TODO: populate with cookies
{
    $("#flag").css("display", "none");
    $("#modal-title").html("Local Favourites");
    $("#modal-container").append(await $.get("html/multiple/favourite.html"));
    $("#modal").modal("show");
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LOCAL INFORMATION
async function openLocalInformation()
{
    $("#flag").attr("src", "assets/unknown_flag.png");
    getLocalFlag();
    $("#modal-title").html("Local Information");
    $("#modal-container").append(await $.get("html/single/local_information.html"));
    $("#modal").modal("show");
    const [openWeatherResult, geoNamesResult] = await Promise.all([
        $.ajax({ url: "php/openweather/getForecastFromLatLng.php", type: "GET", dataType: "json", data: { lat: state.currentLatLng.lat, lng: state.currentLatLng.lng } }),
        $.ajax({ url: "php/geonames/getLandmarksFromLatLng.php", type: "GET", dataType: "json", data: { lat: state.currentLatLng.lat, lng: state.currentLatLng.lng } })
    ]);
    if (openWeatherResult.data)
    {
        const collatedInfo = [];
        let currentDate = "";
        let dayCount = -1;
        for (let i = 0; i < openWeatherResult.data.length && dayCount < 7; i++)
        {
            const date = openWeatherResult.data[i].dt_txt.slice(0, 10);
            if (date !== currentDate)
            {
                dayCount++
                currentDate = date;
                collatedInfo.push([]);
            }
            collatedInfo[dayCount].push(openWeatherResult.data[i]);
        }
        const html = $(await $.get("html/multiple/forecast.html"));
        for (let forecast of collatedInfo)
        {
            const newElement = $(html[0].outerHTML);
            newElement.find(".forecast-title").html("Mon");
            newElement.find(".forecast-image").attr("src", findMostCommonWeather(forecast));
            newElement.find(".forecast-max-temp").html(roundToDecimalPlace(findMaxTemp(forecast), 0) + "°");
            newElement.find(".forecast-min-temp").html(roundToDecimalPlace(findMinTemp(forecast), 0) + "°");
            $("#forecast-array").append(newElement);
        }
    }
    $("#pre-load-modal").addClass("fade-out");
}

//CLOSE MODAL
function closeModal()
{
    $("#flag").css("display", "inline");
    $("#flag").attr("src", state.currentFlag);
    $("#modal-title").html("");
    $("#modal-container").empty();
    $("#pre-load-modal").removeClass("fade-out");
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
    await getCurrentCountry();
    populateDropdown(); 
    $("#dropdown").change(onDropdownSelect);
    updateLatLng(state.currentLatLng);
    map.on("click", (event) => { onLocalSelect(event.latlng); } );
    map.on("move", onMoveMap);
    $("#latlng-search").click(onLatLngSearch);
    createEasyButtons();
    $("#modal").on("hidden.bs.modal", closeModal);
    $("#pre-load-page").addClass("fade-out");
});