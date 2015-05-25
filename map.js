var markersArray = []; // global markers containers
var selectedMarkerId = 0;

$(window).load(function() {
	var mapOptions = {
		center: new google.maps.LatLng(37.7577, -122.4376),
		zoom: 13
	};
	var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	var input = /** @type {HTMLInputElement} */
	(document.getElementById('pac-input'));

	var types = document.getElementById('type-selector');
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

	var autocomplete = new google.maps.places.Autocomplete(input);
	autocomplete.bindTo('bounds', map);

	var infowindow = new google.maps.InfoWindow({
		maxWidth: 200
	});
	var marker = new google.maps.Marker({
		map: map,
		anchorPoint: new google.maps.Point(0, -29)
	});

	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		infowindow.close();
		marker.setVisible(false);
		clearMarkers();
		
		var place = autocomplete.getPlace();
		if (!place.geometry) {
			window.alert("Autocomplete's returned place contains no geometry");
			return;
		}

		// If the place has a geometry, then present it on a map.
		if (place.geometry.viewport) {
			map.fitBounds(place.geometry.viewport);
		} else {
			map.setCenter(place.geometry.location);
			map.setZoom(14); // Why 17? Because it looks good.
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
			address = [(place.address_components[0] && place.address_components[0].short_name || ''), (place.address_components[1] && place.address_components[1].short_name || ''), (place.address_components[2] && place.address_components[2].short_name || '')].join(' ');
		}

		infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
		infowindow.open(map, marker);


		setMarkers(map, infowindow, place);
		
	});


	// Sets a listener on a radio button to change the filter type on Places
	// Autocomplete.
	function setupClickListener(id, types) {
		var radioButton = document.getElementById(id);
		google.maps.event.addDomListener(radioButton, 'click', function() {
			autocomplete.setTypes(types);
		});
	}

	setupClickListener('changetype-all', []);
	setupClickListener('changetype-address', ['address']);
	setupClickListener('changetype-establishment', ['establishment']);
	setupClickListener('changetype-geocode', ['geocode']);

});

// Check food truck location is within 20km around search location or not.
function withinRange(entry, place) {
	// console.log("entry: "+entry.location.latitude + ", " + entry.location.longitude + " --- place: " + place.geometry.location);
	var p1 = new google.maps.LatLng(entry.location.latitude, entry.location.longitude);
	var p2 = place.geometry.location;
	//calculates distance between two points in km's
	var distance = (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(2);
	
	// console.log(distance);	
	return distance <= 5;
}

function clearMarkers() {
	for(var i=0; i<markersArray.length; i++) {
		markersArray[i].setMap(null);
	}
	markersArray.length = 0;
}

function setMarkers(map, infowindow, place) {
	var pinIcon = new google.maps.MarkerImage(
	    "images/pin-1.png",
	    null, /* size is determined at runtime */
	    null, /* origin is 0,0 */
	    null, /* anchor is bottom center of the scaled image */
	    new google.maps.Size(20, 30)
	);
	
	// Construct the catalog query string
	url = 'https://data.sfgov.org/resource/rqzj-sfat.json';
	// Retrieve our data and plot it
	$.getJSON(url, function(data, textstatus) {
		console.log(data);
		var i = 0;
		$.each(data, function(i, entry) {
			if(entry.location != undefined && entry.status != "EXPIRED" && withinRange(entry, place)) {
				var items = entry.fooditems.split(':').join(', ');
				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(entry.location.latitude, entry.location.longitude),
					animation: google.maps.Animation.DROP,
					icon: pinIcon,
					map: map,
					title: location.name,
					details: '<div><strong>' + entry.applicant + '</strong><br>' + entry.address + '<br><i>' + items + '</i>'
				});
				markersArray[i++] = marker; // Add to global container for future clearance

				google.maps.event.addListener(marker, 'click', function() {
					changeIcon(pinIcon); // Switch marker from selected to unselect
					pinIcon = new google.maps.MarkerImage(
					    "images/pin-2.png",
					    null, /* size is determined at runtime */
					    null, /* origin is 0,0 */
					    null, /* anchor is bottom center of the scaled image */
					    new google.maps.Size(22, 32) //(37, 52)
					);
					marker.setIcon(pinIcon);
					infowindow.setContent(this.details);
					infowindow.open(map, this);
					selectedMarkerId = i-1; // Remember previous selected marker id
				});
			}
		});
	});
}

function changeIcon(pinIcon) {
	pinIcon = new google.maps.MarkerImage(
	    "images/pin-1.png",
	    null, /* size is determined at runtime */
	    null, /* origin is 0,0 */
	    null, /* anchor is bottom center of the scaled image */
	    new google.maps.Size(20, 30) //(35, 50)
	);
	markersArray[selectedMarkerId].setIcon(pinIcon);
}
