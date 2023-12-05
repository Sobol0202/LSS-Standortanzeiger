// ==UserScript==
// @name         Standortanzeiger
// @namespace    https://github.com/Glaeydar/LSS_Scripts/Standortanzeiger.user.js
// @version      0.4
// @description  Zeigt die Standorte von Wachen an
// @author       Glaeydar -edit by MissSobol
// @match        https://www.leitstellenspiel.de/
// @require      https://github.com/tyrasd/osmtogeojson/raw/gh-pages/osmtogeojson.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var scriptEnabled = false;
    var poiLayer;

    // Steuerungsbutton erstellen
    var toggleButton = document.createElement('button');
    toggleButton.innerHTML = 'FW POI Aus';
    toggleButton.style.padding = '0px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.border = 'none';
    toggleButton.style.background = '#3498db';
    toggleButton.style.color = '#fff';
    toggleButton.style.borderRadius = '0px';
    toggleButton.addEventListener('click', function() {
        scriptEnabled = !scriptEnabled;
        if (scriptEnabled) {
            toggleButton.innerHTML = 'FW POI An';
            enableScript();
        } else {
            toggleButton.innerHTML = 'FW POI Aus';
            disableScript();
        }
    });

    // Steuerungsbutton einfügen
    var leafletControl = document.querySelector('.leaflet-control-attribution');
    leafletControl.appendChild(toggleButton);

    function enableScript() {
        map.on('zoomend', updatePOI);
        map.on('moveend', updatePOI);
        updatePOI();
    }

    function disableScript() {
        map.off('zoomend', updatePOI);
        map.off('moveend', updatePOI);
        clearPOILayer();
    }

    function updatePOI() {
        if (scriptEnabled) {
            clearPOILayer();
            loadPOI('"amenity"="fire_station"');
        }
    }

    function clearPOILayer() {
        if (poiLayer) {
            map.removeLayer(poiLayer);
        }
    }

    function loadPOI(type) {
        console.log("loading data");

        let overpassApiUrl = buildOverpassApiUrl(map, type);

        $.get(overpassApiUrl, function (osmDataAsXml) {
            var resultAsGeojson = osmtogeojson(osmDataAsXml);
            poiLayer = L.geoJson(resultAsGeojson, {
                style: function (feature) {
                    return {color: "#ff0000"};
                },
                filter: function (feature, layer) {
                    var isPolygon = (feature.geometry) && (feature.geometry.type !== undefined) && (feature.geometry.type === "Polygon");
                    if (isPolygon) {
                        feature.geometry.type = "Point";
                        var polygonCenter = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();
                        feature.geometry.coordinates = [polygonCenter.lat, polygonCenter.lng];
                    }
                    return true;
                }
            }).addTo(map);
            console.log("finish loading");
        });
    }

    function buildOverpassApiUrl(map, overpassQuery) {
        var bounds = map.getBounds().getSouth() + ',' + map.getBounds().getWest() + ',' + map.getBounds().getNorth() + ',' + map.getBounds().getEast();
        var nodeQuery = 'node[' + overpassQuery + '](' + bounds + ');';
        var wayQuery = 'way[' + overpassQuery + '](' + bounds + ');';
        var relationQuery = 'relation[' + overpassQuery + '](' + bounds + ');';
        var query = '?data=[out:xml][timeout:25];(' + nodeQuery + wayQuery + relationQuery + ');out body;>;out skel qt;';
        var baseUrl = 'https://overpass-api.de/api/interpreter';
        var resultUrl = baseUrl + query;
        return resultUrl;
    }

    // Initial setup
    disableScript();

})();
