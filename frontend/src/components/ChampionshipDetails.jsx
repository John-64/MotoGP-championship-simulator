import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function ChampionshipDetails() {
  const { id } = useParams();
  const [championship, setChampionship] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Caricamento...</p>;
  if (!championship) return <p>Campionato non trovato.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{championship.name}</h1>
      <p className="text-gray-600 mb-2">
        Creato il: {new Date(championship.created_at).toLocaleString()}
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Piloti partecipanti</h2>
      <ul className="list-disc list-inside">
        {championship.riders && championship.riders.length > 0 ? (
          championship.riders.map((rider, index) => (
            <li key={index}>{rider.rider_name}</li>
          ))
        ) : (
          <li>Nessun pilota assegnato</li>
        )}
      </ul>
    </div>
  );
}

export default ChampionshipDetails;
