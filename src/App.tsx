import { useState, useEffect } from "react";
import MapView from "./components/Mapview";
import { geocodeAddress } from "./components/Geocoder";
import { optimizeRoute } from "./components/RouteOptimizer";
import { getDistance } from "geolib";

type Stop = {
  lat: number;
  lng: number;
  address: string;
  bags: number;
  completedAt?: string;
};

function App() {
  const [depot, setDepot] = useState("");
  const [capacity, setCapacity] = useState(50);
  const [orders, setOrders] = useState("");
  const [results, setResults] = useState("");

  const [stops, setStops] = useState<Stop[]>([]);
  const [completedStops, setCompletedStops] = useState<Stop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(1);

  const [totalBags, setTotalBags] = useState(0);
  const [tripCount, setTripCount] = useState(0);

  const [driverLocation, setDriverLocation] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error(error);
        },
        {
          enableHighAccuracy: true,
        }
      );

    return () =>
      navigator.geolocation.clearWatch(
        watchId
      );
  }, []);

  const generateRoutes = async () => {
    const lines = orders
      .split("\n")
      .filter((line) => line.trim() !== "");

    const parsedStops: Stop[] = [];

    let output = "";
    let currentLoad = 0;
    let tripNumber = 1;
    let total = 0;

    output += `Trip ${tripNumber}\n`;

    if (depot.trim()) {
      const depotLocation =
        await geocodeAddress(depot);

      if (depotLocation) {
        parsedStops.push({
          lat: depotLocation.lat,
          lng: depotLocation.lon,
          address: depot,
          bags: 0,
        });
      }
    }

    for (const line of lines) {
      const parts = line.split(",");

      if (parts.length < 2) continue;

      const address = parts[0].trim();
      const bags = parseInt(parts[1]);

      if (isNaN(bags)) continue;

      total += bags;

      if (
        currentLoad + bags >
        capacity
      ) {
        tripNumber++;

        output += `\n\nTrip ${tripNumber}\n`;

        currentLoad = 0;
      }

      currentLoad += bags;

      output += `${address} (${bags} bags)\n`;

      const location =
        await geocodeAddress(address);

      if (location) {
        parsedStops.push({
          lat: location.lat,
          lng: location.lon,
          address,
          bags,
        });
      }
    }

    const optimized =
      optimizeRoute(parsedStops);

    setStops(optimized);
    setResults(output);
    setTotalBags(total);
    setTripCount(tripNumber);

    setCompletedStops([]);
    setCurrentStopIndex(1);
  };

  const completeDelivery = () => {
    if (currentStopIndex >= stops.length) {
      return;
    }

    const completed = {
      ...stops[currentStopIndex],
      completedAt:
        new Date().toLocaleTimeString(),
    };

    setCompletedStops([
      ...completedStops,
      completed,
    ]);

    setCurrentStopIndex(
      currentStopIndex + 1
    );
  };

  const currentStop =
    currentStopIndex < stops.length
      ? stops[currentStopIndex]
      : null;

  const distanceToStop =
    driverLocation && currentStop
      ? getDistance(
          {
            latitude:
              driverLocation.lat,
            longitude:
              driverLocation.lng,
          },
          {
            latitude:
              currentStop.lat,
            longitude:
              currentStop.lng,
          }
        )
      : null;

  const etaMinutes =
    distanceToStop !== null
      ? Math.max(
          1,
          Math.round(
            distanceToStop / 800
          )
        )
      : null;

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <h1>🌱 Mulch Route Planner</h1>

      <h2>Coordinator Dashboard</h2>

      <input
        type="text"
        value={depot}
        onChange={(e) =>
          setDepot(e.target.value)
        }
        placeholder="Depot Address"
        style={{
          width: "100%",
          padding: "10px",
        }}
      />

      <br />
      <br />

      <input
        type="number"
        value={capacity}
        onChange={(e) =>
          setCapacity(
            Number(e.target.value)
          )
        }
        placeholder="Truck Capacity"
        style={{
          width: "250px",
          padding: "10px",
        }}
      />

      <br />
      <br />

      <textarea
        value={orders}
        onChange={(e) =>
          setOrders(e.target.value)
        }
        placeholder={`22705 Clarksburg Rd,15
12800 Snowden Farm Pkwy,20
23200 Stringtown Rd,10`}
        style={{
          width: "100%",
          height: "180px",
          padding: "10px",
        }}
      />

      <br />
      <br />

      <button
        onClick={generateRoutes}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Generate Routes
      </button>

      <h2>Summary</h2>

      <p>
        <b>Total Deliveries:</b>{" "}
        {stops.length > 0
          ? stops.length - 1
          : 0}
      </p>

      <p>
        <b>Total Bags:</b> {totalBags}
      </p>

      <p>
        <b>Total Trips:</b> {tripCount}
      </p>

      <p>
        <b>Truck Capacity:</b>{" "}
        {capacity}
      </p>

      <h2>Generated Trips</h2>

      <pre>{results}</pre>

      <h2>Delivery Map</h2>

      <MapView
        stops={stops}
        currentStopIndex={
          currentStopIndex
        }
        driverLocation={
          driverLocation
        }
      />

      <hr />

      <h2>🚚 Driver Dashboard</h2>

      {driverLocation && (
        <p>
          <b>Your Location:</b>
          <br />
          {driverLocation.lat.toFixed(5)},
          {" "}
          {driverLocation.lng.toFixed(5)}
        </p>
      )}

      {currentStop ? (
        <>
          <p>
            <b>Current Stop:</b>
            <br />
            {currentStop.address}
          </p>

          {distanceToStop !== null && (
            <>
              <p>
                <b>Distance:</b>{" "}
                {(distanceToStop / 1609).toFixed(
                  2
                )}{" "}
                miles
              </p>

              <p>
                <b>ETA:</b>{" "}
                {etaMinutes} min
              </p>
            </>
          )}

          <p>
            <b>Bags:</b>{" "}
            {currentStop.bags}
          </p>

          <p>
            <b>Stops Remaining:</b>{" "}
            {stops.length -
              currentStopIndex}
          </p>

          <button
            onClick={
              completeDelivery
            }
            style={{
              padding:
                "12px 24px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Complete Delivery
          </button>
        </>
      ) : (
        <>
          <h3>
            ✅ Route Complete
          </h3>

          <p>
            Deliveries Completed:{" "}
            {
              completedStops.length
            }
          </p>

          <p>
            Total Bags Delivered:{" "}
            {totalBags}
          </p>

          <p>
            Trips Required:{" "}
            {tripCount}
          </p>
        </>
      )}

      <h3>
        Completed Deliveries
      </h3>

      <ul>
        {completedStops.map(
          (stop, index) => (
            <li key={index}>
              ✓ {stop.address} (
              {stop.bags} bags)
              <br />
              Completed:{" "}
              {stop.completedAt}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export default App;