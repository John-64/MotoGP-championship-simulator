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
    }
  };


  return (
    <div className="h-full px-6 pt-6 w-full relative">
      <label className="text-sm text-gray-600 font-semibold mb-2">Nome campionato</label>
      <input
        type="text"
        placeholder="Nome campionato"
        className="border border-gray-300 bg-white rounded p-3 w-full mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        value={championshipName}
        onChange={(e) => setChampionshipName(e.target.value)}
      />

      

      <div className="flex gap-3">
        <div className="w-1/2 flex flex-col items-center justify-between shadow-md rounded-2xl px-2">

          <RiderSelector
            className="w-full h-96"
            riders={riders}
            selectedRiders={selectedRiders}
            toggleRider={toggleRider}
          />
        </div>
        
        <div className="w-1/2 flex flex-col items-center justify-between shadow-md rounded-2xl px-2">
          <TrackSelector
            className="w-full h-96"
            tracks={tracks}
            selectedTracks={selectedTracks}
            toggleTrack={toggleTrack}
          />
        </div>
      </div>
      

      <div className="flex flex-col items-center">
        <button
          onClick={handleSubmit}
          className="mt-6 cursor-pointer bg-black hover:bg-red-900 text-white font-bold py-3 rounded-full w-1/4 transition"
        >
          Crea campionato
        </button>
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
