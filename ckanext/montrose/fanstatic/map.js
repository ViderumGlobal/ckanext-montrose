this.ckan = this.ckan || {};
this.ckan.montrose = this.ckan.montrose || {};
this.ckan.montrose.dashboardmap = this.ckan.dashboardmap || {};

(function (self, $) {

  self.init = function init(elementId, countryName, mapURL) {
    renderMap(elementId, countryName, mapURL);
  };

  function renderMap(elementId, countryName, mapURL) {
    console.log(elementId);
    console.log(countryName);
    console.log(mapURL);
    var mainField = "Company Name";
    $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(countryName)).done(function (data) {
      if (data['status'] == 'ZERO_RESULTS') {
        initLeaflet(elementId, 39, 40, 2);
      } else {
        var lat = data['results'][0]['geometry']['location']['lat'],
          lng = data['results'][0]['geometry']['location']['lng'];
        initLeaflet(elementId, lat, lng, 6);
      }
    }).fail(function (data) {
      console.log(data);
    });

    function initLeaflet(elementId, lat, lng, zoom) {
      var map = new L.Map(elementId, {scrollWheelZoom: false}).setView([lat, lng], zoom);
      var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
      var osm = new L.TileLayer(osmUrl, {
        minZoom: 2,
        maxZoom: 18,
        attribution: osmAttrib
      });

      map.addLayer(osm);

      var layers = [];

      var smallIcon = L.icon({
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
        iconRetinaUrl: '/images/marker-icon-2x.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      $.getJSON(mapURL).done(function (data) {

        var geoL = L.geoJson(data, {
          style: function (feature) {
            return feature.properties.style;
          },
          pointToLayer: function (fauture, latlng) {
            return L.marker(latlng, {
              icon: smallIcon
            });
          },
          onEachFeature: function (feature, layer) {
            var popup = document.createElement("div"),
              header = document.createElement("h5"),
              headerText = document.createTextNode(feature.properties[mainField]),
              list = document.createElement("ul"),
              listElement,
              listElementText;
            header.appendChild(headerText);
            for (var info in feature.properties) {
              listElementText = document.createTextNode(feature.properties[info]);
              listElement = document.createElement("li");
              listElement.appendChild(listElementText);
              list.appendChild(listElement);
            }
            popup.appendChild(header);
            popup.appendChild(list);
            layer.bindPopup(popup);
            layer.name = feature.properties[mainField];
            layers.push(layer);
          }
        }).addTo(map);

        //map.fitBounds(geoL.getBounds());

        map.on('popupopen', function (e) {
          var px = map.project(e.popup._latlng); // find the pixel location on the map where the popup anchor is
          px.y -= e.popup._container.clientHeight / 2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
          map.panTo(map.unproject(px), {animate: true}); // pan to new center
        });

        var select_dataset = $('#dataset');

        select_dataset.append('<option>Select Data Set</option>');
        for (var elem in layers) {
          select_dataset.append('<option>' + layers[elem].name + '</option>');
        }

        select_dataset.change(
          function datasetsClick(a) {
            var selected = $('#dataset option:selected').text();
            for (var elem in layers) {
              if (layers[elem].name == selected) {
                layers[elem].openPopup();
              }
            }
          }
        )

        $('#map-info').removeClass('hidden');


      }).fail(function (data) {
      });

    }
  }
})(this.ckan.montrose.dashboardmap, this.jQuery);