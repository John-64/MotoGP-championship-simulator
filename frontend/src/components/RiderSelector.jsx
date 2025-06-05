import { useState } from "react";

export default function RiderSelector({ riders, selectedRiders, toggleRider, className }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRiders = riders.filter(r =>
    r.rider_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <h2 className="font-semibold w-full text-center text-lg uppercase">Piloti</h2>
      <div className="flex justify-between items-center gap">
        <div className="text-sm text-gray-600 font-semibold mb-2 w-1/4">
          Selezionati: {selectedRiders.length}
        </div>

         <input
          type="text"
          placeholder="Cerca piloti..."
          className="border bg-white border-gray-300 rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={`mb-2 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 h-full w-full overflow-y-auto p-2 border border-gray-200 rounded-lg shadow-sm bg-white">
          {filteredRiders.map((rider) => {
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
    </div>
  );
}