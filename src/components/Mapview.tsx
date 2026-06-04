import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";

type Stop = {
  lat: number;
  lng: number;
  address: string;
  bags: number;
};

type DriverLocation = {
  lat: number;
  lng: number;
} | null;

type Props = {
  stops: Stop[];
  currentStopIndex: number;
  driverLocation: DriverLocation;
};

function Routing({
  stops,
}: {
  stops: Stop[];
}) {
  const map = useMap();

  useEffect(() => {
    if (stops.length < 2) return;

    const routingControl = (L as any).Routing.control({
      waypoints: stops.map((stop) =>
        L.latLng(stop.lat, stop.lng)
      ),

      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,

      createMarker: () => null,
    }).addTo(map);

    const container =
      routingControl.getContainer?.();

    if (container) {
      container.style.display = "none";
    }

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, stops]);

  return null;
}

function FitBounds({
  stops,
}: {
  stops: Stop[];
}) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) return;

    const bounds = L.latLngBounds(
      stops.map((stop) => [
        stop.lat,
        stop.lng,
      ])
    );

    map.fitBounds(bounds, {
      padding: [50, 50],
    });
  }, [map, stops]);

  return null;
}

const depotIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const currentIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const futureIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const driverIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapView({
  stops,
  currentStopIndex,
  driverLocation,
}: Props) {
  const center =
    stops.length > 0
      ? [stops[0].lat, stops[0].lng]
      : [39.2304, -77.2794];

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={12}
      style={{
        height: "600px",
        width: "100%",
      }}
    >
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Routing stops={stops} />

      <FitBounds stops={stops} />

      {driverLocation && (
        <Marker
          position={[
            driverLocation.lat,
            driverLocation.lng,
          ]}
          icon={driverIcon}
        >
          <Popup>
            Driver Location
          </Popup>
        </Marker>
      )}

      {stops.map((stop, index) => {
        let icon = futureIcon;

        if (index === 0) {
          icon = depotIcon;
        } else if (
          index < currentStopIndex
        ) {
          icon = depotIcon;
        } else if (
          index === currentStopIndex
        ) {
          icon = currentIcon;
        }

        return (
          <Marker
            key={index}
            position={[
              stop.lat,
              stop.lng,
            ]}
            icon={icon}
          >
            <Popup>
              <b>
                {index === 0
                  ? "Depot"
                  : `Stop ${index}`}
              </b>

              <br />

              {stop.address}

              <br />

              {stop.bags} bags
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}