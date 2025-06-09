import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ChampionshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [championship, setChampionship] = useState(null);
  const [standings, setStandings] = useState([]);
  const [raceHistory, setRaceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulatingRace, setSimulatingRace] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [numLapsInput, setNumLapsInput] = useState("20"); // stringa
  const [numLaps, setNumLaps] = useState(20); // numero valido
  const [showSimulationModal, setShowSimulationModal] = useState(false);

  const handleLapsChange = (e) => {
    setNumLapsInput(e.target.value);
  };

  const handleLapsBlur = () => {
    const parsed = parseInt(numLapsInput);
    const valid = Math.max(5, Math.min(30, isNaN(parsed) ? 20 : parsed));
    setNumLaps(valid);
    setNumLapsInput(valid.toString());
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const champRes = await fetch(`http://127.0.0.1:5000/api/championships/${id}`);
      const champData = await champRes.json();
      if (!champRes.ok) throw new Error(champData.error || 'Campionato non trovato');
      
      setChampionship(champData);
      
      const standingsRes = await fetch(`http://127.0.0.1:5000/api/championships/${id}/standings`);
      const standingsData = await standingsRes.json();
      if (standingsRes.ok) setStandings(standingsData);

      if (champData.races && champData.races.length > 0) {
        const sortedRaces = [...champData.races].reverse();
        setRaceHistory(sortedRaces);
        
        // L'ultima gara è il primo elemento dell'array ordinato
      } else {
        // Se non ci sono gare, resetta tutto
        setRaceHistory([]);
      }
      
    } catch (err) {
      console.error("Errore durante il caricamento dei dati:", err);
      setMessage(err.message || "Errore di rete.");
      setChampionship(null); // Resetta in caso di errore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);
  
  // Gestione dei messaggi di notifica
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Sei sicuro di voler eliminare questo campionato?");
    if (!confirmDelete) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/championships/${id}`, { method: "DELETE" });
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

  const simulateRace = async () => {
    if (!selectedTrack) {
      setMessage("Seleziona un circuito per la gara!");
      return;
    }
    setSimulatingRace(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/championships/${id}/simulate-race`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_name: selectedTrack, num_laps: numLaps }),
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

  if (loading) return <p className="text-center text-gray-600 mt-10">Caricamento...</p>;
  if (!championship) return <p className="text-center text-red-500 mt-10">Campionato non trovato.</p>;

  const stateBadgeStyle = {
    beginning: "bg-gray-500 text-white",
    racing: "bg-red-700 text-white",
    finished: "bg-black text-white",
  };

  const getCountryFlag = (country) => {
    const flags = { 'IT': '🇮🇹', 'ES': '🇪🇸', 'GB': '🇬🇧', 'US': '🇺🇸', 'AU': '🇦🇺', 'FR': '🇫🇷', 'DE': '🇩🇪', 'JP': '🇯🇵' };
    return flags[country] || '🏁';
  };

  return (
    <div className="p-6 relative w-full mx-auto space-y-8">
      <div className="relative">
        <span className={`absolute top-0 right-0 px-3 py-1 rounded-full text-sm font-semibold shadow ${stateBadgeStyle[championship.state] || "bg-gray-100 text-gray-800"}`}>
          {championship.state.replace("_", " ").toUpperCase()}
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900">{championship.name}</h1>
        <p className="text-sm uppercase text-gray-500 mt-2">
          Creato il: <time dateTime={championship.created_at}>{new Date(championship.created_at).toLocaleString("it-IT")}</time>
        </p>
      </div>

      <div className="flex gap-4">
         <button
          onClick={() => setShowSimulationModal(true)}
          disabled={simulatingRace || !championship.riders?.length || championship.state === 'finished'}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-400 transition-all duration-200 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">sports_motorsports</span>
          {simulatingRace ? "Simulando..." : "Simula Gara"}
        </button>
      </div>
      
      {standings.length > 0 && (
        <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-500">emoji_events</span>Classifica Generale
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Pos</th>
                  <th className="px-4 py-2 text-left font-semibold">Pilota</th>
                  <th className="px-4 py-2 text-center font-semibold">Punti</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr key={standing.rider_name} className={index < 3 ? "bg-yellow-50" : ""}>
                    <td className="px-4 py-2 font-bold">{index === 0 && "🥇"} {index === 1 && "🥈"} {index === 2 && "🥉"} {index > 2 && `${index + 1}°`}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <span>{getCountryFlag(standing.rider_country)}</span><span className="font-medium">{standing.rider_name}</span>
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-lg">{standing.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

       {raceHistory.length > 0 && (
        <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500">flag</span>
            Ultima Gara: {raceHistory[0].track_name}
          </h2>
          
          {/* Statistiche Gara */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-3 gap-4 text-center">
            
            <div><div className="text-2xl font-bold text-blue-600">{raceHistory[0].num_laps}</div><div className="text-sm text-gray-600">Giri Totali</div></div>
            <div><div className="text-2xl font-bold text-green-600">{raceHistory[0].race_stats.finishers || 0}</div><div className="text-sm text-gray-600">Arrivati</div></div>
            <div><div className="text-2xl font-bold text-red-600">{raceHistory[0].race_stats?.retirements || 0}</div><div className="text-sm text-gray-600">Ritiri</div></div>
          </div>

          {/* Podio */}
          <div className="mb-6 w-full">
            <h3 className="text-lg font-semibold mb-3">🏆 Podio</h3>
            <div className="flex items-end justify-center gap-2 max-w-md mx-auto">
            {/* Secondo posto */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4 text-center h-42 w-34 flex flex-col justify-between shadow-lg">
                <div className="text-3xl">🥈</div>
                <div className="font-medium text-xs leading-tight">
                  {getCountryFlag(raceHistory[0].detailed_results[1].rider_country)} 
                  <div>{raceHistory[0].detailed_results[1].rider_name}</div>
                </div>
                <div className="text-xs text-gray-600">{raceHistory[0].detailed_results[1].points} punti</div>
                <div className="px-4 py-2 text-center text-xs">{raceHistory[0].detailed_results[2].total_time ? `${Math.floor(raceHistory[0].detailed_results[2].total_time / 60)}:${(raceHistory[0].detailed_results[2].total_time % 60).toFixed(2).padStart(5, '0')}` : "-"}</div>
              </div>
              <div className="bg-gray-300 w-24 h-8 rounded-t-sm mt-1">
                <div className="text-center text-gray-600 font-bold text-sm leading-8">2°</div>
              </div>
            </div>

            {/* Primo posto */}
            <div className="flex flex-col items-center">
              <div className="bg-yellow-100 border-3 border-yellow-400 rounded-lg p-6 text-center h-50 w-38 flex flex-col justify-between shadow-xl transform -translate-y-4">
                <div className="text-4xl animate-pulse">🥇</div>
                <div className="font-bold text-sm leading-tight">
                  {getCountryFlag(raceHistory[0].detailed_results[0].rider_country)}
                  <div>{raceHistory[0].detailed_results[0].rider_name}</div>
                </div>
                <div className="text-sm text-yellow-700 font-semibold">{raceHistory[0].detailed_results[0].points} punti</div>
                <div className="px-4 py-2 text-center text-xs">{raceHistory[0].detailed_results[2].total_time ? `${Math.floor(raceHistory[0].detailed_results[2].total_time / 60)}:${(raceHistory[0].detailed_results[2].total_time % 60).toFixed(2).padStart(5, '0')}` : "-"}</div>
              </div>
              <div className="bg-yellow-400 w-28 h-12 rounded-t-sm mt-1">
                <div className="text-center text-yellow-800 font-bold text-lg leading-12">1°</div>
              </div>
            </div>

            {/* Terzo posto */}
            <div className="flex flex-col items-center">
              <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-3 text-center h-34 w-30 flex flex-col justify-between shadow-md">
                <div className="text-2xl">🥉</div>
                <div className="font-medium text-xs leading-tight">
                  {getCountryFlag(raceHistory[0].detailed_results[2].rider_country)}
                  <div>{raceHistory[0].detailed_results[2].rider_name}</div>
                </div>
                <div className="text-xs text-gray-600">{raceHistory[0].detailed_results[2].points} punti</div>
                <div className="px-4 py-2 text-center text-xs">{raceHistory[0].detailed_results[2].total_time ? `${Math.floor(raceHistory[0].detailed_results[2].total_time / 60)}:${(raceHistory[0].detailed_results[2].total_time % 60).toFixed(2).padStart(5, '0')}` : "-"}</div>
              </div>
              <div className="bg-orange-300 w-20 h-6 rounded-t-sm mt-1">
                <div className="text-center text-orange-700 font-bold text-xs leading-6">3°</div>
              </div>
            </div>
          </div>
          </div>

          {/* Risultati Completi */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left font-semibold">Pos</th><th className="px-4 py-2 text-left font-semibold">Pilota</th><th className="px-4 py-2 text-center font-semibold">Giri</th><th className="px-4 py-2 text-center font-semibold">Tempo</th><th className="px-4 py-2 text-center font-semibold">Punti</th><th className="px-4 py-2 text-center font-semibold">Status</th></tr></thead>
              <tbody>
                {raceHistory[0].detailed_results?.slice(3).map((result) => (
                  <tr key={result.rider_name} className={`${result.retired ? "bg-red-300" : "bg-white-50"}`}>
                    <td className="px-4 py-2 font-bold">{result.position}°</td>
                    <td className="px-4 py-2 flex items-center gap-2"><span>{getCountryFlag(result.rider_country)}</span><span className="font-medium">{result.rider_name}</span></td>
                    <td className="px-4 py-2 text-center">{result.completed_laps}/{raceHistory[0].num_laps}</td>
                    <td className="px-4 py-2 text-center">{result.total_time ? `${Math.floor(result.total_time / 60)}:${(result.total_time % 60).toFixed(2).padStart(5, '0')}` : "-"}</td>
                    <td className="px-4 py-2 text-center font-bold">{result.points}</td>
                    <td className="px-4 py-2 text-center">{result.retired ? <span className="text-red-600 text-xs">🔧 {result.retirement_reason}</span> : <span className="text-green-600 text-xs">✅ Finito</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Eventi della Gara */}
          {raceHistory[0].race_events && raceHistory[0].race_events.length > 0 && <div className="mt-6"><h3 className="text-lg font-semibold mb-3">📰 Eventi della Gara</h3><div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">{raceHistory[0].race_events.map((event, index) => <div key={index} className="mb-2 text-sm"><span className="font-medium text-red-600">Giro {event.giro}:</span><span className="ml-2">{event.pilota} - {event.motivo}</span></div>)}</div></div>}
        </section>
      )}

      {raceHistory.length > 0 && (
        <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2"><span className="material-symbols-outlined text-blue-500">history</span>Storico Gare ({raceHistory.length})</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {raceHistory.map((race, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">🏁 {race.race_name} - {race.track_name}</h3>
                <p className="text-sm text-gray-500 mb-3">{new Date(race.date).toLocaleString("it-IT")} • {race.num_laps} giri</p>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {race.detailed_results
                    // --- MODIFICA: Aggiungi l'ordinamento qui ---
                    ?.sort((a, b) => a.position - b.position) 
                    .slice(0, 3)
                    .map((result, pos) => (
                      // Il resto del codice rimane invariato
                      <div key={result.rider_name} className={`p-3 rounded-lg text-center ${pos === 0 ? "bg-yellow-100 border-2 border-yellow-400" : pos === 1 ? "bg-gray-100 border-2 border-gray-400" : "bg-orange-100 border-2 border-orange-400"}`}>
                        <div className="text-2xl">{pos === 0 ? "🥇" : pos === 1 ? "🥈" : "🥉"}</div>
                        <div className="font-medium text-sm">{getCountryFlag(result.rider_country)} {result.rider_name}</div>
                        <div className="text-xs text-gray-600">{result.points} punti</div>
                      </div>
                  ))}
                </div>
                {race.race_stats && <div className="text-xs text-gray-600 border-t pt-2">Arrivati: {race.race_stats.finishers}/{race.race_stats.total_participants} • Ritiri: {race.race_stats.retirements}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Piloti</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700 max-h-48 overflow-y-auto">
          {championship.riders?.length > 0 ? (championship.riders.map((rider, index) => <li key={index} className="flex items-center gap-2"><span>{getCountryFlag(rider.rider_country)}</span>{rider.rider_name}</li>)) : (<li className="italic text-gray-400">Nessun pilota assegnato</li>)}
        </ul>
      </section>

      {/* MODIFICA: La sezione "Prossimi Eventi" ora mostra solo i tracciati disponibili */}
      <section className="bg-white rounded-xl p-5 shadow border border-gray-200">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Prossimi eventi</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700 max-h-48 overflow-y-auto">
          {championship.tracks?.length > 0 ? (
            championship.tracks.map((track, index) => (
              <li key={index}>{track.track_name} ({track.track_country})</li>
            ))
          ) : (
            <li className="italic text-gray-400">Nessun altro evento in programma. Campionato concluso.</li>
          )}
        </ul>
      </section>

      <button onClick={(e) => {e.stopPropagation(); handleDelete(id);}} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white cursor-pointer font-semibold rounded-lg shadow hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-400 transition-all duration-200 ease-in-out" aria-label="Elimina campionato" type="button">
        <span className="material-symbols-outlined">delete</span>Elimina Campionato
      </button>

      {showSimulationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Simula gara</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Circuito</label>
                <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleziona circuito...</option>
                  {championship.tracks?.map((track, index) => (
                    <option key={index} value={track.track_name}>
                      {track.track_name} ({track.track_country})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Numero Giri</label>
                <input
                  type="number"
                  value={numLapsInput}
                  onChange={handleLapsChange}
                  onBlur={handleLapsBlur}
                  min="5"
                  max="30"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-xs text-gray-500 mt-1">Tra 5 e 30 giri</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={simulateRace} disabled={simulatingRace || !selectedTrack} className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">{simulatingRace ? "Simulando..." : "Avvia Gara"}</button>
              <button onClick={() => setShowSimulationModal(false)} disabled={simulatingRace} className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition-colors">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {message && (<div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-sm font-medium ${message.includes("successo") ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>{message}</div>)}
    </div>
  );
}

export default ChampionshipDetails;