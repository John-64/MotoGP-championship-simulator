import { useEffect, useState } from "react";
import ReactCountryFlag from "react-country-flag"

function TrackList() {
  const [tracks, setTracks] = useState([]);
  const [sortOption, setSortOption] = useState("name");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/track")
      .then(res => res.json())
      .then(data => setTracks(data))
      .catch(err => console.error(err));
  }, []);

  const getSortedTracks = () => {
    const filtered = tracks.filter(t =>
      t.track_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.track_country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortOption === "name") {
        return a.track_name.localeCompare(b.track_name);
      }
      if (sortOption === "country") {
        return a.track_country.localeCompare(b.track_country);
      }
      return 0;
    });
  };

  return (
    <div className="p-6 w-full h-[calc(100%-10%)] mx-auto flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Cerca tracciato o nazione..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 w-full md:w-64"
        />

        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700"
        >
          <option value="name">Ordina per Nome (A-Z)</option>
          <option value="country">Ordina per Nazione (A-Z)</option>
        </select>
      </div>

      <div className="flex-grow h-[95%] overflow-y-auto border bg-white border-gray-200 rounded-lg">
        <ul className="divide-y divide-gray-200">
          {getSortedTracks().length > 0 ? (
            getSortedTracks().map((t, i) => (
              <li key={i} className="px-4 py-3 text-gray-700 hover:bg-gray-50 transition">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t.track_name}</span>
                  <ReactCountryFlag
                    countryCode={t.track_country}
                    svg
                    style={{
                      width: '1.5em',
                      height: '1.5em',
                    }}
                  />
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 italic text-gray-400">Nessun tracciato trovato.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default TrackList;
