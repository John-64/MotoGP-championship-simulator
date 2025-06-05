export default function TrackSelector({ tracks, selectedTrack, setSelectedTrack }) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-lg mb-3">Seleziona tracciato:</h2>
      <select
        value={selectedTrack || ""}
        onChange={(e) => setSelectedTrack(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        <option value="" disabled>-- Seleziona un tracciato --</option>
        {tracks.map((track) => (
          <option key={track.track_id} value={track.track_name}>
            {track.track_name}
          </option>
        ))}
      </select>
    </div>
  );
}
