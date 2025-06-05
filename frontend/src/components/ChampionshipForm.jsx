import { useState, useEffect } from "react";
import RiderSelector from "./RiderSelector";
import TrackSelector from "./TrackSelector";

export default function ChampionshipForm() {
  const [riders, setRiders] = useState([]);
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [championshipName, setChampionshipName] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tracks, setTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/riders")
      .then((res) => res.json())
      .then(setRiders);

    fetch("http://localhost:5000/api/tracks")
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
    if (!championshipName.trim() || selectedRiders.length === 0 || selectedTracks.length === 0) {
      setMessage("Inserisci un nome, almeno un pilota e un tracciato.");
      return;
    }

    const response = await fetch("http://localhost:5000/api/create_championships", {
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
    if (response.ok) {
      setChampionshipName("");
      setSelectedRiders([]);
      setSearchTerm("");
    }
  };

  const filteredRiders = riders.filter(r =>
    r.rider_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto h-full p-6 w-full">
      <h1 className="text-3xl font-extrabold mb-6 text-center">Crea campionato</h1>

      <input
        type="text"
        placeholder="Nome campionato"
        className="border border-gray-300 rounded p-3 w-full mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        value={championshipName}
        onChange={(e) => setChampionshipName(e.target.value)}
      />

      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Cerca piloti..."
          className="border border-gray-300 rounded p-2 w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="text-sm text-gray-600 font-semibold">
          Selezionati: {selectedRiders.length}
        </span>
      </div>

      <RiderSelector
        riders={filteredRiders}
        selectedRiders={selectedRiders}
        toggleRider={toggleRider}
      />

      <TrackSelector
        tracks={tracks}
        selectedTracks={selectedTracks}
        toggleTrack={toggleTrack}
      />

      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded w-full transition"
      >
        Crea campionato
      </button>

      {message && (
        <p className={`mt-4 text-center text-sm ${message.includes("Errore") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
