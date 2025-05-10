import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';
import markerImage from '../assets/marker.png';

const GEOAPIFY_KEY = REACT_APP_GEOAPIFY_KEY;

const AVERAGE_EV_EFFICIENCY = 0.2; // kWh per km (adjust as needed)
const CHARGING_EFFICIENCY = 0.9; // 90% charging efficiency
const GRID_EMISSION_FACTOR = 0.716; // kg CO2 per kWh (Indian grid emission factor)

const customMarker = new L.Icon({
  iconUrl: markerImage,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Standard emission factors (kg CO₂ per liter of fuel burned)
const fuelEmissionFactors = {
  petrol: 2.31,
  diesel: 2.68,
  electric: 0,      // Tailpipe emissions are zero (upstream emissions not included)
  hybrid: 1.15,
  cng: 2.75
};

// Traffic multipliers
const trafficMultipliers = {
  light: 1.0,
  moderate: 1.1,
  heavy: 1.3
};

// Valid fuel options for each vehicle type
const availableFuelTypes = {
  car: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
  bus: ['diesel', 'electric', 'cng'],
  truck: ['diesel', 'cng'],
  bike: ['petrol', 'electric'],
  scooter: ['petrol', 'electric']
};

const VEHICLE_EMISSION_FACTORS = {
  car: { petrol: 0.192, diesel: 0.171, electric: 0.053, hybrid: 0.111, cng: 0.163 }, // kg CO2 per km
  bus: { diesel: 0.067, electric: 0.035, cng: 0.058 }, // kg CO2 per passenger-km
  truck: { diesel: 0.887, cng: 0.750 }, // kg CO2 per km
  bike: { petrol: 0.103, electric: 0.026 }, // kg CO2 per km
  scooter: { petrol: 0.086, electric: 0.022 } // kg CO2 per km
};

const TRAFFIC_ADDITIONS = {
  light: 0,
  moderate: 0.02, // Additional kg CO2 per km
  heavy: 0.05 // Additional kg CO2 per km
};

const AGE_FACTOR = 0.005; // 0.5% increase in emissions per year of age

const MapPage = () => {
  const [startPlace, setStartPlace] = useState("");
  const [endPlace, setEndPlace] = useState("");
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [directions, setDirections] = useState([]);

  const [vehicleType, setVehicleType] = useState('car');
  const [fuelType, setFuelType] = useState('petrol'); // default will update based on vehicleType
  const [kmpl, setKmpl] = useState('');
  const [trafficCondition, setTrafficCondition] = useState('light');
  const [vehicleAge, setVehicleAge] = useState(5); // in years
  const [maintenanceStatus, setMaintenanceStatus] = useState('good'); // good or poor
  const [numPassengers, setNumPassengers] = useState(1);
  const [carbonEmission, setCarbonEmission] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [evRange, setEvRange] = useState('');

  const mapRef = useRef();

  // When vehicleType changes, update fuelType to first valid option
  useEffect(() => {
    const validFuels = availableFuelTypes[vehicleType];
    if (!validFuels.includes(fuelType)) {
      setFuelType(validFuels[0]);
    }
  }, [vehicleType, fuelType]);

  const fetchCoordinates = async (place, setter) => {
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${place}&apiKey=${GEOAPIFY_KEY}`
      );
      const location = response.data.features[0]?.geometry?.coordinates;
      if (location) {
        setter({ lat: location[1], lng: location[0] });
      } else {
        alert(`Could not find location: ${place}`);
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      alert('Failed to fetch coordinates. Check your input and try again.');
    }
  };

  const fetchDirections = async () => {
    if (!startLocation || !endLocation) {
      alert('Please enter valid locations for both start and end.');
      return;
    }
  
    try {
      const apiUrl = `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson`;
      const response = await axios.get(apiUrl);
      const data = response.data.routes[0];
  
      const routeCoords = data.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setRoute(routeCoords);
  
      const kmDistance = data.distance / 1000;
      setDistance(kmDistance.toFixed(2));
      setTravelTime((data.duration / 60).toFixed(1));
  
      const directionsList = data.legs[0].steps.map((step, index) => ({
        index: index + 1,
        instruction: step.maneuver.instruction,
        distance: (step.distance / 1000).toFixed(2),
      }));
      setDirections(directionsList);
  
      // Emissions calculation
      let emission = 0;
      const emissionFactor = VEHICLE_EMISSION_FACTORS[vehicleType][fuelType];
      
      if (vehicleType === 'bus') {
        emission = kmDistance * emissionFactor * numPassengers;
      } else {
        emission = kmDistance * emissionFactor;
      }

      // Apply traffic condition
      emission += kmDistance * TRAFFIC_ADDITIONS[trafficCondition];

      // Apply age factor
      emission *= (1 + (vehicleAge * AGE_FACTOR));

      setCarbonEmission(emission);
  
      // Send data to backend
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        
        // Check if user exists and has email
        if (!user || !user.email) {
          console.warn("User info not found in localStorage.");
          return; // Stop execution if user info is missing
        }
        
        console.log(user.email);
        
        // Proceed with the API call only if user object is valid
        const response = await axios.post('http://localhost:5000/api/emissions/save', {
          email: user.email,
          vehicleType,
          fuelType,
          distance: kmDistance,
          travelTime: data.duration / 60,
          carbonEmission: emission,
        });
        
        console.log('Data sent successfully:', response.data);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      alert('Error calculating route. Please try again.');
    }
  };
  

  const reset = () => {
    setStartPlace("");
    setEndPlace("");
    setStartLocation(null);
    setEndLocation(null);
    setRoute([]);
    setDistance(null);
    setTravelTime(null);
    setCarbonEmission(null);
    setKmpl('');
    setNumPassengers(1);
    setDirections([]);
    setEvRange('');
  };

  const tileURL =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="map-page-container scrollable-page">
      <h2>Carbon Emission Estimator</h2>

      <div className="vehicle-select">
        <div className="form-row">
          <div className="form-item">
            <label>Vehicle Type:</label>
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              <option value="car">Car</option>
              <option value="truck">Truck</option>
              <option value="bike">Bike</option>
              <option value="scooter">Scooter</option>
            </select>
          </div>

          <div className="form-item">
            <label>Fuel Type:</label>
            <select value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
              {availableFuelTypes[vehicleType].map((fuel) => (
                <option key={fuel} value={fuel}>{fuel.charAt(0).toUpperCase() + fuel.slice(1)}</option>
              ))}
            </select>
          </div>

          {fuelType === 'electric' && (
            <div className="form-item">
              <label>EV Range (km):</label>
              <input
                type="number"
                placeholder="e.g., 400"
                value={evRange}
                onChange={(e) => setEvRange(e.target.value)}
                min="1"
              />
            </div>
          )}

          <div className="form-item">
            <label>km per Liter:</label>
            <input
              type="number"
              placeholder="e.g., 15"
              value={kmpl}
              onChange={(e) => setKmpl(e.target.value)}
              min="1"
            />
          </div>

          <div className="form-item">
            <label>Traffic Condition:</label>
            <select value={trafficCondition} onChange={(e) => setTrafficCondition(e.target.value)}>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>

          <div className="form-item">
            <label>Vehicle Age (years):</label>
            <input
              type="number"
              value={vehicleAge}
              onChange={(e) => setVehicleAge(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div className="form-item">
            <label>Maintenance Status:</label>
            <select value={maintenanceStatus} onChange={(e) => setMaintenanceStatus(e.target.value)}>
              <option value="good">Good</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div className="form-item">
            <label>Number of Passengers:</label>
            <input
              type="number"
              value={numPassengers}
              onChange={(e) => setNumPassengers(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>

          <div className="form-item">
            <label>Map Theme:</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="form-item">
            <button onClick={reset} className="reset-btn">Reset</button>
          </div>
        </div>
      </div>

      <div className="location-inputs">
        <label>Start Location:</label>
        <input
          type="text"
          placeholder="Enter place name"
          value={startPlace}
          onChange={(e) => setStartPlace(e.target.value)}
        />
        <button onClick={() => fetchCoordinates(startPlace, setStartLocation)}>Search</button>

        <label>End Location:</label>
        <input
          type="text"
          placeholder="Enter place name"
          value={endPlace}
          onChange={(e) => setEndPlace(e.target.value)}
        />
        <button onClick={() => fetchCoordinates(endPlace, setEndLocation)}>Search</button>

        <button onClick={fetchDirections} className="submit-btn">Submit</button>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '70vh', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer url={tileURL} />
          {startLocation && (
            <Marker position={startLocation} icon={customMarker}>
              <Popup>Start Location</Popup>
            </Marker>
          )}
          {endLocation && (
            <Marker position={endLocation} icon={customMarker}>
              <Popup>End Location</Popup>
            </Marker>
          )}
          {route.length > 0 && <Polyline positions={route} color="lime" />}
        </MapContainer>
      </div>

      {distance && (
        <div className="result">
          <p><strong>Distance:</strong> {distance} km</p>
          <p><strong>Estimated Travel Time:</strong> {travelTime} mins</p>
          <p><strong>Total Carbon Emission:</strong> {carbonEmission ? carbonEmission.toFixed(2) : 0} kg CO₂</p>
          <p><strong>Per Person Emission:</strong> {carbonEmission ? (carbonEmission / numPassengers).toFixed(2) : 0} kg CO₂</p>
          {fuelType === 'electric' && (
            <p><strong>Estimated Energy Consumption:</strong> {(carbonEmission / GRID_EMISSION_FACTOR).toFixed(2)} kWh</p>
          )}
        </div>
      )}

      {directions.length > 0 && (
        <div className="directions">
          <h3>Directions:</h3>
          <ul>
            {directions.map((dir) => (
              <li key={dir.index}>
                <strong>{dir.index}:</strong> {dir.instruction} ({dir.distance} km)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MapPage;
