$(document).ready(() => {

    //Leaflet map 
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {maxZoom: 19/*, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'*/});
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom: 19/*, attribution:"Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"*/});
    const baseMaps = {'Streets': streets, 'Satellite': satellite};
    const map = L.map('map').setView([34.52, 69.18], 5);
    const layerControl = L.control.layers(baseMaps).addTo(map);
    streets.addTo(map);
    map.on('click', function(e) {localSelect(e, true);});

    //easy buttons
    const easyButtons = {
        '#national-modal': 'fa-solid fa-globe',
        '#economic-modal': 'fa-solid fa-sack-dollar',
        '#news-modal': 'fa-solid fa-newspaper',
        '#timezone-modal': 'fa-solid fa-clock',
        '#weather-modal': 'fa-solid fa-cloud',
        '#wikipedia-modal': 'fa-brands fa-wikipedia-w'
    };
    let currentModal = '';
    for (let [key, value] of Object.entries(easyButtons)) {
        L.easyButton(value, function() {
            currentModal = key;
            $(currentModal).modal('show');
        }).addTo(map);
    }
    L.easyButton(`<img src="img/goldstar.png" class="easy-button">`, function() {
        currentModal = '#favourites-modal';
        $(currentModal).modal('show');
    }).addTo(map);

    //populate dropdown bar
    let currentCountryCode = ['AF', 'AFG'];
    const populateDropdown = async () => {
        const result = await $.ajax({url: 'libs/php/populateDropdown.php', type: 'GET', dataType: 'json'});
        const results = [];
        for (let i of result) {
            const newElement = `<option value="${i[0]},${i[1]}">${i[2]}</option>`;
            results.push(newElement);
        }
        results.sort(function (a, b) {
            if (a.slice(23, -1).replace('>', '') < b.slice(23, -1).replace('>', '')) {
              return -1;
            }
            if (a.slice(23, -1).replace('>', '') > b.slice(23, -1).replace('>', '')) {
              return 1;
            }
            return 0;
          });
        for (let i of results) {
            $('#dropdown-bar').append(i);
        }
    }
    populateDropdown()
    
    //get current position in coordinates afterwards
    .then(async () => {
        if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            }).then(
                (resolve) => {return resolve},
                (reject) => {return null}
            )
            return position;
        } else {
            return null;
        }
    })

    //get region from coordinates afterwards
    .then(async (position) => {
        if (position !== null) {
            await $.ajax({url: 'libs/php/getRegionFromOpenCage.php', type: 'GET', dataType: 'json', data: {lat: position.coords.latitude, lng: position.coords.longitude}}).then(
                (result) => {
                    if (result['status']['name'] === 'success' && result['data'] !== 'ocean') {
                        currentCountryCode = result['data'];
                    }
                },
                (reject) => {
                    console.log('YOU SHOULD NOT BE SEEING THIS');
                }
            )
        }
    })

    //initiate first dropDownBarChange call afterwards
    .then(() => {
        $('#dropdown-bar').val(`${currentCountryCode[0]},${currentCountryCode[1]}`);
        dropDownBarChange(false);
    });

    //dropdown bar change functionality
    const capitalIcon = L.icon.glyph({
        className: 'green-glyph',
        prefix: 'fa',
        glyph: 'institution',
        glyphSize: '14px',
        glyphAnchor: [0, 5]
    })
    const airportIcon = L.icon.glyph({
        className: 'green-glyph',
        prefix: 'fa',
        glyph: 'plane-up',
        glyphSize: '14px',
        glyphAnchor: [0, 5]
    })
    const parkIcon = L.icon.glyph({
        className: 'green-glyph',
        prefix: 'fa',
        glyph: 'tree',
        glyphSize: '14px',
        glyphAnchor: [0, 5]
    })
    let capitalMarkers = new L.LayerGroup().addTo(map);
    let airportMarkers = new L.MarkerClusterGroup().addTo(map);
    let parkMarkers = new L.MarkerClusterGroup().addTo(map);
    layerControl.addOverlay((capitalMarkers), "Capitals");
    layerControl.addOverlay((airportMarkers), "Airports");
    layerControl.addOverlay((parkMarkers), "Parks");
    let currentCountryBorder = null;
    const dropDownBarChange = async (panBool) => {
        currentCountryCode = $('#dropdown-bar').val().split(',');
        capitalMarkers.eachLayer(function (layer) {
            capitalMarkers.removeLayer(layer);
        });
        airportMarkers.eachLayer(function (layer) {
            airportMarkers.removeLayer(layer);
        });
        parkMarkers.eachLayer(function (layer) {
            parkMarkers.removeLayer(layer);
        });
        $('#capital-forecast').html('Capital Forecast');
        $('.weather-button').css("background-color", "transparent");
        $('.weather-image').attr('src', '');
        $('.weekday-date').html('');
        $('.max-temp').html('');
        $('.min-temp').html('');
        $('#weather-table-body').empty();
        $.ajax({url: 'libs/php/getParksFromGeonames.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[0]}}).then(
            (result) => {
                for (let park of result['data']) {
                    parkMarkers.addLayer(L.marker([park['lat'], park['lng']], {title: park['name'], alt: park['name'] + ' Marker', icon: parkIcon}).bindPopup(park['name']));
                }
            },
            (reject) => {
                
            }
        );
        $.ajax({url: 'libs/php/getAirportsFromGeonames.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[0]}}).then(
            (result) => {
                for (let airport of result['data']) {
                    airportMarkers.addLayer(L.marker([airport['lat'], airport['lng']], {title: airport['name'], alt: airport['name'] + ' Marker', icon: airportIcon}).bindPopup(airport['name']));
                }
            },
            (reject) => {

            }
        );
        $.ajax({url: 'libs/php/getFlagCapitalFromRESTCountries.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[1]}}).then(
            (result) => {
                if (result['status']['name'] === 'success') {
                    $('.flag').attr('src', result['data']['flags']);
                    capitalMarkers.addLayer(L.marker(result['data']["capital_info"]["latlng"], {title: result['data']["capital"], alt: result['data']["capital"] + ' Marker', icon: capitalIcon}).bindPopup(result['data']["capital"]));
                    $('#capital-forecast').html(result['data']["capital"] + ' Forecast')
                    $.ajax({url: 'libs/php/getWeatherFromWeatherAPI.php', type: 'GET', dataType: 'json', data: {lat: result['data']["capital_info"]["latlng"][0], lng: result['data']["capital_info"]["latlng"][1]}}).then(
                        (result) => {
                            if (result['status']['name'] === 'success') {
                                const weekdays = ['.first-day', '.second-day', '.third-day', '.fourth-day', '.fifth-day'];
                                const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                                let dayIndex = -1;
                                let currentDate = '';
                                let maxTemperatures = [];
                                let minTemperatures = [];
                                let weatherIcons = [];
                                const updateTempAndWeather = () => {
                                    const mostCommonWeather = findMostCommonWeather(weatherIcons).replace('n', 'd');
                                    $('.weather-image' + weekdays[dayIndex]).attr('src', `https://openweathermap.org/img/wn/${mostCommonWeather}@2x.png`);
                                    weatherIcons = [];
                                    const maxTempResult = Math.round((maxTemperatures.reduce((partialSum, a) => partialSum + a, 0)/maxTemperatures.length));
                                    $('.max-temp' + weekdays[dayIndex]).html(maxTempResult + '°C');
                                    maxTemperatures = [];
                                    const minTempResult = Math.round((minTemperatures.reduce((partialSum, a) => partialSum + a, 0)/minTemperatures.length));
                                    $('.min-temp' + weekdays[dayIndex]).html(minTempResult + '°C');
                                    minTemperatures = [];
                                }
                                for (let i of result['data']) {
                                    const newDate = i['dt_txt'].slice(0, 10);
                                    if (newDate !== currentDate && dayIndex < 4) {
                                        if (maxTemperatures.length > 0) {
                                            updateTempAndWeather();
                                        }
                                        currentDate = newDate;
                                        dayIndex += 1;
                                        let dateResult = i['dt_txt'].slice(8, 10);
                                        if (dateResult[0] === '0') {
                                            dateResult = dateResult.slice(1);
                                        }
                                        dateResult === '1' ? dateResult ='1st' :
                                        dateResult === '2' ? dateResult = '2nd' :
                                        dateResult === '3' ? dateResult = '3rd' :
                                        dateResult += 'th';
                                        const d = new Date(i['dt_txt']);
                                        const day = d.getDay();
                                        dateResult = weekdayNames[day] + ' ' + dateResult;
                                        $('.weekday-date' + weekdays[dayIndex]).html(`<b>${dateResult}</b>`);
                                        const _selector = $(weekdays[dayIndex] + '.weather-button');
                                        $(_selector).on('click', (e) => {
                                            $('.weather-button').css("background-color", "transparent");
                                            $(_selector).css("background-color", "lightgrey");
                                            fillWeatherTable(newDate, result['data']);
                                        });
                                        if (dayIndex === 0) {
                                            $('.first-day.weather-button').css("background-color", "lightgrey");
                                            fillWeatherTable(currentDate, result['data']);
                                        }
                                    }
                                    maxTemperatures.push(i['main']['temp_max']);
                                    minTemperatures.push(i['main']['temp_min']);
                                    weatherIcons.push(i['weather'][0]['icon']);
                                    if (dayIndex === 4) {
                                        updateTempAndWeather();
                                    }
                                }
                            } else {
                                
                            }
                        },
                        (reject) => {
                            
                        }
                    )
                }
            },
            (reject) => {
                $('.flag').attr('src', 'img/questionflag.png');
            }
        );
        await $.ajax({url: 'libs/php/getCountryBorder.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[1]}}).then(
            (result) => {
                if (currentCountryBorder !== null) {
                    map.removeLayer(currentCountryBorder);
                }
                currentCountryBorder = L.geoJSON(result, {style: {fillOpacity: 0, color: 'black', dashArray: 4, opacity: 0.75, weight: 5}});
                currentCountryBorder.addTo(map);
                const bounds = currentCountryBorder.getBounds();
                panBool === true ? map.fitBounds(bounds) : map.fitBounds(bounds, {duration: 0});
                const dataOptions = currentCountryCode[1] === 'RUS' ?
                {countryCode: currentCountryCode[1], north: 90, east: 180, south: -90, west: -180} :
                {countryCode: currentCountryCode[1], north: bounds['_northEast']['lat'], east: bounds['_northEast']['lng'], south: bounds['_southWest']['lat'], west: bounds['_southWest']['lng']}
            },
            (reject) => {

            }
        ).then(() => {
            $('#pre-load-page').addClass('fadeOut');
        });
    }
    $('#dropdown-bar').change(() => {dropDownBarChange(true);});

    //favourites from cookies
    const starIcon = L.icon({iconUrl: 'img/goldstar.png', iconSize: [30,30]})
    const starList = [];
    let favouriteNamesList = [];
    const getFavouritesIndex = (cookie) => {
        let favouritesStartIndex = cookie.search("favourites");
        let favouritesEndIndex = cookie.length;
        for (i=favouritesStartIndex; i < cookie.length; i++) {
            cookie[i] === ';' ? favouritesEndIndex = i : null;
        }
        return [favouritesStartIndex, favouritesEndIndex];
    }
    let favouritesIndexes = getFavouritesIndex(document.cookie);
    let favouritesFromCookies = document.cookie.slice(favouritesIndexes[0]+11, favouritesIndexes[1]).split(', ');
    let stage = 0; let favName = ""; let favLat = ""; let favLng = "";
    for (let fav of favouritesFromCookies) {
        if (stage === 0) {
            favName = fav
        } else if (stage===1) {
            favLat = fav
        } else if (stage===2) {
            favLng = fav;
            const newElement = `<button class="text-start favourite-element" value="${favLat}, ${favLng}"><img class="goldstar" src="img/goldstar.png"> ${favName}</button></li>`;
            $('#favourites-list').append(newElement);
            favouriteNamesList.push(favName);
            starMarker = new L.marker([favLat, favLng], {icon: starIcon});
            starList.push(starMarker);
            starList[starList.length-1].addTo(map);
        }
        stage !== 2 ? stage ++ : stage = 0;
    }

    //favourite element interaction
    $('.favourite-element').on('click', function(e) {
        const latLng = e.target.value.split(', ');
        $(currentModal).modal('hide');
        localSelect({latlng: {lat: latLng[0], lng: latLng[1]}});
    });

    //clear favourites
    $('#clear-favourites').on('click', () => {
        document.cookie = "favourites=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        $('.favourite-element').remove();
        favouriteNamesList = [];
        for (let i of starList) {
            map.removeLayer(i);
        }
    });

    //favourite name
    $('#favourite-name').on('input', () => {
        $('#invalid-name').html("");
    })

    //close modal
    $('.close-modal').on('click', () => {
        $(currentModal).modal('hide');
    });

    //national information modal
    $('#national-modal').on('show.bs.modal', () => {
        const promises = [];
        promises.push(
            $.ajax({url: 'libs/php/getNationalFromRESTCountries.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[1]}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        $('#area').html(result['data']['area'].toLocaleString("en-US") + 'km&sup2');
                        $('#capital').html(result['data']['capital']);
                        $('#continent').html(result["data"]["continents"]);
                        const interstatusResult = result['data']['independent'] ? 'Independent' : 'Non-Independent';
                        const unMemberResult = result['data']['unMember'] ? 'UN Member' : 'Non-UN Member';
                        $('#interstatus').html(interstatusResult + ', ' + unMemberResult);
                        $('#iso2').html(result['data']['cca2']);
                        $('#iso3').html(result['data']['cca3']);
                        let languagesResult = "";
                        for (let i of Object.values(result["data"]["languages"])) {
                            languagesResult += i + ', ';
                        }
                        $('#languages').html(languagesResult.slice(0, -2));
                        $('#population').html(result['data']['population'].toLocaleString("en-US"));
                        $('#roads').html('Drives on ' + result['data']['car']['side']);
                    } else {
                        $('.modal-info').html('N/A');
                    }
                },
                (reject) => {
                    $('.modal-info').html('N/A');
                }
            )
        )    
        Promise.all(promises).then(() => {
            $('#pre-load-national').addClass("fadeOut");
        });
    });
    $('#national-modal').on('hide.bs.modal', () => {
        $('.modal-info').html('N/A');
        $('#pre-load-national').removeClass("fadeOut");
    });

    //economic information modal
    $('#economic-modal').on('show.bs.modal', () => {
        const promises = [];
        promises.push(
            $.ajax({url: 'libs/php/getCurrenciesFromRESTCountries.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[1]}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        let currencyCode = '';
                        let currencyName = '';
                        for ([key, value] of Object.entries(result['data']['currencies'])) {
                            currencyCode = key;
                            currencyName = value['name'];
                            currencySymbol = value['symbol'];
                            break;
                        }
                        $('#currency').html(currencyName);
                        $.ajax({url: 'libs/php/getRateFromOpenExchange.php', type: 'GET', dataType: 'json', data: {currencyCode: currencyCode}}).then(
                            (result) => {
                                exchangeBaseline = result['data'];
                                $('#exchange-output').html(currencySymbol + (Math.round($('#exchange-input').val()*exchangeBaseline*100)/100).toString());
                            },
                            (reject) => {
                                $('#exchange').html('N/A');
                            }
                        )
                    } else {
                        $('.modal-info').html('N/A');
                    }
                },
                (reject) => {
                    $('#currency').html('N/A');
                }
            ), $.ajax({url: 'libs/php/getGNIFromDBNomics.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[1]}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        $('#gni').html('$' + (Math.round((result['data']/1000000000)*100)/100).toLocaleString("en-US") + ' bil');
                    } else {
                        $('#gni').html('N/A');
                    }
                },
                (reject) => {
                    $('#gni').html('N/A');
                }
            ), $.ajax({url: 'libs/php/getGDPFromDBNomics.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[1]}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        $('#gdp').html('$' + (Math.round(result['data']*100)/100).toLocaleString("en-US"));
                    } else {
                        $('#gdp').html('N/A');
                    }
                },
                (reject) => {
                    $('#gdp').html('N/A');
                }
            ), 
        )    
        Promise.all(promises).then(() => {
            $('#pre-load-economic').addClass("fadeOut");
        });
    });
    $('#economic-modal').on('hide.bs.modal', () => {
        $('.modal-info').html('N/A');
        $('#pre-load-economic').removeClass("fadeOut");
    });

    //latest news modal
    $('#news-modal').on('show.bs.modal', () => {
        const promises = [];
        promises.push(
            $.ajax({url: 'libs/php/getFromNewsData.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[0]}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        for (let article of result["data"]) {
                            let category = '';
                            article['category'].forEach(element => {
                                category += element[0].toUpperCase() + element.slice(1) + ', '
                            });
                            category = category.slice(0, -2);
                            const newsArticle = 
                            `<div class="container-fluid news-article">
                                <div class="row border-bottom p-2">
                                    <div class="d-flex justify-content-center align-items-center col">
                                        ${article['image_url'] !== null ? '<img class="img-fluid" src=' + article['image_url'] + '>' : '<h5 class="text-danger">No preview available</h5>'}
                                    </div>
                                    <div class="d-flex flex-column col">
                                        <div class="d-flex align-items-start">
                                            <a class="text-dark" target="_blank" href=${article['link']}><h6><b>${article['title']}</b></h6></a>
                                        </div>
                                        <div class="d-flex align-items-end flex-grow-1">
                                            <h6 class="text-muted">${category}</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                            $('#news-container').append(newsArticle);
                        }
                    } else {
                        $('#news-container').append('<div class="d-flex align-items-center justify-content-center news-article" style="height:200px"><h5 class="text-danger">No news available</h5></div>');
                    }
                },
                (reject) => {
                    $('#news-container').append('<div class="d-flex align-items-center justify-content-center news-article" style="height:200px"><h5 class="text-danger">Connection error</h5></div>');
                }
            )
        )    
        Promise.all(promises).then(() => {
            $('#pre-load-news').addClass("fadeOut");
        });
    });
    $('#news-modal').on('hide.bs.modal', () => {
        $('#pre-load-news').removeClass("fadeOut");
        $('.news-article').remove();
    });

    //timezone information modal
    $('#timezone-modal').on('show.bs.modal', () => {
        const promises = [];
        promises.push(
            $.ajax({url: 'libs/php/getTimezonesFromRESTCountries.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[1]}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        for (let timezone of result['data']['timezones']) {
                            let formattedDate = 'N/A';
                            if (timezone.length > 3) {
                                const utcOffsetString = timezone.replace(/[^0-9\+\-]/g, '');
                                const hours = parseInt(utcOffsetString.slice(0, 3), 10);
                                const minutes = parseInt(utcOffsetString.slice(3), 10);
                                const totalOffset = hours * 60 + minutes;
                                const currentTimeUTC = new Date();
                                const adjustedTime = new Date(currentTimeUTC.getTime() + (totalOffset * 60 * 1000));
                                formattedDate = adjustedTime.toLocaleString('en-GB');
                            } else {
                                const currentTimeUTC = new Date();
                                const adjustedTime = new Date(currentTimeUTC.getTime());
                                formattedDate = adjustedTime.toLocaleString('en-GB');
                            }
                            const timezoneEntry = 
                            `<tr class="timezone-entry">
                                <td><b>${timezone}</b></td>
                                <td class="text-end">${formattedDate}</td>
                            </tr>`;
                            $('#timezone-table').append(timezoneEntry);
                        }
                    } else {
                        const timezoneEntry = 
                        `<tr class="timezone-entry">
                            <td class="text-danger"><b>No timezones found</b></td>
                            <td class="text-end">N/A</td>
                        </tr>`;
                        $('#timezone-table').append(timezoneEntry);
                    }
                },
                (reject) => {
                    const timezoneEntry = 
                    `<tr class="timezone-entry">
                        <td class="text-danger"><b>Connection error</b></td>
                        <td class="text-end">N/A</td>
                    </tr>`;
                    $('#timezone-table').append(timezoneEntry);
                }
            )
        )    
        Promise.all(promises).then(() => {
            $('#pre-load-timezone').addClass("fadeOut");
        });
    });
    $('#timezone-modal').on('hide.bs.modal', () => {
        $('#pre-load-timezone').removeClass("fadeOut");
        $('.timezone-entry').remove();
    });

    //wikipedia article modal
    $('#wikipedia-modal').on('show.bs.modal', () => {
        const promises = [];
        promises.push(
            $.ajax({url: 'libs/php/getWikiNameFromRESTCountries.php', type: 'GET', dataType: 'json', data: {countryCode: currentCountryCode[1]}}).then(
                async (result) => {
                    if (result['status']['name'] === 'success') {
                        await $.ajax({url: 'libs/php/getWikiFromGeonames.php', type: 'GET', dataType: 'json', data: {countryName: result['data'].replace(' ', '%20')}}).then(
                            (result) => {
                                if (result['status']['name'] === 'success') {
                                    $('#wiki-title').html(`<b>${result['data']['title']}</b>`);
                                    $('#wiki-desc').html(result['data']['summary']);
                                    $('#wiki-link').html('Find out more ...');
                                    $('#wiki-link').attr('href', 'https://' + result['data']['wikipediaUrl']);
                                } else {
                                    $('#wiki-title').html('<span class="text-danger">No Wikipedia article found</span>');
                                    $('#wiki-desc').html('N/A');
                                    $('#wiki-link').html('N/A');
                                    $('#wiki-link').attr('href', '');
                                }
                            }, 
                            (reject) => {
                                $('#wiki-title').html('<span class="text-danger">Connection error</span>');
                                $('#wiki-desc').html('N/A');
                                $('#wiki-link').html('N/A');
                                $('#wiki-link').attr('href', '');
                            }
                        )
                    } else {
                        $('#wiki-title').html('<span class="text-danger">No Wikipedia article found</span>');
                        $('#wiki-desc').html('N/A');
                        $('#wiki-link').html('N/A');
                        $('#wiki-link').attr('href', '');
                    }
                }, 
                (reject) => {
                    $('#wiki-title').html('<span class="text-danger">Connection error</span>');
                    $('#wiki-desc').html('N/A');
                    $('#wiki-link').html('N/A');
                    $('#wiki-link').attr('href', '');
                }
            )
        )    
        Promise.all(promises).then(() => {
            $('#pre-load-wikipedia').addClass("fadeOut");
        });
    });
    $('#wikipedia-modal').on('hide.bs.modal', () => {
        $('#pre-load-wikipedia').removeClass("fadeOut");
        $('#wiki-title').html('<i>loading</i>');
        $('#wiki-desc').html('<i>loading</i>');
        $('#wiki-link').html('<i>loading</i>');
        $('#wiki-link').attr('href', '');
    });

    //local select
    const localSelect = (e) => {
        map.panTo([e.latlng.lat, e.latlng.lng], {duration: 0.25});
        currentModal = '#local-modal';
        $('#local-flag').attr('src', 'img/questionflag.png');
        setTimeout(() => {$('#local-modal').modal("show");}, 250);
        $('#coordinates').html((Math.round(e.latlng.lat*100000)/100000).toString() + ', ' + (Math.round(e.latlng.lng*100000)/100000).toString());
        $('#favourite-button').on('click', () => {
            if (favouriteNamesList.includes($('#favourite-name').val())) {
                $('#invalid-name').html("*name already taken");
            } else if ($('#favourite-name').val() === "") {
                $('#invalid-name').html("*name field empty");
            } else {
                const newElement = `<button class="text-start favourite-element" value="${e.latlng.lat}, ${e.latlng.lng}"><img class="goldstar" src="img/goldstar.png"> ${$('#favourite-name').val()}</button>`;
                let favouritesIndexes = getFavouritesIndex(document.cookie);
                let favouritesFromCookies = document.cookie.slice(favouritesIndexes[0]+11, favouritesIndexes[1])
                favouritesFromCookies.length > 0 ? favouritesFromCookies += ',' : favouritesFromCookies;
                const d = new Date();
                d.setTime(d.getTime() + (100 * 24 * 60 * 60 * 1000));
                document.cookie = `favourites=${favouritesFromCookies} ${$('#favourite-name').val()}, ${e.latlng.lat}, ${e.latlng.lng};expires=${d.toUTCString()}`;
                starMarker = new L.marker([e.latlng.lat, e.latlng.lng], {icon: starIcon});
                starList.push(starMarker);
                starList[starList.length-1].addTo(map);
                $('#favourites-list').append(newElement);
                $('.favourite-element').unbind();
                $('.favourite-element').on('click', function(e) {
                    const latLng = e.target.value.split(', ');
                    $(currentModal).modal('hide');
                    localSelect({latlng: {lat: latLng[0], lng: latLng[1]}}, true);
                });
                favouriteNamesList.push($('#favourite-name').val());
            }
        });
        const promises = [];
        promises.push(
            $.ajax({url: 'libs/php/getRegionFromOpenCage.php', type: 'GET', dataType: 'json', data: {lat: e.latlng.lat, lng: e.latlng.lng}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        if (result['data'] === 'ocean') {
                            $('#local-flag').attr('src', 'img/sea.png');
                        } else {
                            $.ajax({url: 'libs/php/getFlagCapitalFromRESTCountries.php', type: 'GET', dataType: 'json', data: {countryCode: result['data'][1]}}).then(
                                (result) => {
                                    if (result['status']['name'] === 'success') {
                                        $('#local-flag').attr('src', result['data']['flags']);
                                    }
                                }
                            )
                        }
                    } else {
                        $('#local-flag').attr('src', 'img/questionflag.png');
                    }
                },
                (reject) => {
                    $('#local-flag').attr('src', 'img/questionflag.png');;
                }
            ), $.ajax({url: 'libs/php/getAddressFromOpenCage.php', type: 'GET', dataType: 'json', data: {lat: e.latlng.lat, lng: e.latlng.lng}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        $('#address').html(result['data']);
                    } else {
                        $('#address').html('N/A');
                    }
                },
                (reject) => {
                    $('#address').html('<i>Connection error</i>');
                }
            ), $.ajax({url: 'libs/php/getLocalWikiFromGeonames.php', type: 'GET', dataType: 'json', data: {lat: e.latlng.lat, lng: e.latlng.lng}}).then(
                (result) => {
                    if (result['status']['name'] === 'success') {
                        for (let i of result['data']) {
                            $('#local-wikipedia-links').append(`<a href="https://${i["wikipediaURL"]}" target="_blank">${i["title"]}</a><br>`)
                        }
                    } else {
                        $('#local-wikipedia-links').append('<div class="d-flex align-items-center justify-content-center news-article" style="height:200px"><h5 class="text-danger">No nearby features found</h5></div>')
                    }
                },
                (reject) => {
                    $('#local-wikipedia-links').append('<div class="d-flex align-items-center justify-content-center news-article" style="height:200px"><h5 class="text-danger">Connection error</h5></div>')
                }
            )
        )    
        Promise.all(promises).then(() => {
            $('#pre-load-local').addClass("fadeOut");
        });
    }
    $('#local-modal').on('hide.bs.modal', () => {
        $('#address').html('<i>loading</i>');
        $('#favourite-name').val('');
        $('#invalid-name').html("");
        $('#local-wikipedia-links').empty();
        $('#pre-load-local').removeClass("fadeOut");
        $('#favourite-button').unbind();
    });

    //dollar exchange functionality
	let exchangeBaseline = 1;
    let currencySymbol = '$';
	$('#exchange-input').val('1.00');
	$('#exchange-input').on('input', () => {
		$('#exchange-output').html(currencySymbol + (Math.round($('#exchange-input').val()*exchangeBaseline*100)/100).toString());
	});

    //weather forecast button functionality
    const fillWeatherTable = (dateResult, result) => {
        $('#weather-table-body').empty();
        const times = ["n/a", "00:00:00", "03:00:00", "06:00:00", "09:00:00", "12:00:00", "15:00:00", "18:00:00", "21:00:00"];
        const weatherAttributes = ["Weather Overview:", "Temperature:", "Max Temp:", "Min Temp:", "Cloudiness:", "Humidity:", "Rain/1hr:", "Rain/3hr:", "Snow/1hr:", "Snow/3hr:", "Visibility:", "Wind Direction:", "Wind Gust:", "Wind Speed:"];
        for (let weatherAttribute of weatherAttributes) {
            let newElement = '';
            newElement += '<tr>';
            for (let time of times) {
                if (time === 'n/a') {
                    newElement += `<th class="weather-attribute text-end" scope="row">${weatherAttribute}</th>`;
                } else {
                    let toAddElement = `<td class="weather-attribute">N/A</td>`;
                    for (let i of result) {
                        if (dateResult === i["dt_txt"].slice(0, 10) && time === i["dt_txt"].slice(11)) {
                            switch (weatherAttribute) {
                                case "Weather Overview:":
                                    toAddElement = `<td class="weather-attribute">${i["weather"][0]["description"]}</td>`;
                                    break;
                                case "Temperature:":
                                    toAddElement = `<td class="weather-attribute">${Math.round(i["main"]["temp"])}°C</td>`;
                                    break;
                                case "Max Temp:":
                                    toAddElement = `<td class="weather-attribute">${Math.round(i["main"]["temp_max"])}°C</td>`;
                                    break;
                                case "Min Temp:":
                                    toAddElement = `<td class="weather-attribute">${Math.round(i["main"]["temp_min"])}°C</td>`;
                                    break;
                                case "Cloudiness:":
                                    toAddElement = `<td class="weather-attribute">${i["clouds"]["all"]}%</td>`;
                                    break;
                                case "Humidity:":
                                    toAddElement = `<td class="weather-attribute">${i["main"]["humidity"]}%</td>`;
                                    break;
                                case "Rain/1hr:":
                                    try {i["rain"]["1h"] ? toAddElement = `<td class="weather-attribute">${i["rain"]["1h"]}mm</td>` : null} catch {null};
                                    break;
                                case "Rain/3hr:":
                                    try {i["rain"]["3h"] ? toAddElement = `<td class="weather-attribute">${i["rain"]["3h"]}mm</td>` : null} catch {null};
                                    break;
                                case "Snow/1hr:":
                                    try {i["snow"]["1h"] ? toAddElement = `<td class="weather-attribute">${i["snow"]["1h"]}mm</td>` : null} catch {null};
                                    break;
                                case "Snow/3hr:":
                                    try {i["snow"]["3h"] ? toAddElement = `<td class="weather-attribute">${i["snow"]["3h"]}mm</td>` : null} catch {null};
                                    break;
                                case "Visibility:":
                                    toAddElement = `<td class="weather-attribute">${i["visibility"]/1000}km</td>`;
                                    break;
                                case "Wind Direction:":
                                    toAddElement = `<td class="weather-attribute">${i["wind"]["deg"]}°</td>`;
                                    break;
                                case "Wind Gust:":
                                    try {i["wind"]["gust"] ? toAddElement = `<td class="weather-attribute">${Math.round(i["wind"]["gust"]*3.6)}km/h</td>` : null} catch {null};
                                    break;
                                case "Wind Speed:":
                                    toAddElement = `<td class="weather-attribute">${Math.round(i["wind"]["speed"]*3.6)}km/h</td>`;
                                    break;
                            }
                            break;
                        }
                    }
                    newElement += toAddElement;
                }
            }
            newElement += '</tr>';
            $('#weather-table-body').append(newElement);
        }
    }

    //function to find most common weather
    function findMostCommonWeather(arr) {
        const elementCounts = {};
        arr.forEach((element) => {
          elementCounts[element] = (elementCounts[element] || 0) + 1;
        });
        let mostCommonElement = null;
        let maxCount = 0;
        for (const element in elementCounts) {
          if (elementCounts[element] > maxCount) {
            mostCommonElement = element;
            maxCount = elementCounts[element];
          }
        }
        return mostCommonElement;
    }
    
});