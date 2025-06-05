import { useEffect, useState } from "react";

function TrackList() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/track")
      .then(res => res.json())
      .then(data => setTracks(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-5">
      <h2 className="text-xl font-semibold mb-4">Lista tracciati</h2>
      <ul>
        {tracks.map((r, i) => (
          <li key={i} className="border-b py-2">
            {r.track_name} - Nazione: {r.track_country}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TrackList;