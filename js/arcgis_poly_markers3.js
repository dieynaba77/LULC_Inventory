﻿var map, lyrOpacityFlag, theImage, mil, iconlayer, isslayer, nextIndex;
var mapInfo;
var clusterLayer;
var globalClusterLayer;
var Point;
var total = [];
var clusterLayerArray = [];
var clusterIndexer = [];
var catArray = [];
var myjsonmerge;
var selLayer;
var orderedLayerArray = [];
var planned = [];
var inprogress = [];
var completed = [];
var gToggle;
//function initMap() {


    require([

        "dojo/parser",
              "dojo/ready",
              "dojo/_base/array",
              "dojo/_base/Color",
              "dojo/dom-style",
              "dojo/query",

              "esri/map",
              "esri/layers/KMLLayer",
              "esri/request",
              "esri/graphic",
              "esri/geometry/Extent",

               "esri/symbols/SimpleMarkerSymbol",
              "esri/symbols/SimpleFillSymbol",
              "esri/symbols/PictureMarkerSymbol",
              "esri/renderers/ClassBreaksRenderer",

               "esri/layers/GraphicsLayer",
              "esri/SpatialReference",
              "esri/dijit/PopupTemplate",
              "esri/geometry/Point",
              "esri/geometry/webMercatorUtils",

              "extras/ClusterLayer",
                "esri/dijit/BasemapToggle",
                "esri/layers/WMSLayer",
                "esri/config",
                "esri/layers/ArcGISTiledMapServiceLayer",
                "esri/toolbars/draw",
                "esri/tasks/geometry",
                "esri/layers/FeatureLayer",
                "esri/dijit/BasemapGallery",
                "esri/arcgis/utils",
                "esri/toolbars/navigation",
                "dijit/form/Button",
              "dijit/layout/BorderContainer",
              "dijit/layout/ContentPane",

              "dojo/domReady!"


    ],
        function (parser, ready, arrayUtils, Color, domStyle, query,
             Map, KMLLayer, esriRequest, Graphic, Extent,
             SimpleMarkerSymbol, SimpleFillSymbol, PictureMarkerSymbol, ClassBreaksRenderer,
              GraphicsLayer, SpatialReference, PopupTemplate, point, webMercatorUtils,
              ClusterLayer, BasemapToggle, WMSLayer, esriConfig, ArcGISTiledMapServiceLayer, Draw, geometry, FeatureLayer,
              BasemapGallery, arcgisUtils) {
            map = new Map("map", { basemap: "topo" });
            fullextent();
            map.setZoom(4);

            selLayer = new esri.layers.GraphicsLayer();
            selLayer.id = "mygraphics";

            dojo.connect(map, "onLoad", function () {
                map.addLayer(selLayer);
                var sym = new esri.symbol.SimpleFillSymbol({ "color": [255, 255, 0, 64], "outline": { "color": [255, 0, 0, 255], "width": 1.5, "type": "esriSLS", "style": "esriSLSsolid" }, "type": "esriSFS", "style": "esriSFSSolid" });
                for (var i = 0; i < polygonJson.length; i++) {
                    var graphic = new esri.Graphic(polygonJson[i], sym);
                    graphic.id = polygonJson[i].id;
                    selLayer.add(graphic);
                }
                try {
                    map.reorderLayer(map.getLayer("mygraphics"), 0);
                }
                catch (e) { }
            });
            dojo.connect(map, "onLoad", function () {
                dojo.connect(map.getLayer("mygraphics"), "onClick", function (e) {
        
                    populatePanelByCountry(e.graphic.id);

                });
            });

            var toggle = new BasemapToggle({ map: map, basemap: "satellite" }, "BasemapToggle");
           // gToggle = toggle;
            toggle.startup();
            globalClusterLayer = ClusterLayer;
            Point = point;
            var picBaseUrl = "https://static.arcgis.com/images/Symbols/Shapes/";
            var green = new esri.symbol.PictureMarkerSymbol(picBaseUrl + "completed.png", 34, 34).setOffset(0, 10);
            var yellow = new esri.symbol.PictureMarkerSymbol(picBaseUrl + "inprogressMarker3.png", 34, 34).setOffset(0, 10);
            var orange = new esri.symbol.PictureMarkerSymbol(picBaseUrl + "plannedMarker3.png", 34, 34).setOffset(0, 10);
            var supportsOrientationChange = "onorientationchange" in window,
           orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
            window.addEventListener(orientationEvent, function () { orientationChanged(); }, false);
            lyrOpacityFlag = false;
            removeDynMapListener();
            function orientationChanged() { if (map) { map.reposition(); map.resize(); } }
            function removeDynMapListener() {
                if (window.DeviceMotionEvent) {
                    var threshhold = 20;
                    var xPTA, yPTA, zPTA, xPostTA, yPostTA, zPostTA = 0;
                    window.addEventListener('devicemotion', function (e) {
                        xPTA = e.acceleration.x;
                        yPTA = e.acceleration.y; zPTA = e.acceleration.z;
                    });
                    setInterval(function () {
                        var change = Math.abs(xPTA - xPostTA + yPTA - yPostTA + zPTA - zPostTA);
                        if (change > threshhold) { fullextent() }
                        xPostTA = xPTA; yPostTA = yPTA; zPostTA = zPTA;
                    }, 150);
                } else { alert("DeviceMotion is currently not supported on this hardware."); }
            }
            //add points to the map
            function addClusters(resp, which) {
                afteraddC = resp;
                wgs = new SpatialReference({
                    "wkid": 4326
                });
                globalSpatialReference = SpatialReference;
                if (mapInfo == null) {
                    mapInfo = {};
                }
                var removeList = [];
                mapInfo.data = arrayUtils.map(completedArray, function (p) {

                    total.push(p);

                    var theLat;
                    var theLong;
                    var found = false;
                    var categories = [];
                    categories.push(p.CategoryName);  //Change this to CategoryID
                    gcategories = categories;
                    var theCountry = "";  //Change to CategoryID of Global
                    catArray.push(categories);

                    for (var i = 0; i < categories.length; i++) {
                        for (j = 0; j < locationCentroids.Locations.length; j++) {
                            try {

                                if (categories[i].toLowerCase() == locationCentroids.Locations[j].Location.toLowerCase())//planned
                                {
                                    theCountry = categories[i];
                                    theLat = randomizeMe(locationCentroids.Locations[j].Lat);
                                    theLong = randomizeMe(locationCentroids.Locations[j].Lon);

                                    found = true;
                                    // break;
                                }
                            }
                            catch (e) {
                                console.log(i);
                                console.log('error');
                            }

                        }
                        if (found) {
                            // break;
                        }
                    }//end for



                    var catID = p.CategoryID;
                    var linkColor;
                    if ($.inArray(13, catID) > -1)//planned
                    {
                        linkColor = "#8D529D";
                        theLong += .25;
                        //theLat += .5;
                    }
                    else if ($.inArray(50, catID) > -1) {
                        linkColor = "#008FE3";
                        theLong -= .25;
                        //theLat -= .5;
                    }


                    var latlng = new esri.geometry.Point(theLong, theLat, wgs);
                    checklatlng = latlng;
                    var webMercator = webMercatorUtils.geographicToWebMercator(latlng);
                    var viewgraph = "downloadLink('";
                    var closeview = "')";
                    //stationIDList.push(p.attributes.Code);


                    var attributes = {
                        "Title": "<a href='https://servirglobal.net" + "' target='_blank' style='color:" + linkColor + ";'>" + p.Title + "</a>",
                        "Location": theLat + ", " + theLong,

                        "DataSource": p.DataSource,
                        "MapYear": p.MapYear,
                        "Organization": p.Organization,
                        "Country": theCountry

                    };


                    return {
                        "x": webMercator.x,
                        "y": webMercator.y,
                        "attributes": attributes
                    };


                });

                // popupTemplate to work with attributes specific to this dataset
                var myPopupTemplate = PopupTemplate({
                    "title": "{Title}",
                    "mediaInfos": [{
                        "title": "",
                        "type": "image",
                        "value": {
                            "sourceURL": "{Image}",
                            "linkURL": "{Link}"
                        },
                        "caption": "{DataSource}"

                    }]
                });

                var raw = [];
                for (var i = 0; i < mapInfo.data.length; i++) {
                   
                    if (total[i].Status.indexOf("Planned") > -1) {
                        planned.push(mapInfo.data[i]);
                    }
                    else if (total[i].Status.indexOf("In progress") > -1) {//inprogress
                        inprogress.push(mapInfo.data[i]);
                    }
                    else {//completed
                        completed.push(mapInfo.data[i]);
                    }
                }

                addSingleClusterLayer(planned, 'orange', myPopupTemplate, 'planned');

                addSingleClusterLayer(completed, 'green', myPopupTemplate, 'completed');

                addSingleClusterLayer(inprogress, 'yellow', myPopupTemplate, 'inprogress');

                $(document).ready(function () {
                    map.on("click", cleanUp);
                    map.on("key-down", function (e) {
                        if (e.keyCode === 27) {
                            cleanUp();
                        }
                        if (e.keyCode === 37 || e.keyCode === 66) {
                            //navigate back
                            $('.titleButton.prev').click();
                            return;
                        }
                        if (e.keyCode === 39 || e.keyCode === 78) {
                            //navigate forward
                            $('.titleButton.next').click();
                            return;
                        }
                    });
                    map.infoWindow.onShow = function (event) {
                        _repositionInfoWin(map.infoWindow._location);
                    }
                    $('.esriPopup .titleButton.close').on("click", cleanUp);
                    map.on("zoom-end", cleanUp);
                    map.on("extent-change", changeHandler);


                });

            }
            gClusters = addClusters;
            function addSingleClusterLayer(data, color, template, id) {
                ourData = data;
                theTemplate = template;
                var singleSymbol;// = new SimpleMarkerSymbol("circle", 6, null, new Color(color));
                if (color == 'yellow') {
                    singleSymbol = new esri.symbol.PictureMarkerSymbol("images/markers/inprogress.png", 34, 34).setOffset(0, 10);
                }
                else if (color == 'green') {
                    singleSymbol = new esri.symbol.PictureMarkerSymbol("images/markers/completed.png", 34, 34).setOffset(0, 10);

                }
                else if (color == 'orange') {
                    singleSymbol = new esri.symbol.PictureMarkerSymbol("images/markers/planned.png", 34, 34).setOffset(0, 10);
                }
                else {//we'll use color sent
                    singleSymbol = new SimpleMarkerSymbol("circle", 8, null, new Color(color));
                }

                clusterLayer = new globalClusterLayer({
                    "data": data,
                    "distance": 50,
                    "id": id,
                    "labelColor": "white",
                    "labelOffset": 3,
                    "resolution": map.extent.getWidth() / map.width,
                    "singleSymbol": singleSymbol,
                    "singleTemplate": template,
                    "showSingles": false
                });
                clusterIndexer.push(color);
                clusterLayerArray.push(clusterLayer);
                var defaultSym = new esri.symbol.SimpleMarkerSymbol().setSize(4);
                var renderer = new ClassBreaksRenderer(defaultSym, "clusterCount");

                var picBaseUrl = "https://static.arcgis.com/images/Symbols/Shapes/";
                var green = new esri.symbol.PictureMarkerSymbol("images/markers/completed.png", 34, 34).setOffset(0, 10);

                var yellow = new esri.symbol.PictureMarkerSymbol("images/markers/inprogress.png", 34, 34).setOffset(0, 10);
                var orange = new esri.symbol.PictureMarkerSymbol("images/markers/planned.png", 34, 34).setOffset(0, 10);



                if (color == 'yellow') {
                    renderer.addBreak(0, 5000, yellow);
                }
                else if (color == 'green') {
                    renderer.addBreak(0, 5000, green);
                }
                else {
                    renderer.addBreak(0, 5000, orange);
                }

                clusterLayer.setRenderer(renderer);
                map.addLayer(clusterLayer);
                document.getElementById("loader").style.display = "block";
                document.getElementById("map").style.opacity = "0.5";
                map.setZoom(3);
              
                setTimeout('map.setZoom(4);', 1000);
                setTimeout('showMap();',2000)
            }
            expandcompletedArray();

            addClusters(completedArray, 50);



        });
//}
//get country name from country ID
function getNameByCatID(which) {

    for (var c = 0; c < activityCats.length; c++) {
        if (activityCats[c].CategoryID == which) {
            return activityCats[c].CategoryName;
        }
    }

}

//get the points that needs to be pushed on to the map
function expandcompletedArray() {
    var newcompletedArray = [];
    for (var c = 0; c < completedArray.length; c++) {
        try{
        var categories = completedArray[c].CategoryID;
        var theCountry = "Continental";
        catArray.push(categories);

        for (var i = 0; i < categories.length; i++) {
            for (j = 0; j < locationCentroids.Locations.length; j++) {
                if (categories[i] == locationCentroids.Locations[j].LocationID)
                {
                    
                    theCountry = getNameByCatID(categories[i]);
                    theLat = randomizeMe(locationCentroids.Locations[j].Lat);
                    theLong = randomizeMe(locationCentroids.Locations[j].Lon);


                    var newPoint = {
                        UID: completedArray[c].UID,
                        Title: completedArray[c].Title,
                        CategoryID: completedArray[c].CategoryID,
                        CategoryName: theCountry,
                        MapYear: completedArray[c].MapYear,
                        Organization: completedArray[c].Organization,
                        DataSource: completedArray[c].DataSource,
                        Extent:completedArray[c].Extent,
                        NumberOfClasses: completedArray[c].NumberOfClasses,
                        ReleasedYear: completedArray[c].ReleasedYear,
                        Notes: completedArray[c].Notes,
                        PointOfContactName: completedArray[c].PointOfContactName,
                        POCEmail: completedArray[c].POCEmail,
                        POCPhoneNumber: completedArray[c].POCPhoneNumber,
                        HowToCite: completedArray[c].HowToCite,

                        Status: completedArray[c].Status,
                        LastUpdatedBy: completedArray[c].LastUpdatedBy,
                        LastUpdatedTime:completedArray[c].LastUpdatedTime
                    }

                    newcompletedArray.push(newPoint);
                }
               
            }
        }
    }
        catch(e){

        }

    }
    completedArray = newcompletedArray;

}
var mycatIDs = [];
function cleanUp() {
    map.infoWindow.hide();
    try {
        clusterLayerArray[0].clearSingles();
        clusterLayerArray[1].clearSingles();
    }
    catch (e) { }

}
var oldzoom = -1;
var gcategories = [];
function changeHandler(evt) {
    if (map.loaded) {
        try {
            if (oldzoom != map.getZoom() && map.getZoom() <= 3) {

                for (var i = 0; i < map._layers.completed.graphics.length; i++) {

                    map._layers.completed.graphics[i].geometry.x = (1 * map._layers.completed.graphics[i].geometry.x) + 200000;
                }
                map._layers.completed.redraw()
                for (var i = 0; i < map._layers.planned.graphics.length; i++) {

                    map._layers.planned.graphics[i].geometry.x = (1 * map._layers.planned.graphics[i].geometry.x) - 200000;

                }
                map._layers.planned.redraw();
                for (var i = 0; i < map._layers.inprogress.graphics.length; i++) {
                    map._layers.inprogress.graphics[i].geometry.y = (1 * map._layers.inprogress.graphics[i].geometry.y) - 200000;
                    map._layers.inprogress.graphics[i].geometry.x = (1 * map._layers.inprogress.graphics[i].geometry.x) - 10000;
                }
                map._layers.inprogress.redraw()
            }
            else if (oldzoom != map.getZoom() && map.getZoom() == 4) {

                for (var i = 0; i < map._layers.completed.graphics.length; i++) {

                    map._layers.completed.graphics[i].geometry.x = (1 * map._layers.completed.graphics[i].geometry.x) + 100000;

                }
                map._layers.completed.redraw();
                for (var i = 0; i < map._layers.planned.graphics.length; i++) {

                    map._layers.planned.graphics[i].geometry.x = (1 * map._layers.planned.graphics[i].geometry.x) - 100000;

                }
                map._layers.planned.redraw();
                for (var i = 0; i < map._layers.inprogress.graphics.length; i++) {
                    map._layers.inprogress.graphics[i].geometry.y = (1 * map._layers.inprogress.graphics[i].geometry.y) - 100000;
                    map._layers.inprogress.graphics[i].geometry.x = (1 * map._layers.inprogress.graphics[i].geometry.x) - 10000;
                }
                map._layers.inprogress.redraw()
            }
            else if (oldzoom != map.getZoom() && map.getZoom() == 5) {

                for (var i = 0; i < map._layers.completed.graphics.length; i++) {

                    map._layers.completed.graphics[i].geometry.x = (1 * map._layers.completed.graphics[i].geometry.x) + 50000;

                }
                map._layers.completed.redraw()
                for (var i = 0; i < map._layers.planned.graphics.length; i++) {

                    map._layers.planned.graphics[i].geometry.x = (1 * map._layers.planned.graphics[i].geometry.x) - 50000;

                }
                map._layers.planned.redraw()
                for (var i = 0; i < map._layers.inprogress.graphics.length; i++) {
                    map._layers.inprogress.graphics[i].geometry.y = (1 * map._layers.inprogress.graphics[i].geometry.y) - 50000;
                    map._layers.inprogress.graphics[i].geometry.x = (1 * map._layers.inprogress.graphics[i].geometry.x) - 10000;
                }
                map._layers.inprogress.redraw()
            }
            else if (oldzoom != map.getZoom() && map.getZoom() == 6) {
                for (var i = 0; i < map._layers.completed.graphics.length; i++) {

                    map._layers.completed.graphics[i].geometry.x = (1 * map._layers.completed.graphics[i].geometry.x) + 50000;

                }
                map._layers.completed.redraw()
                for (var i = 0; i < map._layers.planned.graphics.length; i++) {

                    map._layers.planned.graphics[i].geometry.x = (1 * map._layers.planned.graphics[i].geometry.x) - 50000;

                }
                map._layers.planned.redraw()
                for (var i = 0; i < map._layers.inprogress.graphics.length; i++) {
                    map._layers.inprogress.graphics[i].geometry.y = (1 * map._layers.inprogress.graphics[i].geometry.y) - 45000;

                    map._layers.inprogress.graphics[i].geometry.x = (1 * map._layers.inprogress.graphics[i].geometry.x) - 10000;
                }
                map._layers.inprogress.redraw()
            }
            else if (oldzoom != map.getZoom() && map.getZoom() >= 7) {
                for (var i = 0; i < map._layers.inprogress.graphics.length; i++) {
                    map._layers.inprogress.graphics[i].geometry.y = (1 * map._layers.inprogress.graphics[i].geometry.y) - 25000;

                    map._layers.inprogress.graphics[i].geometry.x = (1 * map._layers.inprogress.graphics[i].geometry.x) - 10000;
                }
                map._layers.inprogress.redraw()
            }
            oldzoom = map.getZoom();

        }
        catch (e)
        { }
    }
    else {
        setTimeout("changeHandler()", 250);
    }
}
var ourData;
var theTemplate;

function fullextent() {
    map.setExtent(new esri.geometry.Extent(-130, -70, 130, 80, new esri.SpatialReference({ wkid: 4326 })));
}
///gets the ID of a country
function convertCategoryNameToID(which) {
    for (var i = 0; i < locationCentroids.Locations.length; i++) {
        if (locationCentroids.Locations[i].Location.toLowerCase() == which.toLowerCase()) {
            return locationCentroids.Locations[i].LocationID;
        }
    }
}

//function populate the data from the completedArray 
function populatePanelByCountry(which) {
   
    if (document.getElementById("accordionholder").style.display == "none") {
        toggleAccordion();
    }

    var catID = convertCategoryNameToID(which);
    /**********************************************************
    get list of completed, planned and inprogress data from completedArray that are tagged with 'which'
    Create the article html inserting image, link, title, and summary
    Add html to the correct accordion location
    **********************************************************/
    var foundcompleted = false;
    var foundplanned = false;
    var foundinprogress = false;
    var foundData = false;
    var completedCounter = 0;
    var plannedCounter = 0;
    var inprogressCounter = 0;
    var dataCounter = 0;
    removeexisting("completedarticleholder");
    removeexisting("plannedarticleholder");
    removeexisting("inprogresssarticleholder");
    sortedcompleted = completedArray;
    for (var i = 0; i < sortedcompleted.length; i++) {
        if (sortedcompleted[i].CategoryID.indexOf(catID) > -1) {//planned
          
            if (sortedcompleted[i].DataSource == "") sortedcompleted[i].DataSource = "Not specified";
            if (sortedcompleted[i].Organization == "") sortedcompleted[i].Organization = "Not specified";
            if (sortedcompleted[i].MapYear == "") sortedcompleted[i].MapYear = "Not specified";
            if (sortedcompleted[i].HowToCite == "") sortedcompleted[i].HowToCite = "Not specified";
            if (sortedcompleted[i].Notes == "") sortedcompleted[i].Notes = "Not specified";
            if (sortedcompleted[i].POCEmail == "") sortedcompleted[i].POCEmail = "Not specified";
            if (sortedcompleted[i].POCPhoneNumber == "") sortedcompleted[i].POCPhoneNumber = "Not specified";
            if (sortedcompleted[i].PointOfContactName == "") sortedcompleted[i].PointOfContactName = "Not specified";
            if(sortedcompleted[i].Status.indexOf("Planned") > -1)   
            {
                var clone = document.getElementById('templateholder').childNodes[1].cloneNode(true);
                if (!(plannedCounter % 2 == 0)) {
                    clone.className = clone.className + " odd";
                }
                plannedCounter++;
                document.getElementById('uid_hidden').innerHTML = sortedcompleted[i].UID;

                clone.getElementsByClassName('articlelink')[0].id = sortedcompleted[i].UID;
                clone.getElementsByClassName('articlelink')[0].onclick = function () {
                  
                    var a = "", b = "", c = "", d = "", e = "", f = "", g = "", h = "", k = "", l = "", m = "", n = "", o = "",lub="",lut="";
                    for (var x = 0; x < sortedcompleted.length; x++) {
                        if (sortedcompleted[x].UID == this.id && sortedcompleted[x].CategoryName == document.getElementById("accordionTitle").innerHTML) {
                            document.getElementById("spanfora").innerHTML = decodeURIComponent(sortedcompleted[x].Title);
                            document.getElementById("spanfora0").innerHTML = "View Data for " + decodeURIComponent(sortedcompleted[x].Title);
                            document.getElementById("ea").value = sortedcompleted[x].Title;
                            document.getElementById("spanforb").innerHTML = sortedcompleted[x].CategoryName;
                            document.getElementById("eb").value = sortedcompleted[x].CategoryName;
                            document.getElementById("spanforc").innerHTML = sortedcompleted[x].MapYear;
                            document.getElementById("ec").value = sortedcompleted[x].MapYear;
                            document.getElementById("spanford").innerHTML = sortedcompleted[x].Organization;
                            document.getElementById("ed").value = sortedcompleted[x].Organization;
                            if (sortedcompleted[x].NumberOfClasses == 0) {
                                document.getElementById("spanfore").innerHTML = "Not specified";
                                document.getElementById("ee").value = "Not specified";
                            }
                            else {
                                document.getElementById("ee").value = sortedcompleted[x].NumberOfClasses;
                                document.getElementById("spanfore").innerHTML = sortedcompleted[x].NumberOfClasses;
                            }
                            document.getElementById("spanforf").innerHTML = sortedcompleted[x].DataSource;
                            document.getElementById("ef").value = sortedcompleted[x].DataSource;
                            if (sortedcompleted[x].Extent == "")

                                document.getElementById("spanforext").innerHTML = "Full Country";
                            else
                                document.getElementById("spanforext").innerHTML = sortedcompleted[x].Extent;
                            document.getElementById("spanforg").innerHTML = "Planned";
                            document.getElementById("eg").value = "Planned";
                            if (sortedcompleted[x].ReleasedYear == 0) {
                                document.getElementById("spanforh").innerHTML = "Not specified";
                                document.getElementById("eh").value = "Not specified";
                            }
                            else {
                                document.getElementById("spanforh").innerHTML = sortedcompleted[x].ReleasedYear;
                                document.getElementById("eh").value = sortedcompleted[x].ReleasedYear;

                            }

                            document.getElementById("spanfork").innerHTML = sortedcompleted[x].Notes;
                            document.getElementById("ek").value = sortedcompleted[x].Notes;
                            document.getElementById("spanforl").innerHTML = sortedcompleted[x].PointOfContactName;
                            document.getElementById("el").value = sortedcompleted[x].PointOfContactName;
                            document.getElementById("spanform").innerHTML = sortedcompleted[x].POCEmail;
                            if (sortedcompleted[x].POCEmail == "Not specified") {
                                document.getElementById("em").value = "";
                                document.getElementById("em").placeholder = "POC Email address";
                            }
                            else
                                document.getElementById("em").value = sortedcompleted[x].POCEmail;
                            document.getElementById("spanforn").innerHTML = sortedcompleted[x].POCPhoneNumber;
                            if (sortedcompleted[x].POCPhoneNumber == "Not specified") {
                                document.getElementById("en").value = "";
                                document.getElementById("en").placeholder = "POC Phone Number";
                            }
                            else
                                document.getElementById("en").value = sortedcompleted[x].POCPhoneNumber;
                            document.getElementById("spanforo").innerHTML = sortedcompleted[x].HowToCite;
                            document.getElementById("eo").value = sortedcompleted[x].HowToCite;
                            document.getElementById("spanforlub").innerHTML = sortedcompleted[x].LastUpdatedBy;

                            document.getElementById("spanforlut").innerHTML = sortedcompleted[x].LastUpdatedTime;
                            document.getElementById("updatePanelButton").onclick = function () { updateData(sortedcompleted[x].UID) };
                            document.getElementById("updateCancelButton").onclick = function () { $('.modal_editUpdate').hide(); };
                            break;
                        }
                    }
                    var anchor = "";
                    var del = "";
                    var unapprove = "";
                    if (adminLoggedIn == 1) {
                        $("#links").show();
                        document.getElementById("editlink").onclick = function () { $('#etable').show(); editData(-1); document.getElementById("spanfora0").innerHTML = "Edit Data for " + sortedcompleted[x].Title; };
                        document.getElementById("editlink").style.display = "inline";

                        document.getElementById("deletelink").onclick = function () { deleteData(sortedcompleted[x].UID) } ;
                        document.getElementById("deletelink").style.display = "inline";

                        document.getElementById("unapprovelink").onclick = function () { unapproveData(sortedcompleted[x].UID); };
                        document.getElementById("unapprovelink").style.display = "inline";

                 }
                    else {
                        $("#links").hide();
                        document.getElementById("editlink").onclick = function () { editData(-1) } ;
                        document.getElementById("editlink").style.display = "none";
                        document.getElementById("deletelink").onclick = function () { deleteData(sortedcompleted[x].UID) } ;
                        document.getElementById("deletelink").style.display = "none";

                        document.getElementById("unapprovelink").onclick = function () { unapproveData(sortedcompleted[x].UID) };
                        document.getElementById("unapprovelink").style.display = "none";
              

                    }
                    $('.modal_editUpdate').show();
                    $('#dtable').show();
                    $('#etable').hide();


                }

                clone.getElementsByClassName('articlelink')[0].innerHTML = decodeURIComponent(sortedcompleted[i].Title);
                clone.getElementsByClassName('articlelink')[0].className = clone.getElementsByClassName('articlelink')[0].className + " planned";
                clone.getElementsByClassName('inventoryDataSource')[0].innerHTML = "Data Source: " + sortedcompleted[i].DataSource;
                clone.getElementsByClassName('inventoryMapYear')[0].innerHTML = "Year: " + sortedcompleted[i].MapYear;
                clone.getElementsByClassName('inventoryOrganization')[0].innerHTML = "Organization: " + sortedcompleted[i].Organization;
                document.getElementById('plannedarticleholder').appendChild(clone);
                foundplanned = true;
                clones.push(clone);
                clone = null;
            }
            else if (sortedcompleted[i].Status.indexOf("In progress") > -1) {//In progress
                var clone = document.getElementById('templateholder').childNodes[1].cloneNode(true);
                if (!(inprogressCounter % 2 == 0)) {
                    clone.className = clone.className + " odd";
                }
                inprogressCounter++;
                clone.getElementsByClassName('articlelink')[0].id = sortedcompleted[i].UID;

                document.getElementById('uid_hidden').innerHTML = sortedcompleted[i].UID;
                clone.getElementsByClassName('articlelink')[0].onclick = function () {
                    

                    var a = "", b = "", c = "", d = "", e = "", f = "", g = "", h = "", k = "", l = "", m = "", n = "", o = "",lub="",lut="";
                    for (var x = 0; x < sortedcompleted.length; x++) {
                        if (sortedcompleted[x].UID == this.id && sortedcompleted[x].CategoryName == document.getElementById("accordionTitle").innerHTML) {
                            document.getElementById("spanfora").innerHTML = decodeURIComponent(sortedcompleted[x].Title);
                            document.getElementById("spanfora0").innerHTML = "View Data for " + decodeURIComponent(sortedcompleted[x].Title);
                            document.getElementById("ea").value = sortedcompleted[x].Title;
                            document.getElementById("spanforb").innerHTML = sortedcompleted[x].CategoryName;
                            document.getElementById("eb").value = sortedcompleted[x].CategoryName;
                            document.getElementById("spanforc").innerHTML = sortedcompleted[x].MapYear;
                            document.getElementById("ec").value = sortedcompleted[x].MapYear;
                            document.getElementById("spanford").innerHTML = sortedcompleted[x].Organization;
                            document.getElementById("ed").value = sortedcompleted[x].Organization;
                            if (sortedcompleted[x].NumberOfClasses == 0) {
                                document.getElementById("spanfore").innerHTML = "Not specified";
                                document.getElementById("ee").value = "Not specified";
                            }
                            else {
                                document.getElementById("ee").value = sortedcompleted[x].NumberOfClasses;
                                document.getElementById("spanfore").innerHTML = sortedcompleted[x].NumberOfClasses;
                            }

                            document.getElementById("spanforf").innerHTML = sortedcompleted[x].DataSource;
                            document.getElementById("ef").value = sortedcompleted[x].DataSource;
                            if (sortedcompleted[x].Extent == "")

                                document.getElementById("spanforext").innerHTML = "Full Country";
                            else
                                document.getElementById("spanforext").innerHTML = sortedcompleted[x].Extent;
                            document.getElementById("spanforg").innerHTML = "In progress";
                            document.getElementById("eg").value = "In progress";
                            if (sortedcompleted[x].ReleasedYear == 0) {
                                document.getElementById("spanforh").innerHTML = "Not specified";
                                document.getElementById("eh").value = "Not specified";
                            }
                            else {
                                document.getElementById("spanforh").innerHTML = sortedcompleted[x].ReleasedYear;
                                document.getElementById("eh").value = sortedcompleted[x].ReleasedYear;

                            }

                            document.getElementById("spanfork").innerHTML = sortedcompleted[x].Notes;
                            document.getElementById("ek").value = sortedcompleted[x].Notes;
                            document.getElementById("spanforl").innerHTML = sortedcompleted[x].PointOfContactName;
                            document.getElementById("el").value = sortedcompleted[x].PointOfContactName;
                            document.getElementById("spanform").innerHTML = sortedcompleted[x].POCEmail;
                            if (sortedcompleted[x].POCEmail == "Not specified") {
                                document.getElementById("em").value = "";
                                document.getElementById("em").placeholder = "POC Email address";
                            }
                            else
                                document.getElementById("em").value = sortedcompleted[x].POCEmail;
                            document.getElementById("spanforn").innerHTML = sortedcompleted[x].POCPhoneNumber;
                            if (sortedcompleted[x].POCPhoneNumber == "Not specified") {
                                document.getElementById("en").value = "";
                                document.getElementById("en").placeholder = "POC Phone Number";
                            }
                            else
                                document.getElementById("en").value = sortedcompleted[x].POCPhoneNumber;
                            document.getElementById("spanforo").innerHTML = sortedcompleted[x].HowToCite;
                            document.getElementById("eo").value = sortedcompleted[x].HowToCite;
                            document.getElementById("spanforlub").innerHTML = sortedcompleted[x].LastUpdatedBy;

                            document.getElementById("spanforlut").innerHTML = sortedcompleted[x].LastUpdatedTime;
                            document.getElementById("updatePanelButton").onclick = function () { updateData(sortedcompleted[x].UID) };
                            document.getElementById("updateCancelButton").onclick = function () { $('.modal_editUpdate').hide(); };

                            break;
                        }
                    }
                    var anchor = "";
                    var del = "";
                    var unapprove = "";
                    if (adminLoggedIn == 1) {
                        $("#links").show();
                        document.getElementById("editlink").onclick = function () { $('#etable').show(); editData(0); document.getElementById("spanfora0").innerHTML = "Edit Data for " + sortedcompleted[x].Title; };
                        document.getElementById("editlink").style.display = "inline";

                        document.getElementById("deletelink").onclick = function () { deleteData(sortedcompleted[x].UID) } ;
                        document.getElementById("deletelink").style.display = "inline";

                        document.getElementById("unapprovelink").onclick = function () { unapproveData(sortedcompleted[x].UID) };
                        document.getElementById("unapprovelink").style.display = "inline";
                    }
                    else {
                        $("#links").hide();
                        document.getElementById("editlink").onclick = function () { editData(0) } ;
                        document.getElementById("editlink").style.display = "none";
                        document.getElementById("deletelink").onclick = function () { deleteData(sortedcompleted[x].UID) } ;
                        document.getElementById("deletelink").style.display = "none";

                        document.getElementById("unapprovelink").onclick = function () { unapproveData(sortedcompleted[x].UID) };
                        document.getElementById("unapprovelink").style.display = "none";

                    }
                    $('.modal_editUpdate').show();
                    $('#dtable').show();
                    $('#etable').hide();
                }

                clone.getElementsByClassName('articlelink')[0].innerHTML = decodeURIComponent(sortedcompleted[i].Title);
                clone.getElementsByClassName('articlelink')[0].className = clone.getElementsByClassName('articlelink')[0].className + " inprogress";
                clone.getElementsByClassName('inventoryDataSource')[0].innerHTML = "Data Source: " + sortedcompleted[i].DataSource;
                clone.getElementsByClassName('inventoryMapYear')[0].innerHTML = "Year: " + sortedcompleted[i].MapYear;
                clone.getElementsByClassName('inventoryOrganization')[0].innerHTML = "Organization: " + sortedcompleted[i].Organization;

                document.getElementById('inprogresssarticleholder').appendChild(clone);
                foundinprogress = true;
                clones.push(clone);
                clone = null;
            }
            else {//completed 
             
                var clone = document.getElementById('templateholder').childNodes[1].cloneNode(true);
                gclone = clone;
                if (!(completedCounter % 2 == 0)) {
                    clone.className = clone.className + " odd";
                }
                completedCounter++;
                document.getElementById('uid_hidden').innerHTML = sortedcompleted[i].UID;
                clone.getElementsByClassName('articlelink')[0].id = sortedcompleted[i].UID;
               
                clone.getElementsByClassName('articlelink')[0].onclick = function () {
                  
                    var a = "", b = "", c = "", d = "", e = "", f = "", g = "", h = "", k = "", l = "", m = "", n = "", o = "",lub="",lut="";
                    for (var x = 0; x < sortedcompleted.length; x++) {
                        if (sortedcompleted[x].UID == this.id && sortedcompleted[x].CategoryName == document.getElementById("accordionTitle").innerHTML) {
                            document.getElementById("spanfora").innerHTML = decodeURIComponent(sortedcompleted[x].Title);
                            document.getElementById("spanfora0").innerHTML = "View Data for " + decodeURIComponent(sortedcompleted[x].Title);
                            document.getElementById("ea").value = sortedcompleted[x].Title;
                            document.getElementById("spanforb").innerHTML = sortedcompleted[x].CategoryName;
                            document.getElementById("eb").value = sortedcompleted[x].CategoryName;
                            document.getElementById("spanforc").innerHTML = sortedcompleted[x].MapYear;
                            document.getElementById("ec").value = sortedcompleted[x].MapYear;
                            document.getElementById("spanford").innerHTML = sortedcompleted[x].Organization;
                            document.getElementById("ed").value = sortedcompleted[x].Organization;
                            if (sortedcompleted[x].NumberOfClasses == 0) {
                                document.getElementById("spanfore").innerHTML = "Not specified";
                                document.getElementById("ee").value = "Not specified";
                            }
                            else {
                                document.getElementById("ee").value = sortedcompleted[x].NumberOfClasses;
                                document.getElementById("spanfore").innerHTML = sortedcompleted[x].NumberOfClasses;
                            }
                            document.getElementById("spanforf").innerHTML = sortedcompleted[x].DataSource;
                            document.getElementById("ef").value = sortedcompleted[x].DataSource;
                            if (sortedcompleted[x].Extent == "")

                                document.getElementById("spanforext").innerHTML = "Full Country";
                            else
                                document.getElementById("spanforext").innerHTML = sortedcompleted[x].Extent;
                            document.getElementById("spanforg").innerHTML = "Completed";
                            document.getElementById("eg").value = "Completed";
                            if (sortedcompleted[x].ReleasedYear == 0) {
                                document.getElementById("spanforh").innerHTML = "Not specified";
                                document.getElementById("eh").value = "Not specified";
                            }
                            else {
                                document.getElementById("spanforh").innerHTML = sortedcompleted[x].ReleasedYear;
                                document.getElementById("eh").value = sortedcompleted[x].ReleasedYear;

                            }

                            document.getElementById("spanfork").innerHTML = sortedcompleted[x].Notes;
                            document.getElementById("ek").value = sortedcompleted[x].Notes;
                            document.getElementById("spanforl").innerHTML = sortedcompleted[x].PointOfContactName;
                            document.getElementById("el").value = sortedcompleted[x].PointOfContactName;
                            document.getElementById("spanform").innerHTML = sortedcompleted[x].POCEmail;
                            if (sortedcompleted[x].POCEmail == "Not specified"){
                                document.getElementById("em").value = "";
                            document.getElementById("em").placeholder = "POC Email address";
                        }
                        else
                            document.getElementById("em").value = sortedcompleted[x].POCEmail;
                            document.getElementById("spanforn").innerHTML = sortedcompleted[x].POCPhoneNumber;
                            if (sortedcompleted[x].POCPhoneNumber == "Not specified") {
                                document.getElementById("en").value = "";
                                document.getElementById("en").placeholder = "POC Phone Number";
                            }
                            else
                                document.getElementById("en").value = sortedcompleted[x].POCPhoneNumber;
                            document.getElementById("spanforo").innerHTML = sortedcompleted[x].HowToCite;
                            document.getElementById("eo").value = sortedcompleted[x].HowToCite;
                            document.getElementById("spanforlub").innerHTML = sortedcompleted[x].LastUpdatedBy;

                            document.getElementById("spanforlut").innerHTML = sortedcompleted[x].LastUpdatedTime;
                            document.getElementById("updatePanelButton").onclick = function () { updateData(sortedcompleted[x].UID) };
                            document.getElementById("updateCancelButton").onclick = function () { $('.modal_editUpdate').hide();};

                            break;
                        }
                    }
                    var anchor = "";
                    var del = "";
                    var unapprove = "";
                    if (adminLoggedIn == 1) {
                        $("#links").show();
                        document.getElementById("editlink").onclick = function () { $("#links").show();$('#etable').show(); editData(1); document.getElementById("spanfora0").innerHTML = "Edit Data for " + sortedcompleted[x].Title; };
                        document.getElementById("editlink").style.display = "inline";

                        document.getElementById("deletelink").onclick = function () { deleteData(sortedcompleted[x].UID) } ;
                        document.getElementById("deletelink").style.display = "inline";

                        document.getElementById("unapprovelink").onclick = function () { unapproveData(sortedcompleted[x].UID) };
                        document.getElementById("unapprovelink").style.display = "inline";
                    }
                    else {
                        $("#links").hide();
                        document.getElementById("editlink").onclick = function () { editData(1) } ;
                        document.getElementById("editlink").style.display = "none";
                        document.getElementById("deletelink").onclick = function () { deleteData(sortedcompleted[x].UID) } ;
                        document.getElementById("deletelink").style.display = "none";

                        document.getElementById("unapprovelink").onclick = function () { unapproveData(sortedcompleted[x].UID) };
                        document.getElementById("unapprovelink").style.display = "none";

                    }
                    $('.modal_editUpdate').show();
                    $('#dtable').show();
                    $('#etable').hide();
                }
          
                
                clone.getElementsByClassName('articlelink')[0].innerHTML = decodeURIComponent(sortedcompleted[i].Title);
                clone.getElementsByClassName('articlelink')[0].className = clone.getElementsByClassName('articlelink')[0].className + " completed";
                clone.getElementsByClassName('inventoryDataSource')[0].innerHTML = "Data Source: "+sortedcompleted[i].DataSource;
                clone.getElementsByClassName('inventoryMapYear')[0].innerHTML = "Year: "+sortedcompleted[i].MapYear;
                clone.getElementsByClassName('inventoryOrganization')[0].innerHTML = "Organization: " + sortedcompleted[i].Organization;
                document.getElementById('completedarticleholder').appendChild(clone);
                foundcompleted = true;
                clones.push(clone);
                clone = null;
            }
             
           
        }
    }


    document.getElementById("numcompleted").innerHTML = completedCounter;
    document.getElementById("numplanned").innerHTML = plannedCounter;
    document.getElementById("numinprogress").innerHTML = inprogressCounter;
    document.getElementById("accordionTitle").innerHTML = which;
    if (document.getElementById("accordionTitle").innerHTML == "Democratic Congo") {
        document.getElementById("accordionTitle").style.fontSize = "15px";
    }
    else document.getElementById("accordionTitle").style.fontSize = "24px";
    document.getElementById("ctry_hidden").innerHTML = which;
    document.getElementById("ctry").innerHTML = which;
    if (!foundcompleted) {
        document.getElementById('completedarticleholder').appendChild(getNoArticleElement(which, "Completed"));
    }
    if (!foundplanned) {
        document.getElementById('plannedarticleholder').appendChild(getNoArticleElement(which, "Planned"));
    }
    if (!foundinprogress) {
        document.getElementById('inprogresssarticleholder').appendChild(getNoArticleElement(which, "InProgress"));
    }


}
var gclone;
//to set the value of drop down list when the edit(pencil) button is clicked
function setValue(obj, val) {
    if (parseInt(val) == 1) {
        for (var i = 0; i < obj.options.length; i++) {
            if (obj.options[i].text == "Completed") {
                obj.options[i].selected = true;
                return;
            }
        }
    }
    else if (parseInt(val) == 0) {
        for (var i = 0; i < obj.options.length; i++) {
            if (obj.options[i].text == "In progress") {
                obj.options[i].selected = true;
                return;
            }
        }
    }
    else if(parseInt(val)==-1)
    {
        for (var i = 0; i < obj.options.length; i++) {
            if (obj.options[i].text == "Planned") {
                obj.options[i].selected = true;
                return;
            }
        }
    }
}

//when edit(pencil) button is clicked
function editData(n) {
    setValue(document.getElementById("eg"), n);
    $('#editlink').hide();
    $('#deletelink').hide();
    $('#unapprovelink').hide();
    $('#dtable').hide();
    $('#etable').show();
}

var clones = [];
function popBox(a)
{
    alert(a);
}
function getActivitiesByType(which) {
    if (which == 13) {

    }
}
var myJson;
function addClusters1(rData) {
    myJson = rData;
}
function movepopup() {
    $('.esriPopup').css('left', '0px');
    $('.esriPopup .esriPopupWrapper').css('left', '0px');
}
function _repositionInfoWin(graphicCenterPt) {
    if ($('#ismobile').is(':visible')) {
        setTimeout('movepopup()', 250);
    }
    else {
        holdgraphicCenter = graphicCenterPt;
        // Determine the upper right, and center, coordinates of the map
        var maxPoint = new Point(map.extent.xmax, map.extent.ymax, map.spatialReference);
        var centerPoint = new Point(map.extent.getCenter());
        // Convert to screen coordinates
        var maxPointScreen = map.toScreen(maxPoint);
        var centerPointScreen = map.toScreen(centerPoint);
        var graphicPointScreen = map.toScreen(graphicCenterPt); // Points only
        // Buffer
        var marginLR = 50;
        var marginTop = 3;
        var infoWin = map.infoWindow.domNode.childNodes[0];
        var infoWidth = infoWin.clientWidth;
        var infoHeight = infoWin.clientHeight + map.infoWindow.marginTop;
        // X
        var lOff = graphicPointScreen.x - infoWidth / 2;
        var rOff = graphicPointScreen.x + infoWidth / 2;
        var l = lOff - marginLR < 0;
        var r = rOff > maxPointScreen.x - marginLR;
        if (l) {
            centerPointScreen.x -= (Math.abs(lOff) + marginLR) < marginLR ? marginLR : Math.abs(lOff) + marginLR;
        } else if (r) {
            centerPointScreen.x += (rOff - maxPointScreen.x) + marginLR;
        }
        // Y
        var yOff = map.infoWindow.offsetY;
        var tOff = graphicPointScreen.y - infoHeight - yOff;
        var t = tOff - marginTop < 0;
        if (t) {
            centerPointScreen.y += tOff - marginTop;
        }
        var b = $(window).height();
        if (tOff + 475 > b) {
            var myOffset = tOff + 475 - b;
            centerPointScreen.y += myOffset;
            centerPoint = map.toMap(centerPointScreen);
            map.centerAt(centerPoint);
        }
        //Pan the ap to the new centerpoint  
        if (r || l || t) {
            centerPoint = map.toMap(centerPointScreen);
            map.centerAt(centerPoint);
        }
    }
}
function randomizeMe(which) {
    return which * 1;
}
function toggleLayer(which) {
    if (clusterLayerArray[clusterIndexer.indexOf(which)].visible) {
        clusterLayerArray[clusterIndexer.indexOf(which)].hide();
    }
    else {
        clusterLayerArray[clusterIndexer.indexOf(which)].show();
    }

}
function toggleAccordion() {
    if (!isHidden(document.getElementById("accordionholder"))) {

        $("#accordionholder").animate({
            right: "-=310"
        }, 700, function () {
            // Animation complete.
            $("#accordionholder").hide();
        });

        $("#handle").animate({
            // marginLeft: "-=10"
        }, 700, function () {
            // Animation complete.
        });



        $("#toggleBar").animate({
            right: "-=310"
        }, 700, function () {
            // Animation complete.
            $("#handle").css({ 'background-image': 'url("../LULC_Map/images/vOpen1.png")' });
        });
    }
    else {
        $("#accordionholder").show();
        $("#toggleBar").show();
        $("#toggleBar").animate({
            right: "+=310"
        }, 700, function () {
            // Animation complete.
            $("#handle").css({ 'background-image': 'url("../LULC_Map/images/vClose1.png")' });
        });
        $("#handle").animate({
            // marginLeft: "+=10"
        }, 700, function () {
            // Animation complete.
        });
        $("#accordionholder").animate({
            right: "+=310"
        }, 700, function () {
            // Animation complete.

        });
    }
}
function isHidden(el) {
    var style = window.getComputedStyle(el);
    return (style.display === 'none')
}

//validates the phone number field
function validatePhone(fld) {
    var valid = true;
    var stripped = fld.value.replace(/[\(\)\.\-\ ]/g, '');
 if (isNaN(parseInt(stripped))) {
     valid = false;
    } else if (!(stripped.length == 10)) {
        valid = false;
    }
 return valid;
}
function removeexisting(which) {
    var completedarticleholder = document.getElementById(which);
    while (completedarticleholder.firstChild) {
        completedarticleholder.removeChild(completedarticleholder.firstChild);
    };
}
//when there is no data for a particular country
function getNoArticleElement(which, category) {
    var clone = document.getElementById('templateholder').childNodes[1].cloneNode(true);

    clone.getElementsByClassName('articlelink')[0].href = '#';
    clone.getElementsByClassName('articlelink')[0].className = clone.getElementsByClassName('articlelink')[0].className + " " + category.toLowerCase();
   
    if (category == "Completed") {
        clone.getElementsByClassName('articlelink')[0].innerHTML = "No Land Use/Land Cover maps registered for " + which + "<br style='clear:both;'>";
    }
    else if (category == "InProgress") {
        clone.getElementsByClassName('articlelink')[0].innerHTML = "No Land Use/Land Cover undergoing efforts registered for " + which + "<br style='clear:both;'>";
    }
    else clone.getElementsByClassName('articlelink')[0].innerHTML = "No Land Use/Land Cover efforts planned for " + which + "<br style='clear:both;'>";

    clone.getElementsByClassName('inventoryDataSource')[0].innerHTML = "Click the '+' button to submit new data!";
    return clone;
}