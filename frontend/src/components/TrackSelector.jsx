import { useState } from "react";

export default function TrackSelector({ tracks, selectedTracks, toggleTrack, className }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTracks = tracks.filter(t =>
    t.track_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`${className}`}>
      <div className="h-[90%] rounded-t-2xl border-t-0 border-gray-500 p-2 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 h-full w-full p-3 overflow-y-auto">
          {filteredTracks.map((track) => {
            const isSelected = selectedTracks.some(t => t.track_name === track.track_name);
            return (
              <label
                key={track.track_id}
                className={`flex items-center justify-center text-center gap-3 p-2 cursor-pointer rounded border bg-gray-100 border-gray-400 ${
                  isSelected
                    ? "bg-red-100 border-red-400"
                    : "hover:bg-gray-300"
                } transition-colors duration-200`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTrack(track)}
                  className="hidden"
                />
                <span className="select-none text-gray-800">{track.track_name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col h-[10%] justify-start items-center px-4 bg-black rounded-b-xl pt-2">
        <div className="w-full h-full flex justify-between items-center gap-2">
          <input
          type="text"
          placeholder="Cerca tracciati..."
          className="border bg-white border-gray-300 rounded-lg p-1 w-3/4 h-7 mb-2 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex justify-end items-center h-10 text-sm font-semibold mb-2 border bg-gray-700 text-white border-gray-800 rounded-lg px-2">
            Selezionati: {selectedTracks.length}
          </div>
        </div>
      </div>
    </div>
  );
}
