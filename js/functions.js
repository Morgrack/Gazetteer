//STATE
const state =
{
    allowLatLngUpdate: true,
    country: { isoa2: "AF", isoa3: "AFG", ison3: "004", name: "Afghanistan" },
    flag: "assets/images/unknown.png",
    graphics: { border: null, forecast: null, airports: null, parks: null },
    latLng: { lat: 34.52, lng: 69.18 }
}

//MAP
const stadiaOSMBright = L.tileLayer("https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}", { minZoom: 0, maxZoom: 20, ext: "png"/*, attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const stadiaAlidadeSatellite = L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}", { minZoom: 0, maxZoom: 20, ext: "jpg"/*, attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/ });
const layers = { "Street": stadiaOSMBright, "Satellite": stadiaAlidadeSatellite }
const map = L.map("map").setView([state.latLng.lat, state.latLng.lng], 5);
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
            state.country.isoa2 = feature.properties.iso_a2;
            state.country.isoa3 = feature.properties.iso_a3;
            state.country.ison3 = feature.properties.iso_n3;
            state.country.name = feature.properties.name;
            state.latLng.lat = geolocation.coords.latitude;
            state.latLng.lng = geolocation.coords.longitude;
            map.setView([state.latLng.lat, state.latLng.lng]);
        }
    }
    catch(error)
    {
        throw(error);
    }
}

//ADD LAYER CONTROLS
function addLayerControls()
{
    state.graphics.airports = new L.MarkerClusterGroup().addTo(map);
    state.graphics.parks = new L.MarkerClusterGroup().addTo(map);
    layerControl.addOverlay((state.graphics.airports), "Airports");
    layerControl.addOverlay((state.graphics.parks), "Parks");
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
    $("#dropdown").val(`${state.country.isoa2},${state.country.isoa3},${state.country.ison3},${state.country.name}`);
    drawCountryBorder(false);
    drawClusterMarkers();
    updateFlag();
}

function resetGraphics()
{
    if (state.graphics.border !== null) { state.graphics.border.remove(); }
    state.graphics.airports.eachLayer((layer) => { state.graphics.airports.removeLayer(layer) });
    state.graphics.parks.eachLayer((layer) => { state.graphics.parks.removeLayer(layer) });
    $("#flag").attr("src", "assets/images/unknown.png");
}

//DRAW COUNTRY BORDER
function drawCountryBorder(fitBounds)
{
    for (let feature of geoJSON.features)
    {
        if (feature.properties.iso_a3 !== state.country.isoa3) { continue; }
        state.graphics.border = L.geoJSON(feature, { color: "black", dashArray: 5, fillOpacity: 0, weight: 3 }).addTo(map);
        if (fitBounds) { map.fitBounds(state.graphics.border.getBounds()); }
    }
}

//DRAW CLUSTER MARKERS
function drawClusterMarkers()
{ 
    Promise.all([
        $.ajax({ url: "php/geonames/getAirportsFromISOA2.php", type: "GET", dataType: "json", data: { isoa2: state.country.isoa2 } }),
        $.ajax({ url: "php/geonames/getParksFromISOA2.php", type: "GET", dataType: "json", data: { isoa2: state.country.isoa2 } }),
    ])
    .then(([geoNamesAirports, geoNamesParks]) =>
    {
        if (geoNamesAirports.data)
        {
            const airportIcon = L.icon.glyph({ className: 'blue-glyph', prefix: 'fa', glyph: 'plane-up', glyphSize: '14px', glyphAnchor: [0, 5] });
            for (let airport of geoNamesAirports.data) 
            {
                state.graphics.airports.addLayer(L.marker([airport['lat'], airport['lng']], { title: airport['name'], alt: airport['name'] + ' Marker', icon: airportIcon }).bindPopup(airport['name']));
            }
        }
        if (geoNamesParks.data)
        {
            const parkIcon = L.icon.glyph({ className: 'blue-glyph', prefix: 'fa', glyph: 'tree', glyphSize: '14px', glyphAnchor: [0, 5] });
            for (let park of geoNamesParks.data)
            {
                state.graphics.parks.addLayer(L.marker([park['lat'], park['lng']], { title: park['name'], alt: park['name'] + ' Marker', icon: parkIcon }).bindPopup(park['name']));
            }
        }
    });
}

//UPDATE FLAG
function updateFlag()
{
    $.ajax({ url: "php/restcountries/getFlagFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.country.isoa3 } }).then((restCountriesResult) => 
    {
        if (!restCountriesResult.data) { return; } 
        state.flag = restCountriesResult.data.flags.png;
        $("#flag").attr("src", state.flag);
    });
}

//ENABLE EASY BUTTONS
function enableEasyButtons()
{
    easyButtons.openNationalOverview.enable();
    easyButtons.openExchangeRate.enable();
    easyButtons.openTimeZoneConversion.enable();
    easyButtons.openLatestNews.enable();
    easyButtons.openWikipediaArticle.enable();
}

function disableEasyButtons()
{
    easyButtons.openNationalOverview.disable();
    easyButtons.openExchangeRate.disable();
    easyButtons.openTimeZoneConversion.disable();
    easyButtons.openLatestNews.disable();
    easyButtons.openWikipediaArticle.disable();
}

//ON DROPDOWN SELECT
function onDropdownSelect()
{
    [state.country.isoa2, state.country.isoa3, state.country.ison3, state.country.name] = $("#dropdown").val().split(',');
    resetGraphics()
    if (state.country.isoa3 === "--") 
    { 
        disableEasyButtons();
        return; 
    }
    enableEasyButtons();
    drawCountryBorder(true);
    drawClusterMarkers();
    updateFlag();
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
    state.latLng = newLatLng;
    $("#lat").val(roundToDecimalPlace(state.latLng.lat, 4));
    $("#lng").val(roundToDecimalPlace(state.latLng.lng, 4));
}

//ON LOCAL SELECT
function onLocalSelect(newLatLng)
{
    if (!state.allowLatLngUpdate) { return }
    updateLatLng(newLatLng);
    state.allowLatLngUpdate = false;
    map.panTo([newLatLng.lat, newLatLng.lng], { duration: 0.25 });
    setTimeout(async () => 
    { 
        if (newLatLng.lat < -90 || newLatLng.lat > 90) { return; }
        if (newLatLng.lng < -180 || newLatLng.lng > 180) { return; }
        await openLocalInformation(); 
        state.allowLatLngUpdate = true; 
    }, 270);
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
    const outputValue = roundToDecimalPlace($("#exchange-rate-input-text").val() / collatedInfo[inputCurrency].rate * collatedInfo[outputCurrency].rate, 2);
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
    const inputUTCOffset = digitalTimeToMinutes($("#time-zone-input-dropdown").val().slice(-6));
    const outputUTCOffset = digitalTimeToMinutes($("#time-zone-output-dropdown").val().slice(-6));
    const inputTime = digitalTimeToMinutes($("#time-zone-input-text").val().slice(-6));
    const offsetDifference = outputUTCOffset - inputUTCOffset;
    const newTime = offsetMinutes(inputTime, offsetDifference);
    const outputTime = minutesToDigitalTime(newTime); 
    $("#time-zone-output-text").val(outputTime);
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
    const weatherCounts = {}
    for (let forecast of forecasts)
    {
        if (!weatherCounts[forecast.weather[0].icon]) { weatherCounts[forecast.weather[0].icon] = 0; }
        weatherCounts[forecast.weather[0].icon]++;
    }
    let mostCommon = null;
    let count = 0;
    for (let key of Object.keys(weatherCounts))
    {
        if (weatherCounts[key] > count) 
        { 
            mostCommon = key; 
            count = weatherCounts[key];
        }
    }
    mostCommon = mostCommon.slice(0, 2);
    return `https://openweathermap.org/img/wn/${mostCommon}d@2x.png`;
}

//HIGHLIGHT BUTTON
function highlightButton(event) //TODO: work out CSS for button press
{
    $("#forecast-array").children().removeClass("forecast-selected"); 
    event.currentTarget.classList.add("forecast-selected");
}

//DRAW FORECAST CHART
function drawForecastGraph(forecasts)
{
    if (state.graphics.forecast !== null) { state.graphics.forecast.destroy(); }
    const startTime = forecasts[0].dt_txt.slice(-8, -3);
    const endTime = forecasts[forecasts.length - 1].dt_txt.slice(-8, -3);
    let times = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];
    times = times.slice(times.indexOf(startTime), times.indexOf(endTime) + 1);
    const temp = []; const wind = []; const rain = [];
    forecasts.forEach((forecast) =>
    {
        temp.push(forecast.main.temp);
        wind.push(forecast.wind.speed);
        rain.push(forecast.rain ? forecast.rain["3h"] : 0);
    })
    state.graphics.forecast = new Chart(
        document.getElementById("forecast-graph"),
        {
            type: "line",
            data: 
            {
                labels: times,
                datasets:
                [
                    {
                        label: "Temp (°C)",
                        data: temp,
                        borderColor: "rgb(236,110,76)",
                        backgroundColor: "rgb(236,110,76)",
                        tension: 0.25
                    },
                    {
                        label: "Wind (kph)",
                        data: wind,
                        borderColor: "rgb(211, 211, 211)",
                        backgroundColor: "rgb(211, 211, 211)",
                        tension: 0.25
                    },
                    {
                        label: "Rain (mm)",
                        data: rain,
                        borderColor: "rgb(173, 216, 230)",
                        backgroundColor: "rgb(173, 216, 230)",
                        tension: 0.25
                    }
                ]
            },
            options: 
            {
                responsive: true,
                plugins: 
                {
                    legend: 
                    {
                        position: 'top',
                    }
                }
            }
        }
    )
}

//GET COOKIE
function getCookie(name)
{
    let cookies = document.cookie.split("; ");
    cookies = cookies.map((pair) => pair.split('='));
    for (let pair of cookies)
    {
        if (pair[0] !== name) { continue; }
        return pair[1];
    }
    return '';
}

//SET COOKIE
function setCookie(name, value, days) 
{
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expiry = "expires="+ date.toUTCString();
    document.cookie = name + "=" + value + ";" + expiry + ";path=/";
}

//SAVE TO FAVOURITES
function saveToFavourites()
{
    const cookie = getCookie("Favourites");
    const favourites = cookie === '' ? {} : JSON.parse(cookie);
    const name = $("#favourite-input").val();
    if (favourites.hasOwnProperty(name))
    {
        alert("Name already taken. Please input another.");
        return;
    }
    favourites[name] = state.latLng;
    setCookie("Favourites", JSON.stringify(favourites), 365);
}

//DELETE FROM FAVOURITES
function deleteFromFavourites(name)
{
    $(".favourite").each(function()
    {
        if ($(this).find(".favourite-name").html() === name)
        {
            $(this).remove();
            return;
        }
    });
    const cookie = getCookie("Favourites");
    const favourites = JSON.parse(cookie);
    delete favourites[name];
    setCookie("Favourites", JSON.stringify(favourites), 365);
}

//SELECT FAVOURITE
function selectFavourite(lat, lng)
{
    $("#modal").modal("hide");
    setTimeout(() => { onLocalSelect({ lat: lat, lng: lng }) }, 300);
}

//GET LOCAL DETAILS
function getLocalDetails()
{
    $.ajax({ url: "php/opencage/getAddressAndISOA3FromLatLng.php", type: "GET", dataType: "json", data: { lat: state.latLng.lat, lng: state.latLng.lng } }).then((openCageResult) => 
    {  
        if (!openCageResult.data) { return; }
        if (openCageResult.data.address)
        {
            $("#address").html(openCageResult.data.address)
            $("#favourite-button").click(saveToFavourites);
        }
        if (openCageResult.data.isoa3)
        {
            $.ajax({ url: "php/restcountries/getFlagFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: openCageResult.data.isoa3 } }).then((restCountriesResult) => 
            {
                if (!restCountriesResult.data) { return; }
                if (restCountriesResult.data.flags)
                {
                    $("#flag").attr("src", restCountriesResult.data.flags.png);
                }
                else
                {
                    $("#flag").attr("src", "assets/images/pirate.png");
                }
            });
        }
        else
        {
            $("#flag").attr("src", "assets/images/pirate.png");
        }
    })
}

//OPEN NATIONAL OVERVIEW
async function openNationalOverview()
{
    $("#modal-title").html("National Overview");
    $("#modal-body-container").append(await $.get("html/body/national_overview.html"));
    $("#modal").modal("show");
    const restCountriesResult = await $.ajax({ url: "php/restcountries/getOverviewFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.country.isoa3 } });
    if (restCountriesResult.data)
    {
        $("#iso").html(`${state.country.isoa2} / ${state.country.isoa3} / ${state.country.ison3}`);
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
    else 
    {
        await showDisconnected();
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN EXCHANGE RATE
async function openExchangeRate()
{
    $("#modal-title").html("Exchange Rate");
    $("#modal-body-container").append(await $.get("html/body/exchange_rate.html"));
    $("#modal").modal("show");
    const [restCountriesCurrentCurrency, restCountriesAllCurrencies, openExchangeRatesResult] = await Promise.all([
        $.ajax({ url: "php/restcountries/getCurrencyFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.country.isoa3 } }),
        $.ajax({ url: "php/restcountries/getCurrencies.php", type: "GET", dataType: "json" }),
        $.ajax({ url: "php/openexchangerates/getExchangeRates.php", type: "GET", dataType: "json" })
    ]);
    if (restCountriesCurrentCurrency.data && restCountriesAllCurrencies.data && openExchangeRatesResult.data)
    {
        const collatedInfo = {}
        for (let result of restCountriesAllCurrencies.data)
        {
            for (let currency of Object.keys(result.currencies))
            {
                if (!openExchangeRatesResult.data.hasOwnProperty(currency)) { continue; }
                collatedInfo[currency] =
                {
                    code: currency,
                    name: result.currencies[currency].name,
                    rate: openExchangeRatesResult.data[currency],
                    symbol: result.currencies[currency].symbol
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
    else
    {
        await showDisconnected();
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN TIME ZONE CONVERSION
async function openTimeZoneConversion() //TODO: add tick box to keep sync with current time
{
    $("#modal-title").html("Time Zone Conversion");
    $("#modal-body-container").append(await $.get("html/body/time_zone_conversion.html"));
    $("#modal").modal("show");
    const [restCountriesCurrentTimeZone, restCountriesAllTimeZones] = await Promise.all([
        $.ajax({ url: "php/restcountries/getTimeZoneFromISOA3.php", type: "GET", dataType: "json", data: { isoa3: state.country.isoa3 } }),
        $.ajax({ url: "php/restcountries/getTimeZones.php", type: "GET", dataType: "json" })    
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
            $("#time-zone-input-dropdown").append(`<option value="${result}">${result}</option>`);
            $("#time-zone-output-dropdown").append(`<option value="${result}">${result}</option>`);
        }
        const current = restCountriesCurrentTimeZone.data.timezones[0];
        $("#time-zone-input-dropdown").val(current);
        $("#time-zone-output-dropdown").val(current);
        const offset = digitalTimeToMinutes(current.slice(-6));
        const newTime = offsetMinutes(Math.floor(Date.now() / 60000), offset);
        const newTimeFormatted = minutesToDigitalTime(newTime);
        $("#time-zone-input-text").val(newTimeFormatted);
        $("#time-zone-input-text").change(onTimeZoneChange);
        $("#time-zone-input-dropdown").change(onTimeZoneChange);
        $("#time-zone-output-dropdown").change(onTimeZoneChange);
        onTimeZoneChange();
    }
    else
    {
        await showDisconnected();
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LATEST NEWS
async function openLatestNews()
{
    $("#modal-title").html("Latest News");
    $("#modal").modal("show");
    const newsDataResult = await $.ajax({ url: "php/newsdata/getNewsFromISOA2.php", type: "GET", dataType: "json", data: { isoa2: state.country.isoa2 } });
    if (newsDataResult.data)
    {
        const html = $(await $.get("html/reusable/news.html"));
        for (let result of newsDataResult.data)
        {
            const newElement = $(html[0].outerHTML);
            if (result.image_url) { newElement.find(".news-image").attr("src", result.image_url); }
            newElement.find(".news-title").attr("href", result.link);
            newElement.find(".news-title").html(result.title);
            newElement.find(".news-categories").html(result.category.map(word => word.slice(0, 1).toUpperCase() + word.slice(1)).join(", "));
            $("#modal-body-container").append(newElement);
        }
    }
    else
    {
        await showDisconnected();
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN WIKIPEDIA ARTICLE
async function openWikipediaArticle()
{
    $("#modal-title").html("Wikipedia Article");
    $("#modal").modal("show");
    $("#modal-body-container").append(await $.get("html/body/wikipedia_article.html"));
    const geoNamesResult = await $.ajax({ url: "php/geonames/getWikipediaFromCountryName.php", type: "GET", dataType: "json", data: { name: state.country.name.replace(' ', "%20") } });
    if (geoNamesResult.data)
    {
        $("#wikipedia-article-title").html(geoNamesResult.data.title);
        $("#wikipedia-article-summary").html(geoNamesResult.data.summary);
        $("#wikipedia-article-link").attr("href", "https://" + geoNamesResult.data.wikipediaURL);
    }
    else
    {
        await showDisconnected();
    }
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LOCAL FAVOURITES
async function openLocalFavourites() //TODO: populate with cookies
{
    $("#flag").css("display", "none");
    $("#modal-title").html("Local Favourites");
    const cookie = getCookie("Favourites");
    if (cookie !== '')
    {
        const html = $(await $.get("html/reusable/favourite.html"));
        const favourites = JSON.parse(cookie);
        for (let key of Object.keys(favourites))
        {
            const newElement = $(html[0].outerHTML);
            newElement.find(".favourite-name").html(key);
            newElement.find(".favourite-latlng").html(`${roundToDecimalPlace(Number(favourites[key].lat), 4)}, ${roundToDecimalPlace(Number(favourites[key].lng), 4)}`);
            newElement.find(".favourite-select").click(() => { selectFavourite(Number(favourites[key].lat), Number(favourites[key].lng)) });
            newElement.find(".favourite-delete").click(() => { deleteFromFavourites(key); });
            $("#modal-body-container").append(newElement);
        }
    }
    $("#modal").modal("show");
    $("#pre-load-modal").addClass("fade-out");
}

//OPEN LOCAL INFORMATION
async function openLocalInformation()
{
    $("#flag").attr("src", "assets/images/unknown.png");
    getLocalDetails();
    $("#modal-title").html("Local Information");
    $("#modal-body-container").append(await $.get("html/body/local_information.html"));
    $("#modal-footer-container").append(await $.get("html/footer/local_information.html"));
    $("#modal").modal("show");
    const [openWeatherResult, geoNamesResult] = await Promise.all([
        $.ajax({ url: "php/openweather/getForecastFromLatLng.php", type: "GET", dataType: "json", data: { lat: state.latLng.lat, lng: state.latLng.lng } }),
        $.ajax({ url: "php/geonames/getLandmarksFromLatLng.php", type: "GET", dataType: "json", data: { lat: state.latLng.lat, lng: state.latLng.lng } })
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
        const html = $(await $.get("html/reusable/forecast.html"));
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let forecast of collatedInfo)
        {
            const newElement = $(html[0].outerHTML);
            const date = new Date(forecast[0].dt_txt.slice(0, 10));
            newElement.find(".forecast-title").html(dayNames[date.getDay()]);
            newElement.find(".forecast-image").attr("src", findMostCommonWeather(forecast));
            newElement.find(".forecast-max-temp").html(roundToDecimalPlace(findMaxTemp(forecast), 0) + "°");
            newElement.find(".forecast-min-temp").html(roundToDecimalPlace(findMinTemp(forecast), 0) + "°");
            newElement.click((event) => 
            {
                highlightButton(event); 
                drawForecastGraph(forecast); 
            })
            $("#forecast-array").append(newElement);
        }
        $("#forecast-array").children()[0].classList.add("forecast-selected"); 
        drawForecastGraph(collatedInfo[0]);
    }
    if (geoNamesResult.data)
    {
        const html = $(await $.get("html/reusable/landmark.html"));
        for (let landmark of geoNamesResult.data) 
        {
            const newElement = $(html[0].outerHTML);
            newElement.find(".landmark-title").html(landmark.title);
            newElement.find(".landmark-summary").html(landmark.summary);
            newElement.find(".landmark-link").attr("href", "https://" + landmark.wikipediaURL);
            $("#landmarks").append(newElement);
        }
    }
    $("#pre-load-modal").addClass("fade-out");
}

//SHOW DISCONNECTED
async function showDisconnected()
{
    $("#modal-body-container").empty();
    $("#modal-body-container").append(await $.get("html/reusable/disconnected.html"));
}

//CLOSE MODAL
function closeModal()
{
    $("#flag").css("display", "inline");
    $("#flag").attr("src", state.flag);
    $("#modal-title").html("");
    $("#modal-body-container").empty();
    $("#modal-footer-container").empty();
    $("#pre-load-modal").removeClass("fade-out");
}

//CREATE EASY BUTTONS
const easyButtons = { openNationalOverview: null, openExchangeRate: null, openTimeZoneConversion: null, openLatestNews: null, openWikipediaArticle: null, openLocalFavourites: null }
function createEasyButtons()
{
    easyButtons.openNationalOverview = L.easyButton("fa-solid fa-globe", openNationalOverview).addTo(map);
    easyButtons.openExchangeRate = L.easyButton("fa-solid fa-money-bill-transfer", openExchangeRate).addTo(map);
    easyButtons.openTimeZoneConversion = L.easyButton("fa-solid fa-clock-rotate-left", openTimeZoneConversion).addTo(map);
    easyButtons.openLatestNews = L.easyButton("fa-solid fa-newspaper", openLatestNews).addTo(map);
    easyButtons.openWikipediaArticle = L.easyButton("fa-brands fa-wikipedia-w", openWikipediaArticle).addTo(map);
    easyButtons.openLocalFavourites = L.easyButton("fa-solid fa-heart", openLocalFavourites).addTo(map);
}

//DOCUMENT READY
$(document).ready(async () => 
{
    await getGeoJSON();
    await getCurrentCountry();
    addLayerControls();
    populateDropdown(); 
    $("#dropdown").change(onDropdownSelect);
    updateLatLng(state.latLng);
    map.on("click", (event) => { onLocalSelect(event.latlng); } );
    map.on("move", onMoveMap);
    $("#search").click(onLatLngSearch);
    createEasyButtons();
    $("#modal").on("hidden.bs.modal", closeModal);
    $("#pre-load-page").addClass("fade-out");
});