export default function RiderSelector({ riders, selectedRiders, toggleRider }) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-lg mb-3">Seleziona piloti:</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 h-120 overflow-y-auto p-2 border border-gray-200 rounded-lg shadow-sm bg-white">
        {riders.map((rider) => {
          const isSelected = selectedRiders.some(r => r.rider_name === rider.rider_name);
          return (
            <label
              key={rider.rider_name}
              className={`flex items-center gap-3 p-2 cursor-pointer rounded border ${
                isSelected
                  ? "bg-blue-100 border-blue-400"
                  : "border-transparent hover:bg-gray-100"
              } transition-colors duration-200`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleRider(rider)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="select-none text-gray-800">{rider.rider_name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
