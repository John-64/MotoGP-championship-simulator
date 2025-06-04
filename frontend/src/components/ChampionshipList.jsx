import { useEffect, useState } from "react";

function ChampionshipList() {
  const [championships, setChampionships] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/championships")
      .then(res => res.json())
      .then(data => setChampionships(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Campionati creati</h2>
      <ul className="space-y-2">
        {championships.map(ch => (
          <li key={ch.id} className="bg-white p-2 rounded shadow">
            <strong>{ch.name}</strong> <br />
            <small>{new Date(ch.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChampionshipList;
