<style>
  #map {
    width: 100%;
    height: 100%;
  }

  #map:before {
    box-shadow: 20px 0 10px -10px rgba(0, 0, 0, 0.15) inset;
    content: '';
    height: 100%;
    left: 0;
    position: absolute;
    width: 20px;
    z-index: 1000;
  }
</style>

<script>
  import { onMount, onDestroy } from 'svelte'
  import mapboxgl from 'mapbox-gl/dist/mapbox-gl'
  import { activeListItem, activeMapItem } from '/src/store/mapgl-store'
  import { accessToken, listItems } from '/src/helpers/consts'

  let mapRef
  export let listItemsX

  console.log(listItemsX, '_vs', listItems)

  function generateFeature({ title, imageUrl: image, coordinates }, index) {
    return {
      type: 'Feature',
      properties: {
       description: `<img width="100%" src="${image}"/><b>${title}</b>`,
      //  description: `<b>${title}</b>`,
        id: index
      },
      geometry: {
        type: 'Point',
        coordinates
      }
    };
  }

  onMount(async () => {
    mapboxgl.accessToken = accessToken;

    // Create the map
    mapRef = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10?optimize=true',
      center: [ '10.526340', '52.269112' ],
      // center: listItemsX[0].coordinates,
      zoom: 11
    });

    mapRef.on('load', function() {
      // Add markers to map
      mapRef.addLayer({
        id: 'places',
        type: 'symbol',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: listItemsX.map(generateFeature)
          }
        },
        layout: {
          'icon-image': 'suitcase-11',
          'icon-size': 2,
          'icon-allow-overlap': true
        }
      });

      // When clicking on a map marker
      mapRef.on('click', 'places', function({ features }) {
        const match = features[0];
        const coordinates = match.geometry.coordinates.slice();

        // Show popup
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(match.properties.description)
          .addTo(mapRef);

        // Set new active list item
        activeListItem.set(match.properties.id);
      });

      // Change the cursor to a pointer when the mouse is over the places layer.
      mapRef.on('mouseenter', 'places', function() {
        mapRef.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      mapRef.on('mouseleave', 'places', function() {
        mapRef.getCanvas().style.cursor = '';
      });
    });
  });

  // Update map center when active list item is updated via list
  const unsubscribeActiveMapItem = activeMapItem.subscribe(newActiveMapItem => {
    if (mapRef) {
      mapRef.flyTo({
        center: listItemsX[newActiveMapItem].coordinates
      });
    }
  });

  // Remove listener on unmount
  onDestroy(unsubscribeActiveMapItem);
</script>

<div id="map"></div>
