import React, { useState, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import Toolbar from './Toolbar'

mapboxgl.accessToken =
  'pk.eyJ1IjoibWF0dGhpYXNmZWlzdCIsImEiOiJjazlyZXhsZDkwYWxpM2ZwaTV2MnhocmRhIn0.FQOZrtblFW6JetlBINX2LA'

function Map() {
  const [map, setMap] = useState(null)
  const [problemToShow, setProblemToShow] = useState('maxspeed')

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      zoom: 6,
      center: [17.93, 64.88],
      hash: true,
      maxZoom: 16,
      minZoom: 6,
    })
    setMap(map)

    map.on('load', () => {
      map.addSource('tiles', {
        type: 'vector',
        minzoom: 6,
        maxzoom: 15,
        tiles: [
          'https://nvdb-osm-map-data.s3.eu-north-1.amazonaws.com/tiles/pbf/{z}/{x}/{y}.pbf',
          //'http://localhost:5000/tiles/pbf/{z}/{x}/{y}.pbf',
        ],
      })
      map.addLayer({
        id: 'problems',
        type: 'fill',
        source: 'tiles',
        'source-layer': 'problems',
        paint: {
          'fill-color': '#EF4444',
          'fill-opacity': 0.5,
        },
        filter: ['==', 'maxspeed', true],
      })
      map.addLayer({
        id: 'nvdb',
        type: 'line',
        source: 'tiles',
        'source-layer': 'nvdb',
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': '#0891B2',
          'line-width': 2,
        },
      })
      map.addLayer({
        id: 'foot-cycle',
        type: 'line',
        source: 'tiles',
        'source-layer': 'footcycle',
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': '#0891B2',
          'line-width': 1,
          'line-dasharray': [3, 3],
        },
      })
      map.addLayer({
        id: 'labels',
        type: 'symbol',
        source: 'tiles',
        'source-layer': 'nvdb',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': '{maxspeed}',
          'text-size': 14,
        },
        paint: {
          'text-color': '#0891B2',
          'text-halo-color': '#F0FDF4',
          'text-halo-width': 2,
        },
      })
    })
    // Clean up on unmount
    return () => map.remove()
  }, [])

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) {
      return
    }

    if (problemToShow === 'missingMajorRoad') {
      map.setLayoutProperty('labels', 'text-field', '{highway}')
    } else {
      map.setLayoutProperty('labels', 'text-field', '{' + problemToShow + '}')
    }
    map.setFilter('problems', ['==', problemToShow, true])
  }, [problemToShow])

  return (
    <div>
      <Toolbar
        problemToShow={problemToShow}
        setProblemToShow={setProblemToShow}
      />
      <div
        id="map"
        className="border border-gray-300 mb-2"
        style={{ width: '100%', height: 600 }}
      >
        map
      </div>
    </div>
  )
}

export default Map
