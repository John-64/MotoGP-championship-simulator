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
  const [errors, setErrors] = useState({ name: false, riders: false, tracks: false });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadingError(null);
      
      try {
        // Esegui entrambe le chiamate in parallelo
        const [ridersResponse, tracksResponse] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/rider"),
          fetch("http://127.0.0.1:5000/api/track")
        ]);

        if (!ridersResponse.ok || !tracksResponse.ok) {
          throw new Error("Errore nel caricamento dei dati");
        }

        const [ridersData, tracksData] = await Promise.all([
          ridersResponse.json(),
          tracksResponse.json()
        ]);

        setRiders(ridersData);
        setTracks(tracksData);
      } catch (error) {
        console.error("Errore nel caricamento:", error);
        setLoadingError("Errore nel caricamento dei dati. Riprova.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleTrack = (track) => {
    setSelectedTracks((prev) =>
      prev.find((t) => t.track_name === track.track_name)
        ? prev.filter((t) => t.track_name !== track.track_name)
        : [...prev, track]
    );
  };

  const toggleRider = (rider) => {
    setSelectedRiders(prev =>
      prev.some(r => r.rider_id === rider.rider_id)
        ? prev.filter(r => r.rider_id !== rider.rider_id)
        : [...prev, rider]
    );
  };

  const validateForm = () => {
    const newErrors = {
      name: !championshipName.trim(),
      riders: selectedRiders.length === 0,
      tracks: selectedTracks.length === 0,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const response = await fetch("http://127.0.0.1:5000/api/create_championship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: championshipName,
        riders: selectedRiders.map(r => r.rider_id),
        tracks: selectedTracks.map(t => t.track_id),
      }),
    });

    const data = await response.json();
    setMessage(data.message || "Errore");
    setTimeout(() => setMessage(""), 2000);

    if (response.ok) {
      setChampionshipName("");
      setSelectedRiders([]);
      setSelectedTracks([]);
      setErrors({ name: false, riders: false, tracks: false });
      const successMessage = encodeURIComponent(data.message || "Campionato creato con successo!");
      window.location.href = `/?message=${successMessage}`;
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Schermata di caricamento
  if (isLoading) {
    return (
      <div className="px-6 py-6 w-full flex items-center justify-center" style={{ height: 'calc(100dvh - 60px)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
          <p className="text-lg font-medium text-gray-700">Caricamento dati...</p>
          <p className="text-sm text-gray-500">Caricamento piloti e circuiti</p>
        </div>
      </div>
    );
  }

  // Schermata di errore
  if (loadingError) {
    return (
      <div className="px-6 py-6 w-full flex items-center justify-center" style={{ height: 'calc(100dvh - 60px)' }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-6xl text-red-500">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800">Errore di caricamento</h2>
          <p className="text-gray-600">{loadingError}</p>
          <button
            onClick={handleRetry}
            className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-6 py-2 w-full flex flex-col justify-between relative overflow-hidden" style={{ height: 'calc(100dvh - 60px)' }}>
      <div className="flex items-center justify-between h-[3rem] w-full mb-4 mt-1 border-2 rounded-2xl">
        <input
          type="text"
          placeholder="Nome campionato"
          className={` h-10 rounded-l-xl p-3 w-full transition bg-white focus:outline-none focus:ring-2 ${
            errors.name ? "border-red-500 ring-red-300" : "border-gray-300 focus:ring-gray-400"}`}
          value={championshipName}
          onChange={(e) => setChampionshipName(e.target.value)}
        />
        <div className="h-10 flex justify-center items-center">
          <button
            onClick={handleSubmit}
            className="cursor-pointer bg-red-600 hover:bg-red-800 text-white font-semibold py-2 px-2 rounded-r-xl w-auto text-nowrap h-full uppercase transition"
          >
            Crea campionato
          </button>
        </div>
      </div>

      <div className="flex gap-10 h-[calc(100%-3rem)]">
        <div className={`w-1/2 h-[95%] flex flex-col shadow-md rounded-2xl border-2 ${errors.riders ? "border-red-600" : "border-gray-500"}`}>
          <RiderSelector
            className="w-full h-full"
            riders={riders}
            selectedRiders={selectedRiders}
            toggleRider={toggleRider}
          />
        </div>

        
        <div className={`w-1/2 h-[95%] flex flex-col shadow-md rounded-2xl border-2 ${errors.tracks ? "border-red-600" : "border-gray-500"}`}>
          <TrackSelector
            className="w-full h-full"
            tracks={tracks}
            selectedTracks={selectedTracks}
            toggleTrack={toggleTrack}
          />
        </div>
      </div>
      
      {message && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg border text-sm flex items-center gap-3 transition-all duration-500 z-50
            ${
              message.toLowerCase().includes("inserisci") || message.toLowerCase().includes("errore")
                ? "bg-red-50 text-red-700 border-red-300"
                : "bg-green-50 text-green-700 border-green-300"
            }
          `}
        >
          <span className="text-xl">
            {message.toLowerCase().includes("inserisci") || message.toLowerCase().includes("errore") ? "⚠️" : "✅"}
          </span>
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  );
}