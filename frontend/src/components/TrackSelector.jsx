export default function TrackSelector({ tracks, selectedTracks, toggleTrack }) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-lg mb-3">Seleziona tracciati:</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg shadow-sm bg-white">
        {tracks.map((track) => {
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
  );
}
