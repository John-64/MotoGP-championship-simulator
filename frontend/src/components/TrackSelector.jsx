import { useState } from "react";

export default function TrackSelector({ tracks, selectedTracks, toggleTrack, className }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTracks = tracks.filter(t =>
    t.track_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <h2 className="font-semibold w-full text-center text-lg uppercase">Circuiti</h2>
      <div className="flex justify-between items-center gap">
        <div className="text-sm text-gray-600 font-semibold mb-2 w-1/4">
          Selezionati: {selectedTracks.length}
        </div>

        <input
          type="text"
          placeholder="Cerca tracciati..."
          className="border bg-white border-gray-300 rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div> 

      <div className={`mb-2 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 h-full overflow-y-auto p-2 border border-gray-200 rounded-lg shadow-sm bg-white">
          {filteredTracks.map((track) => {
            const isSelected = selectedTracks.some(t => t.track_name === track.track_name);
            return (
              <label
                key={track.track_id}
                className={`flex items-center gap-3 p-2 cursor-pointer rounded border ${
                  isSelected
                    ? "bg-green-100 border-green-400"
                    : "border-transparent hover:bg-gray-100"
                } transition-colors duration-200`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTrack(track)}
                  className="form-checkbox h-5 w-5 text-green-600"
                />
                <span className="select-none text-gray-800">{track.track_name}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
