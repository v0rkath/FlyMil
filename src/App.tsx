import "./App.css";

import { LatLngExpression } from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { Link } from "react-router-dom";

import { AircraftMarker } from "./components/AircraftMarker";
import { FilterForm } from "./components/FilterForm.tsx";
import { InfoBar } from "./components/InfoBar.tsx";
import { useCountryFilter } from "./hooks/useCountryFilter.ts";
import { AircraftDetails, API } from "./types/api_response";
import { IdentifyCountry } from "./utils/identification.ts";

function App() {
  const position: LatLngExpression = [51.505, -0.09];

  const minutes = 15;

  const [currAC, setCurrAC] = useState<AircraftDetails | null>(null);
  const { country } = useCountryFilter();

  const { data, error } = useQuery({
    queryKey: ["aircraftData"],
    queryFn: fetchAPI,
    staleTime: minutes * 60000,
    refetchInterval: minutes * 60000,
  });

  if (error) return <p>An error has occurred: ${error.message}</p>;

  return (
    <main className="font-inter flex h-full flex-col">
      <nav className="max-w- flex items-center justify-between border-1 border-b-gray-300 p-4 shadow-lg">
        <Link
          to="/"
          className="text-2xl font-black tracking-wide text-[#4f39a2]"
        >
          FLYMIL
        </Link>
        <FilterForm data={data} />
      </nav>
      <div id="leaflet-map">
        <MapContainer
          center={position}
          zoom={4}
          minZoom={3}
          maxZoom={13}
          maxBounds={[
            [-180, -180],
            [180, 180],
          ]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap={true}
            bounds={[
              [-180, -180],
              [180, 180],
            ]}
          />

          {data?.ac
            .filter((aircraft) => {
              if (country) {
                return IdentifyCountry(aircraft.hex).code === country;
              }
              return true;
            })
            .map((ac) => {
              return (
                <AircraftMarker
                  key={ac.hex}
                  aircraft={ac}
                  setCurrAC={setCurrAC}
                />
              );
            }) || null}

          {currAC && <InfoBar aircraft={currAC} />}
        </MapContainer>
      </div>
    </main>
  );
}

async function fetchAPI(): Promise<API> {
  const apiKey = import.meta.env.VITE_API_KEY;
  const url = "https://adsbexchange-com1.p.rapidapi.com/v2/mil/";
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "adsbexchange-com1.p.rapidapi.com",
    },
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  return response.json();
}

export default App;
