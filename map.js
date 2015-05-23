$(window).load(function() {
    // Construct the catalog query string
    url = 'https://data.sfgov.org/resource/rqzj-sfat.json';
    
    // Intialize our map
    var center = new google.maps.LatLng(37.7577,-122.4376);
    var mapOptions = {
      zoom: 12,
      center: center
    }
    var map = new google.maps.Map(document.getElementById("map"), mapOptions);
    
    // Retrieve our data and plot it
    $.getJSON(url, function(data, textstatus) {
          console.log(data);
          $.each(data, function(i, entry) {
              var marker = new google.maps.Marker({
                  position: new google.maps.LatLng(entry.location.latitude, 
                                                   entry.location.longitude),
                  map: map,
                  title: location.name
              });
          });
    });
});