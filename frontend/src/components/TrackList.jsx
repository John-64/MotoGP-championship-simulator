import { useEffect, useState } from "react";
import ReactCountryFlag from "react-country-flag"

function TrackList() {
  const [tracks, setTracks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/track")
      .then(res => res.json())
      .then(data => setTracks(data))
      .catch(err => console.error(err));
  }, []);

  const getFilteredTracks = () => {
    return tracks.filter(t =>
      t.track_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.track_country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="px-6 p-4 w-full mx-auto" style={{ height: 'calc(100dvh - 60px)' }}>
      <div className="h-[8%] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Cerca tracciato"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 w-full md:w-64"
        />
      </div>
      
      <div className="h-[90%] overflow-y-auto border bg-white border-gray-200 rounded-lg">
        <ul className="divide-y divide-gray-200">
          {getFilteredTracks().length > 0 ? (
            getFilteredTracks().map((t, i) => (
              <li key={i} className="px-4 py-3 text-gray-700 hover:bg-gray-50 transition">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">{t.track_name}</span>
                  <ReactCountryFlag countryCode={t.track_country && t.track_country !== "0" ? t.track_country : "UN"} svg style={{width: '1.5em', height: '1.5em'}}/>
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