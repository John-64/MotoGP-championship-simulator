import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ChampionshipList() {
  const [championships, setChampionships] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/championships")
      .then(res => res.json())
      .then(data => setChampionships(data))
      .catch(err => console.error(err));
  }, []);

  const goToDetails = (id) => {
    navigate(`/championship/${id}`);
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Campionati creati</h2>
      <ul className="space-y-2">
        {championships.map(ch => (
          <li
            key={ch.id}
            className="bg-white cursor-pointer p-2 rounded shadow"
            onClick={() => goToDetails(ch.id)}
          >
            <strong>{ch.name}</strong> <br />
            <small>{new Date(ch.created_at).toLocaleString()}</small>
          </li>
        ))}

      </ul>
    </div>
  );
}

export default ChampionshipList;
