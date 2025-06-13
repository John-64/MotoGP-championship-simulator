import { useState } from "react";

export default function RiderSelector({ riders, selectedRiders, toggleRider, className }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRiders = riders.filter(r =>
    r.rider_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`${className}`}>
      <div className="h-[90%] rounded-t-2xl border-t-0 border-gray-500 p-2 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 h-full w-full p-3 overflow-y-auto">
          {filteredRiders.map((rider) => {
            const isSelected = selectedRiders.some(r => r.rider_id === rider.rider_id);
            return (
              <label
                key={rider.rider_id}
                className={`flex items-center justify-center text-center gap-3 p-2 cursor-pointer rounded border bg-gray-100 border-gray-400 ${
                  isSelected
                    ? "bg-red-100 border-red-400"
                    : "hover:bg-gray-300"
                } transition-colors duration-200`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRider(rider)}
                  className="hidden"
                />
                <span className="select-none text-gray-800">{rider.rider_name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col h-[10%] justify-start items-center px-4 bg-black rounded-b-xl pt-2">
        <div className="w-full h-full flex justify-between items-center gap-2">
          <input
            type="text"
            placeholder="Cerca piloti..."
            className="border bg-white border-gray-300 rounded-lg p-1 w-3/4 h-7 mb-2 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex justify-end items-center h-10 text-sm font-semibold mb-2 border bg-gray-700 text-white border-gray-800 rounded-lg px-2">
            Selezionati: {selectedRiders.length}
          </div>
        </div>
      </div>
    </div>
  );
}