import { useState, useEffect } from "react";
import RiderSelector from "./RiderSelector";

export default function ChampionshipForm() {
  const [riders, setRiders] = useState([]);
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [championshipName, setChampionshipName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/riders")
      .then((res) => res.json())
      .then(setRiders);
  }, []);

  const toggleRider = (rider) => {
    setSelectedRiders((prev) =>
      prev.find((r) => r.rider_name === rider.rider_name)
        ? prev.filter((r) => r.rider_name !== rider.rider_name)
        : [...prev, rider]
    );
  };

  const handleSubmit = async () => {
    if (!championshipName || selectedRiders.length === 0) {
      setMessage("Inserisci un nome e almeno un pilota.");
      return;
    }

    const response = await fetch("http://localhost:5000/api/create_championships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: championshipName,
        riders: selectedRiders,
      }),
    });

    const data = await response.json();
    setMessage(data.message || "Errore");
    if (response.ok) {
      setChampionshipName("");
      setSelectedRiders([]);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Crea Campionato</h1>

      <input
        type="text"
        placeholder="Nome campionato"
        className="border p-2 w-full mb-4"
        value={championshipName}
        onChange={(e) => setChampionshipName(e.target.value)}
      />

      <RiderSelector
        riders={riders}
        selectedRiders={selectedRiders}
        toggleRider={toggleRider}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Crea Campionato
      </button>

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
}
