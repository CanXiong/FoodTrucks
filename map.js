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


		setMarkers(map, infowindow);


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

function setMarkers(map, infowindow) {
	// Construct the catalog query string
	url = 'https://data.sfgov.org/resource/rqzj-sfat.json';
	// Retrieve our data and plot it
	$.getJSON(url, function(data, textstatus) {
		// console.log(data);
		$.each(data, function(i, entry) {
			var items = entry.fooditems.split(':').join(', ');
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(entry.location.latitude, entry.location.longitude),
				animation: google.maps.Animation.DROP,
				map: map,
				title: location.name,
				details: '<div><strong>' + entry.applicant + '</strong><br>' + entry.address + '<br><i>' + items + '</i>'
			});

			google.maps.event.addListener(marker, 'click', function() {
				infowindow.setContent(this.details);
				infowindow.open(map, this);
			});

		});
	});

}

