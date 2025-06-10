import { useState, useEffect } from "react";
import RiderSelector from "./RiderSelector";
import TrackSelector from "./TrackSelector";

export default function ChampionshipForm() {
  const [riders, setRiders] = useState([]);
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [championshipName, setChampionshipName] = useState("");
  const [message, setMessage] = useState("");
  const [tracks, setTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/riders")
      .then((res) => res.json())
      .then(setRiders);
      
    fetch("http://127.0.0.1:5000/api/track")
      .then((res) => res.json())
      .then(setTracks);
  }, []);

  const toggleTrack = (track) => {
    setSelectedTracks((prev) =>
      prev.find((t) => t.track_name === track.track_name)
        ? prev.filter((t) => t.track_name !== track.track_name)
        : [...prev, track]
    );
  };

  const toggleRider = (rider) => {
    setSelectedRiders((prev) =>
      prev.find((r) => r.rider_name === rider.rider_name)
        ? prev.filter((r) => r.rider_name !== rider.rider_name)
        : [...prev, rider]
    );
  };

  const handleSubmit = async () => {
    let missingFields = [];

    if (!championshipName.trim()) missingFields.push("il NOME del campionato");
    if (selectedRiders.length === 0) missingFields.push("almeno un PILOTA");
    if (selectedTracks.length === 0) missingFields.push("almeno un TRACCIATO");

    if (missingFields.length > 0) {
      const message = "Inserisci " + missingFields.join(" e ");
      setMessage(message);
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const response = await fetch("http://127.0.0.1:5000/api/create_championships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: championshipName,
        riders: selectedRiders,
        tracks: selectedTracks,
      }),
    });

    const data = await response.json();
    setMessage(data.message || "Errore");
    setTimeout(() => setMessage(""), 2000);

    if (response.ok) {
      setChampionshipName("");
      setSelectedRiders([]);
      setSelectedTracks([]);
      const successMessage = encodeURIComponent(data.message || "Campionato creato con successo!");
      window.location.href = `/?message=${successMessage}`;
    }
  };


  return (
    <div className="px-6 py-6 w-full flex flex-col justify-between relative overflow-hidden" style={{ height: 'calc(100dvh - 60px)' }}>
      <div className="flex gap-10 h-6/7">
        <div className="w-1/2 h-[95%] flex flex-col shadow-md rounded-2xl border-2 border-gray-500">
          <RiderSelector
            className="w-full h-full"
            riders={riders}
            selectedRiders={selectedRiders}
            toggleRider={toggleRider}
          />
        </div>
        
        <div className="w-1/2 h-[95%] flex flex-col shadow-md rounded-2xl border-2 border-gray-500">
          <TrackSelector
            className="w-full h-full"
            tracks={tracks}
            selectedTracks={selectedTracks}
            toggleTrack={toggleTrack}
          />
        </div>
      </div>

      <div className="flex items-center justify-between h-1/7 w-full gap-5">
        <div className="flex h-full w-5/6 shadow-md rounded-2xl border-2 gap-3 p-4 border-gray-500 bg-red-600">
          <div className="flex flex-col w-full justify-center ">
            <input
              type="text"
              placeholder="Nome campionato"
              className="border h-10 border-gray-300 bg-white rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              value={championshipName}
              onChange={(e) => setChampionshipName(e.target.value)}
            />
          </div>
        </div>
        <div className="w-1/6 h-full flex justify-center items-center">
          <button
            onClick={handleSubmit}
            className="cursor-pointer border border-gray-500 bg-black hover:bg-gray-500 text-white font-bold py-2 rounded-xl w-full h-full uppercase transition"
          >
            Crea campionato
          </button>
        </div>
      </div>
      
      

    {message && (
      <p
        className={`absolute left-1/2 top-0 transform -translate-x-1/2 mt-4 text-sm px-4 py-2 rounded shadow-md transition-all duration-300 z-50 ${
          message.toLowerCase().includes("inserisci") || message.toLowerCase().includes("errore")
            ? "text-red-700 bg-red-100 border border-red-300"
            : "text-green-700 bg-green-100 border border-green-300"
        }`}
      >
        {message}
      </p>
    )}

    </div>
  );
}
