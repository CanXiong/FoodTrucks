/*************************************************************/
// Global Variables
/*************************************************************/
var map;
var autocomplete;
var marker, infowindow; // Current location marker and infowindow
var markersArray = []; // global markers containers
var selectedMarkerId = -1;
var range = 1; // default search radius is 1 mile
var place; // user placed location

// used for routing
var directionsDisplay; 
var directionsService;
var travelWay = google.maps.TravelMode.DRIVING; // default is driving

/*************************************************************/
// Window Load
// Set up map, direction display, 
// and listeners for autocomplete & travel mode selections
/*************************************************************/
$(window).load(function() {
	var mapOptions = {
		center: new google.maps.LatLng(37.7577, -122.4376),
		zoom: 13
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);

	var input = /** @type {HTMLInputElement} */
	(document.getElementById('pac-input'));

	var types = document.getElementById('type-selector');
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

	autocomplete = new google.maps.places.Autocomplete(input);
	autocomplete.bindTo('bounds', map);
	//autocomplete.setTypes([]); // All includes Establishments, Addresses, Geocodes
	infowindow = new google.maps.InfoWindow({
		maxWidth: 200
	});
	marker = new google.maps.Marker({
		map: map,
		anchorPoint: new google.maps.Point(0, -29)
	});

	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		autocompleteFunc();
	});

	radioSetUps();
});

/*************************************************************/
// radio buttons setups
// Set up four radio buttons to each corresponding listener function.
/*************************************************************/
function radioSetUps() {
	setupClickListener('Car');
	setupClickListener('Transit');
	setupClickListener('Bicycle');
	setupClickListener('Walk');

	// Set a listener on each radio button for different travel modes.
	function setupClickListener(id) {
		var radioButton = document.getElementById(id);
		google.maps.event.addDomListener(radioButton, 'click', function() {
			//autocomplete.setTypes(types);
			var selectedMode = document.getElementById(id).value;
			travelWay = google.maps.TravelMode[selectedMode];
		});
	}
}

/*************************************************************/
// autocomplete function
// When autocomplete event is triggered, clean up the map view;
// set the focus to the place; display the place infowidown;
// and find nearby food trucks locations.
/*************************************************************/
function autocompleteFunc() {
	infowindow.close();
	marker.setVisible(false);
	clearMarkers();
	google.maps.event.trigger(map,'resize');
	// Clear direction display
	if (directionsDisplay != null) {
		directionsDisplay.setMap(null);
		directionsDisplay = null;
	}
	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);

	place = autocomplete.getPlace();
	if (!place.geometry) {
		window.alert("Autocomplete's returned place contains no geometry");
		return;
	}
	
	// If the place has a geometry, then present it on a map.
	if (place.geometry.viewport) {
		map.fitBounds(place.geometry.viewport);
	} else {
		map.setCenter(place.geometry.location);
		map.setZoom(15); // Why 15? Because it looks good.
	}
	marker.setIcon( /** @type {google.maps.Icon} */ ({
		url: place.icon,
		size: new google.maps.Size(71, 71),
		origin: new google.maps.Point(0, 0),
		anchor: new google.maps.Point(17, 34),
		scaledSize: new google.maps.Size(35, 35)
	}));
	marker.setPosition(place.geometry.location);
	marker.setVisible(true);

	var address = '';
	if (place.address_components) {
		address = [
		(place.address_components[0] && place.address_components[0].short_name || ''), 
		(place.address_components[1] && place.address_components[1].short_name || ''), 
		(place.address_components[2] && place.address_components[2].short_name || '')
		].join(' ');
	}
	
	// Display the user input location info window
	infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
	infowindow.open(map, marker);

	// Found food trucks around you
	setMarkers(infowindow);
}

/*************************************************************/
// range updated
// When range value changed, reset all the food trucks locations.
// similar actions to autocomplete function above.
/*************************************************************/
function rangeUpdated() {
	infowindow.close();
	marker.setVisible(false);
	clearMarkers();
	google.maps.event.trigger(map,'resize');
	// Clear direction display
	if (directionsDisplay != null) {
		directionsDisplay.setMap(null);
		directionsDisplay = null;
	}
	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);

	if (place.geometry.viewport) {
		map.fitBounds(place.geometry.viewport);
	} else {
		map.setCenter(place.geometry.location);
		map.setZoom(15);
	}
	
	marker.setPosition(place.geometry.location);
	marker.setVisible(true);

	// Display the user input location info window
	var address = '';
	if (place.address_components) {
		address = [
		(place.address_components[0] && place.address_components[0].short_name || ''), 
		(place.address_components[1] && place.address_components[1].short_name || ''), 
		(place.address_components[2] && place.address_components[2].short_name || '')
		].join(' ');
	}
	infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
	infowindow.open(map, marker);
	// Found food trucks around you
	setMarkers(infowindow);
}

/*************************************************************/
// Calculate route between the user location 
// and the selected food truck location.
/*************************************************************/
function calcRoute() {
	var start = place.geometry.location;
	var end = markersArray[selectedMarkerId].position;
	var request = {
		origin: start,
		destination: end,
		travelMode: travelWay //google.maps.TravelMode.DRIVING
	};
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
		}
	});
}

/*************************************************************/
// Set food trucks search range.
/*************************************************************/
function setRange() {
	range = document.getElementById("range").value;
	//console.log("setRange: " + range);
	rangeUpdated();
}

/*************************************************************/
// Check food truck location is within the range or not.
// By default the range is 1 miles.
/*************************************************************/
function withinRange(entry, place) {
	var p1 = new google.maps.LatLng(entry.location.latitude, entry.location.longitude);
	var p2 = place.geometry.location;
	//calculates distance between two points in miles
	var distance = 
	((google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(2)) * 0.621371;
	// console.log(distance);	
	return distance <= range;
}

/*************************************************************/
// Clear all the food trucks markers, prepared for a new search.
/*************************************************************/
function clearMarkers() {
	selectedMarkerId = -1;
	if (markersArray.length != 0) {
		for (var i = 0; i < markersArray.length; i++) {
			if (typeof markersArray[i] == 'object') {
				markersArray[i].setVisible(false);
				markersArray[i].setMap(null);
			}
		}
		markersArray.length = 0;
	}
}

/*************************************************************/
// Clear all the food trucks markers, prepared for a new search.
/*************************************************************/
function setMarkers(infowindow) {
	// Unselected pin icon is blue
	var pinIcon = new google.maps.MarkerImage(
		"images/pin-1.png", null, /* size is determined at runtime */
		null, /* origin is 0,0 */
		null, /* anchor is bottom center of the scaled image */
		new google.maps.Size(20, 30)
	);
	
	// Boolean used to check found any food trucks around you or not
	var nothingFound = true; 
	
	// Construct the catalog query string
	url = 'https://data.sfgov.org/resource/rqzj-sfat.json';
	
	// Retrieve our data and plot it
	$.getJSON(url, function(data, textstatus) {
		// console.log(data);
		var i = 0;
		$.each(data, function(i, entry) {

			if (entry != undefined && entry.location != undefined 
				&& entry.status != "EXPIRED" && withinRange(entry, place)) {
					
				nothingFound = false; // Found some food trucks around you
				
				// Format the food trucks selling items
				var items = typeof entry.fooditems == 'string' ? entry.fooditems.split(':').join(', ') : '';
				
				var start = place.geometry.location;
				var end = new google.maps.LatLng(entry.location.latitude, entry.location.longitude);

				var marker = new google.maps.Marker({
					position: end,
					animation: google.maps.Animation.DROP,
					icon: pinIcon,
					map: map,
					title: location.name,
					details: '<div><strong>' + entry.applicant + '</strong><br>' 
					+ entry.address + '<br><i>' + items + '</i><br>' 
					+ '<button style=\"background-color:#83D6FF\" onclick="calcRoute() ">Direction to here</button>'
				});
				markersArray[i++] = marker; // Add to global markers container
				
				// Each Marker's click listener for info window displaying
				google.maps.event.addListener(marker, 'click', function() {
					changeIcon(pinIcon); // Switch marker from selected to unselect
					pinIcon = new google.maps.MarkerImage(
						"images/pin-2.png", null, null, null, new google.maps.Size(22, 32) 
						);
					marker.setIcon(pinIcon);
					infowindow.setContent(this.details);
					infowindow.open(map, this);
					selectedMarkerId = i - 1; // Remember selected marker id
				});
			}
		});
		// We didn't find any food trucks around you since you may be out of SF.
		if (nothingFound == true) 
			alert("Sorry, we didn't find any food trucks around you.\
			\nOr you are outside of San Francisco.");
	});

}

/*************************************************************/
// Change Icon from selected image to unselected one.
/*************************************************************/
function changeIcon(pinIcon) {
	//console.log("changeIcon: " + selectedMarkerId);
	if (selectedMarkerId != -1) { // Selected marker id is valid
		pinIcon = new google.maps.MarkerImage("images/pin-1.png", null,
		null, /* origin is 0,0 */
		null, /* anchor is bottom center of the scaled image */
		new google.maps.Size(20, 30) //(35, 50)
		);
		markersArray[selectedMarkerId].setIcon(pinIcon);
	}
}
