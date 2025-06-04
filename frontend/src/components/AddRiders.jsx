// pages/AddRiders.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function AddRiders() {
  const { id } = useParams();
  const [availableRiders, setAvailableRiders] = useState([]);
  const [selectedRiders, setSelectedRiders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/riders")
      .then(res => res.json())
      .then(setAvailableRiders);
  }, []);

  const toggleRider = (rider) => {
    if (selectedRiders.includes(rider)) {
      setSelectedRiders(selectedRiders.filter(r => r !== rider));
    } else {
      setSelectedRiders([...selectedRiders, rider]);
    }
  };

  const submit = () => {
    fetch(`http://localhost:5000/api/championships/${id}/riders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riders: selectedRiders })
    })
      .then(res => res.json())
      .then(data => {
        alert("Pilota aggiunti con successo!" + data);
      });
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Aggiungi piloti al campionato</h1>
      <ul className="space-y-2">
        {availableRiders.map((rider, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedRiders.includes(rider)}
              onChange={() => toggleRider(rider)}
            />
            <span>{rider.rider_name}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={submit}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Aggiungi piloti
      </button>
    </div>
  );
}

export default AddRiders;
