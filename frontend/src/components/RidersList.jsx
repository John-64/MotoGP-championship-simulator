import { useEffect, useState } from "react";
import ReactCountryFlag from "react-country-flag"

function RidersList() {
  const [riders, setRiders] = useState([]);
  const [sortOption, setSortOption] = useState("name");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/rider")
      .then(res => res.json())
      .then(data => setRiders(data))
      .catch(err => console.error(err));
  }, []);

  const getSortedRiders = () => {
    const filtered = riders.filter((r) =>
      r.rider_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortOption === "name") {
        return a.rider_name.localeCompare(b.rider_name);
      }
      if (sortOption === "titles") {
        return b.rider_world_championships - a.rider_world_championships;
      }
      if (sortOption === "wins") {
        return b.rider_first_places - a.rider_first_places;
      }
      if (sortOption === "podiums") {
        const aPodiums = a.rider_first_places + a.rider_second_places + a.rider_third_places;
        const bPodiums = b.rider_first_places + b.rider_second_places + b.rider_third_places;
        return bPodiums - aPodiums;
      }
      return 0;
    });
  };

  return (
    <div className="px-6 p-4 w-full mx-auto" style={{ height: 'calc(100dvh - 60px)' }}>
      <div className="h-[8%] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Cerca pilota"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 w-full md:w-64"
        />

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700"
        >
          <option value="name">Nome (A-Z)</option>
          <option value="titles">Titoli mondiali</option>
          <option value="wins">Vittorie</option>
          <option value="podiums">Podi</option>
        </select>
      </div>
      <div className="h-[90%] overflow-y-auto border bg-white border-gray-200 rounded-lg">
        <ul className="divide-y divide-gray-200">
          {getSortedRiders().length > 0 ? (
            getSortedRiders().map((r, i) => (
              <li key={i} className="px-4 py-3 text-gray-700 hover:bg-gray-50 transition">
                <div className="flex justify-between items-center">
                  <div className="font-semibold flex flex-col justify-center items-start">
                    {r.rider_name}
                    <div className="text-xs font-light text-gray-400 flex items-center gap-1">
                      <ReactCountryFlag countryCode={r.rider_country && r.rider_country !== "0" ? r.rider_country : "UN"} svg style={{width: '1em', height: '1em'}}/>
                      {r.rider_country} • 1st place: {r.rider_first_places} • 2nd place: {r.rider_second_places} • 3rd place: {r.rider_third_places} • Pole positions: {r.rider_pole_positions}
                    </div>
                  </div>

                  <ul className="flex flex-col items-end text-sm text-gray-500">
                    <li className="flex items-center gap-1">
                      Titoli mondiali: {r.rider_world_championships}
                      <span className="material-symbols-outlined text-red-700">trophy</span>
                    </li>
                    <li className="flex items-center gap-1">
                      Vittorie: {r.rider_first_places}
                      <span className="material-symbols-outlined text-gray-500">social_leaderboard</span>
                    </li>
                    <li className="flex items-center gap-1">
                      Podi: {r.rider_first_places + r.rider_second_places + r.rider_third_places}
                      <span className="material-symbols-outlined text-black">leaderboard</span>
                    </li>
                  </ul>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 italic text-gray-400">Nessun pilota trovato.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default RidersList;
