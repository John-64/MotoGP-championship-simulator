import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ChampionshipList() {
  const [championships, setChampionships] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/championships")
      .then(res => res.json())
      .then(data => {
        const priority = {
          finished: 0,
          racing: 1,
          beginning: 2
        };

        const sorted = data.sort((a, b) => {
          const stateDiff = priority[a.state] - priority[b.state];
          if (stateDiff !== 0) return stateDiff;

          // Ordina per data più recente
          return new Date(b.created_at) - new Date(a.created_at);
        });

        setChampionships(sorted);
      })
      .catch(err => console.error(err));
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
    <div className="mt-2">
      <h2 className="text-xl font-semibold uppercase text-center mb-4">Campionati creati</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <p className="text-sm text-gray-500">
                {new Date(ch.created_at).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </p>
              <h3 className="text-lg font-bold mt-1">{ch.name}</h3>
            </div>
          </li>
        ))}
      </ul>

    </div>
  );
}

export default ChampionshipList;
