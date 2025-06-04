export default function RiderSelector({ riders, selectedRiders, toggleRider }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold mb-2">Seleziona piloti:</h2>
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {riders.map((rider) => (
          <label key={rider.rider_name} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedRiders.find((r) => r.rider_name === rider.rider_name)}
                onChange={() => toggleRider(rider)}
              />
              {rider.rider_name}
            </label>
        ))}
      </div>
    </div>
  );
}