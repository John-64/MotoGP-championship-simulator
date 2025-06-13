import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ChampionshipList() {
  const [championships, setChampionships] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
  fetch("http://127.0.0.1:5000/api/championship_list")
    .then(res => {
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const priority = {
        finished: 0,
        racing: 1,
        beginning: 2
      };

      const sorted = data.sort((a, b) => {
        const stateDiff = priority[a.state] - priority[b.state];
        return stateDiff;
      });

      setChampionships(sorted);
    })
    .catch(err => {
      console.error("Errore nel fetch:", err);
    });
}, []);

  const goToDetails = (id) => {
    navigate(`/championship/${id}`);
  };

  const stateBadgeStyle = {
    beginning: "bg-gray-500 text-white",
    racing: "bg-red-700 text-white",
    finished: "bg-black text-white",
  };

  return (
    <div>
      <h2 className="bg-black text-white py-3 text-xl font-semibold uppercase text-center mb-4 border-t border-white">Lista campionati</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5">
        {championships.map(ch => (
            <li
                key={ch.id}
                onClick={() => goToDetails(ch.id)}
                className="relative bg-white rounded-xl shadow p-4 cursor-pointer transition hover:scale-102"
            >
                <span className={`absolute uppercase top-0 right-0 text-xs px-2 py-1 rounded-tr-lg ${stateBadgeStyle[ch.state] || "bg-gray-100 text-gray-800"}`}>
                    {ch.state}
                </span>
                <div>
                    <h3 className="text-lg font-bold mt-1">{ch.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>Piloti: {ch.riders.length}</span>
                        <span>Circuiti: {ch.tracks.length}</span>
                        <span>Gare: {ch.races.length}</span>
                    </div>
                </div>
            </li>
        ))}
      </ul>
    </div>
  );
}

export default ChampionshipList;