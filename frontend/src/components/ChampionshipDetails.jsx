import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag"

function ChampionshipDetails() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const {id} = useParams();
  const navigate = useNavigate();

  const [championship, setChampionship] = useState(null);
  const [riders, setRiders] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [races, setRaces] = useState([]);
  const [standings, setStandings] = useState([]);

  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [simulatingRace, setSimulatingRace] = useState(false);
  const [numLapsInput, setNumLapsInput] = useState("20");
  const [numLaps, setNumLaps] = useState(20);

  const calculateStandings = (racesData) => {
    // Verifica se abbiamo dati delle gare
    if (!racesData || !racesData.races || racesData.races.length === 0) {
      return [];
    }

    // Mappa per accumulare i punti di ogni pilota
    const ridersPoints = new Map();

    // Scorri tutte le gare
    racesData.races.forEach(race => {
      if (race.results && race.results.final_results) {
        race.results.final_results.forEach(result => {
          const riderName = result.rider_name;
          const points = result.points || 0;
          
          // Se il pilota non esiste nella mappa, inizializzalo
          if (!ridersPoints.has(riderName)) {
            ridersPoints.set(riderName, {
              rider_name: riderName,
              rider_country: result.rider_country,
              total_points: 0,
              races_participated: 0,
              wins: 0,
              podiums: 0,
              retirements: 0,
              best_position: null,
              race_results: [] // Array per salvare tutti i risultati
            });
          }

          // Ottieni i dati attuali del pilota
          const riderData = ridersPoints.get(riderName);
          
          // Aggiorna i punti totali
          riderData.total_points += points;
          riderData.races_participated += 1;
          
          // Aggiorna statistiche
          if (result.position === 1) riderData.wins += 1;
          if (result.position <= 3 && !result.retired) riderData.podiums += 1;
          if (result.retired) riderData.retirements += 1;
          
          // Aggiorna la migliore posizione (solo se non ritirato)
          if (!result.retired) {
            if (riderData.best_position === null || result.position < riderData.best_position) {
              riderData.best_position = result.position;
            }
          }
          
          // Aggiungi il risultato della gara
          riderData.race_results.push({
            track_name: race.track_name,
            position: result.retired ? 'RIT' : result.position,
            points: points,
            retired: result.retired,
            retirement_reason: result.retirement_reason
          });
          
          // Aggiorna la mappa
          ridersPoints.set(riderName, riderData);
        });
      }
    });

    // Converti la mappa in array e ordina per punti (decrescente)
    const standings = Array.from(ridersPoints.values())
      .sort((a, b) => {
        // Prima ordina per punti totali
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        // In caso di parità, ordina per numero di vittorie
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        // In caso di ulteriore parità, ordina per numero di podi
        if (b.podiums !== a.podiums) {
          return b.podiums - a.podiums;
        }
        // In caso di ulteriore parità, ordina per migliore posizione
        if (a.best_position !== null && b.best_position !== null) {
          return a.best_position - b.best_position;
        }
        return 0;
      })
      .map((rider, index) => ({
        ...rider,
        championship_position: index + 1
      }));

    return standings;
  };

  const loadAllData = async () => {
    setLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/championship/${id}`);
      const data = await res.json();
      if (res.ok) setChampionship(data);

      const ridersRes = await fetch(`http://127.0.0.1:5000/api/get_participants_riders?id=${id}`);
      const ridersData = await ridersRes.json();
      if (ridersRes.ok) setRiders(ridersData.riders);

      const tracksRes = await fetch(`http://127.0.0.1:5000/api/get_selected_tracks?id=${id}`);
      const tracksData = await tracksRes.json();
      if (tracksRes.ok) setTracks(tracksData.tracks);

      const racesRes = await fetch(`http://127.0.0.1:5000/api/get_races_championship?id=${id}`);
      const racesData = await racesRes.json();
      if (racesRes.ok) {
        setRaces(racesData);
        const championshipStandings = calculateStandings(racesData);
        setStandings(championshipStandings);
      }
    } catch (err) {
      console.error("Errore durante il caricamento dei dati:", err);
      setMessage(err.message || "Errore di rete.");
      setChampionship(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);
  
  // Messagges management
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLapsBlur = () => {
    const parsed = parseInt(numLapsInput);
    const valid = Math.max(5, Math.min(30, isNaN(parsed) ? 20 : parsed));
    setNumLaps(valid);
    setNumLapsInput(valid.toString());
  };

  const handleLapsChange = (e) => {
    setNumLapsInput(e.target.value);
  };

  const simulateRace = async () => {
    if (!selectedTrack) {
      setMessage("Seleziona un circuito per la gara!");
      return;
    }
    setSimulatingRace(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/championship/${id}/simulate-race`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riders: riders, track_name: selectedTrack, num_laps: numLaps }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Gara simulata con successo su ${selectedTrack}!`);
        setShowSimulationModal(false);
        setSelectedTrack("");await loadAllData(); 
      } else {
        setMessage(data.error || "Errore durante la simulazione.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Errore di rete durante la simulazione.");
    } finally {
      setSimulatingRace(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Sei sicuro di voler eliminare questo campionato?");
    if (!confirmDelete) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/championship/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        navigate("/", { state: { message: "Campionato eliminato con successo." } });
      } else {
        setMessage(data.error || "Errore durante l'eliminazione.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Errore di rete.");
    }
  };

  const stateBadgeStyle = {
    beginning: "bg-gray-500 text-white",
    racing: "bg-red-700 text-white",
    finished: "bg-black text-white",
  };

  if (loading) return <p className="text-center text-gray-600 mt-10">Caricamento...</p>;
  if (!championship) return <p className="text-center text-red-500 mt-10">Campionato non trovato.</p>;

  return (
    <div>
      <div className="relative p-0">
        <h2 className="bg-black text-white py-3 text-xl font-semibold uppercase text-center mb-4 border-t border-white">{championship.name}</h2>
        <span className={`absolute top-1/2 -translate-y-1/2 right-10 px-3 py-1 rounded-full text-sm font-semibold shadow ${stateBadgeStyle[championship.state] || "bg-gray-100 text-gray-800"}`}>
          {championship.state.replace("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="px-6 w-full mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 uppercase">Lista piloti</h2>
        <section className="bg-white shadow border border-gray-200 overflow-x-auto">
          {riders.length === 0 ? (
            <div className="text-gray-700">Nessun pilota trovato.</div>
          ) : (
            <table className="min-w-full table-auto text-gray-700">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-sm font-light text-white" 
                  style={{ background: 'linear-gradient(to right, black, red)' }}>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-center">Campionati Mondiali</th>
                  <th className="px-4 py-2 text-center">Polespositions</th>
                  <th className="px-4 py-2 text-center">Vittorie</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rider) => (
                  <tr key={rider.rider_id} className="border-b border-gray-200 hover:bg-gray-50 text-lg">
                    <td className="px-4 py-2 font-semibold"><ReactCountryFlag countryCode={rider.rider_country} svg style={{width: '1em', height: '1em', marginRight: '10px'}}/> {rider.rider_name}</td>
                    <td className="px-4 py-2 text-center">{rider.rider_world_championships}</td>
                    <td className="px-4 py-2 text-center">{rider.rider_pole_positions}</td>
                    <td className="px-4 py-2 text-center">{rider.rider_first_places}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="px-6 mt-8 w-full mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 uppercase">Classifica campionato</h2>
        <section className="bg-white shadow border border-gray-200 overflow-x-auto">
          <table className="min-w-full table-auto text-gray-700">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-sm font-light text-white" 
                  style={{ background: 'linear-gradient(to right, black, red)' }}>
                  <th className="px-4 py-2 text-left">Posizione</th>
                  <th className="px-4 py-2 text-left">Pilota</th>
                  <th className="px-4 py-2 text-center">Vittorie</th>
                  <th className="px-4 py-2 text-center">Podi</th>
                  <th className="px-4 py-2 text-center">Ritiri</th>
                  <th className="px-4 py-2 text-center">Punti</th>
                </tr>
              </thead>
            <tbody>
              {standings.map((rider) => (
                <tr key={rider.rider_name} className="border-b border-gray-200 hover:bg-gray-50 text-lg">
                  <td className="px-4 py-2 font-semibold">{rider.championship_position}°</td>
                  <td className="px-4 py-2 font-semibold"><ReactCountryFlag countryCode={rider.rider_country && rider.rider_country !== "0" ? rider.rider_country : "UN"} svg style={{width: '1em', height: '1em', marginRight: '10px'}}/>{rider.rider_name}</td>
                  <td className="px-4 py-2 text-center">{rider.wins}</td>
                  <td className="px-4 py-2 text-center">{rider.podiums}</td>
                  <td className="px-4 py-2 text-center">{rider.retirements}</td>
                  <td className="px-4 py-2 text-center">{rider.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="px-6 mt-8 w-full mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 uppercase">Ultima gara</h2>
        <section className="bg-white shadow border border-gray-200 overflow-x-auto">
          <table className="min-w-full table-auto text-gray-700">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-sm font-light text-white" 
                  style={{ background: 'linear-gradient(to right, black, red)' }}>
                  <th className="px-4 py-2 text-left">Posizione</th>
                  <th className="px-4 py-2 text-left">Pilota</th>
                  <th className="px-4 py-2 text-center">Vittorie</th>
                  <th className="px-4 py-2 text-center">Podi</th>
                  <th className="px-4 py-2 text-center">Ritiri</th>
                  <th className="px-4 py-2 text-center">Punti</th>
                </tr>
              </thead>
            <tbody>
              
            </tbody>
          </table>
        </section>
      </div>
      
      <div className="px-6 mt-8 w-full mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 uppercase">Prossimi eventi</h2>
        <section className="bg-white shadow border border-gray-200 overflow-x-auto">
          {riders.length === 0 ? (
            <div className="text-gray-700">Nessun evento disponibile.</div>
          ) : (
            <table className="min-w-full table-auto text-gray-700">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-sm font-light text-white" 
                  style={{ background: 'linear-gradient(to right, black, red)' }}>
                  <th className="px-4 py-2 text-left">Circuito</th>
                  <th className="px-4 py-2 text-center">Nazione</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.track_id} className="border-b border-gray-200 hover:bg-gray-50 text-lg">
                    <td className="px-4 py-2 font-semibold">{track.track_name}</td>
                    <td className="px-4 py-2 text-center">{track.track_country}<ReactCountryFlag countryCode={track.track_country} svg style={{width: '1em', height: '1em', marginLeft: '10px'}}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="mt-8 mb-10 w-full flex px-10 justify-between items-center">
        <button
          onClick={() => setShowSimulationModal(true)}
          disabled={simulatingRace || !championship.riders?.length || championship.state === 'finished'}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white cursor-pointer font-semibold rounded-lg shadow hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-400 transition-all duration-200 ease-in-out"
        >
          <span className="material-symbols-outlined">sports_motorsports</span>
          {simulatingRace ? "Simulando..." : "Simula Gara"}
        </button>

        <button 
          onClick={(e) => {e.stopPropagation(); handleDelete(id);}}
          className="flex items-center gap-2 px-3 py-2 bg-red-800 text-white cursor-pointer font-semibold rounded-lg shadow hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-red-400 transition-all duration-200 ease-in-out">
          <span className="material-symbols-outlined">delete</span>Cencella campionato
        </button>
      </div>

      {message && (<div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-sm font-medium ${message.includes("successo") ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>{message}</div>)}

      {showSimulationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Impostazioni gara</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Circuito</label>
                <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300">
                  <option value="">Seleziona circuito...</option>
                  {tracks?.map((track, index) => (
                    <option key={index} value={track.track_name}>
                      {track.track_name} ({track.track_country})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Numero giri</label>
                <input
                  type="number"
                  value={numLapsInput}
                  onChange={handleLapsChange}
                  onBlur={handleLapsBlur}
                  min="5"
                  max="30"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                />

                <p className="text-xs text-gray-500 mt-1">Tra 5 e 30 giri</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={simulateRace} disabled={simulatingRace || !selectedTrack} className="flex-1 cursor-pointer bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">{simulatingRace ? "Simulando..." : "Avvia Gara"}</button>
              <button onClick={() => setShowSimulationModal(false)} disabled={simulatingRace} className="flex-1 cursor-pointer bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition-colors">Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChampionshipDetails;