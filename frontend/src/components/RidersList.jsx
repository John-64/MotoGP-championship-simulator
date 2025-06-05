import { useEffect, useState } from "react";

function RidersList() {
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/riders")
      .then(res => res.json())
      .then(data => setRiders(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-5">
      <h2 className="text-xl font-semibold mb-4">Lista Piloti</h2>
      <ul>
        {riders.map((r, i) => (
          <li key={i} className="border-b py-2">
            {r.rider_name} - Vittorie: {r.victories}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RidersList;
