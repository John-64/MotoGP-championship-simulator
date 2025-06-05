import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ChampionshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [championship, setChampionship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Sei sicuro di voler eliminare questo campionato?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/championships/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        navigate("/", { state: { message: "Campionato eliminato con successo." } });
      } else {
        setMessage(data.error || "Errore durante l'eliminazione.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Errore di rete.");
    }
  };

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/championships/${id}`)
      .then(res => res.json())
      .then(data => {
        setChampionship(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Errore durante il fetch:", err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) return <p className="text-center text-gray-600 mt-10">Caricamento...</p>;
  if (!championship) return <p className="text-center text-red-500 mt-10">Campionato non trovato.</p>;

  const stateBadgeStyle = {
    beginning: "bg-gray-500 text-white",
    racing: "bg-red-700 text-white",
    finished: "bg-black text-white",
  };

  return (
    <div className="p-6 relative w-full mx-auto space-y-8">
      <div className="relative">
        <span
          className={`absolute top-0 right-0 px-3 py-1 rounded-full text-sm font-semibold shadow ${stateBadgeStyle[championship.state] || "bg-gray-100 text-gray-800"}`}
        >
          {championship.state.replace("_", " ").toUpperCase()}
        </span>

        <h1 className="text-4xl font-extrabold text-gray-900">{championship.name}</h1>
        <p className="text-sm uppercase text-gray-500 mt-2">
          Creato il:{" "}
          <time dateTime={championship.created_at}>
            {new Date(championship.created_at).toLocaleString("it-IT")}
          </time>
        </p>
      </div>

      <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Piloti</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700 max-h-48 overflow-y-auto">
          {championship.riders?.length > 0 ? (
            championship.riders.map((rider, index) => (
              <li key={index}>{rider.rider_name}</li>
            ))
          ) : (
            <li className="italic text-gray-400">Nessun pilota assegnato</li>
          )}
        </ul>
      </section>

      <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Circuiti</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700 max-h-48 overflow-y-auto">
          {championship.tracks?.length > 0 ? (
            championship.tracks.map((track, index) => (
              <li key={index}>{track.track_name}</li>
            ))
          ) : (
            <li className="italic text-gray-400">Nessun tracciato assegnato</li>
          )}
        </ul>
      </section>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(id);
        }}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white cursor-pointer font-semibold rounded-lg shadow hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-400 transition-all duration-200 ease-in-out"
        aria-label="Elimina campionato"
        type="button"
      >
        <span className="material-symbols-outlined">delete</span>
        Elimina Campionato
      </button>

      {message && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-2 rounded-lg shadow-lg text-sm">
          {message}
        </div>
      )}
    </div>
  );
}

export default ChampionshipDetails;