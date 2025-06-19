import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import motogp from '../assets/motogpInverted.png'

function ChampionshipList() {
  const [championships, setChampionships] = useState([]);
  const navigate = useNavigate();
  let state = "";

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/championship_list")
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setChampionships(data);
      })
      .catch(err => {
        console.error("Errore nel fetch:", err);
      });
  }, []);

  const goToDetails = (id) => {
    navigate(`/championship/${id}`);
  };

  const stateBadgeStyle = {
    beginning: "bg-gray-500 text-white",
    racing: "bg-red-700 text-white",
    finished: "bg-black text-white",
  };

  return (
    <div>
      <div className="h-[40px] bg-black flex justify-center items-center w-full  border-t border-white">
        <h3 className="text-white py-3 text-xl font-semibold uppercase text-center">Lista campionati</h3>
      </div>
      
      <div className="overflow-auto" style={{ height: 'calc(100dvh - 230px)' }} >
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5">
        {championships.map(ch => (
            <li
                key={ch.id}
                onClick={() => goToDetails(ch.id)}
                className="relative bg-white rounded-xl shadow p-4 cursor-pointer transition hover:scale-102"
            >
              <span className={`hidden`}>
                {state = ch.races.length === 0 ? "beginning": ch.races.length === ch.tracks.length? "finished": "racing"}
              </span>
                <span className={`absolute uppercase top-0 right-0 text-xs px-2 py-1 rounded-tr-lg ${stateBadgeStyle[state]}`}>
                    {ch.races.length === 0 ? "beginning" : ch.races.length === ch.tracks.length ? "finished" : "racing"}
                </span>
                <div className="flex flex-col gap-2">
                    <h5 className="text-lg font-bold mt-1 uppercase">{ch.name}</h5>
                    <div className="flex items-center justify-start gap-4 mt-2 text-sm text-gray-600">
                      <div className="w-16 h-10 p-2 border rounded-full flex justify-center items-center px-4 gap-2">
                        <span class="material-symbols-outlined">sports_motorsports</span>
                        <span>{ch.riders.length}</span>
                      </div>
                      <div className="w-16 h-10 p-2 border rounded-full flex justify-center items-center px-4 gap-2 bg-gray-300">
                        <span class="material-symbols-outlined">route</span>
                        <span>{ch.tracks.length}</span>
                      </div>
                      <div className="w-16 h-10  p-2 border rounded-full flex justify-center items-center px-4 gap-2 border-gray-500 bg-red-600 text-white">
                        <span class="material-symbols-outlined">sports_score</span>
                        <span>{ch.races.length}</span>
                      </div>
                    </div>
                </div>
            </li>
        ))}
      </ul>
      </div>
      
      <footer className="fixed bottom-0 left-0 w-full h-[130px]">
        <div className="bg-white h-3/5 flex justify-center items-center border-t border-gray-300/60">
          <img src={motogp} alt="logo" className="h-2/5" />
        </div>
        <div className="bg-white h-2/5 py-3 text-sm text-center border-t border-gray-300/60 flex justify-center items-center">
          <p>&copy; 2025 Motogp Championship simulator</p>
        </div>
      </footer>
    </div>
  );
}

export default ChampionshipList;