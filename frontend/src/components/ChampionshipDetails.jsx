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
  let state = "";

  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editName, setEditName] = useState("");
  const [editRaces, setEditRaces] = useState([]);

  const [selectedTrack, setSelectedTrack] = useState("");
  const [simulatingRace, setSimulatingRace] = useState(false);
  const [numLapsInput, setNumLapsInput] = useState("20");
  const [numLaps, setNumLaps] = useState(20);

  const calculateStandings = (racesData) => {
    if (!racesData || !racesData.races || racesData.races.length === 0) {
      return [];
    }

    const ridersPoints = new Map();

    racesData.races.forEach(race => {
      if (race.results && race.results.final_results) {
        race.results.final_results.forEach(result => {
          const riderName = result.rider_name;
          const points = result.points || 0;
          
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
              race_results: []
            });
          }

          const riderData = ridersPoints.get(riderName);
          
          riderData.total_points += points;
          riderData.races_participated += 1;
          
          if (result.position === 1) riderData.wins += 1;
          if (result.position <= 3 && !result.retired) riderData.podiums += 1;
          if (result.retired) riderData.retirements += 1;
          
          if (!result.retired) {
            if (riderData.best_position === null || result.position < riderData.best_position) {
              riderData.best_position = result.position;
            }
          }
          
          riderData.race_results.push({
            track_name: race.track_name,
            position: result.retired ? 'RIT' : result.position,
            points: points,
            retired: result.retired,
            retirement_reason: result.retirement_reason
          });
          
          ridersPoints.set(riderName, riderData);
        });
      }
    });

    const standings = Array.from(ridersPoints.values())
      .sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        if (b.podiums !== a.podiums) {
          return b.podiums - a.podiums;
        }
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
        setRaces(racesData.races);
        const championshipStandings = calculateStandings(racesData);
        setStandings(championshipStandings);
        return racesData.races;  // restituisco le corse
      }

      return []; // fallback se non ok

    } catch (err) {
      console.error("Errore durante il caricamento dei dati:", err);
      setMessage(err.message || "Errore di rete.");
      setChampionship(null);
      return [];
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

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/championship/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          races: editRaces
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore durante l'aggiornamento.");
      }

      setMessage("Campionato aggiornato con successo!");
      setShowEditModal(false);

      const updatedRaces = await loadAllData();

      if (updatedRaces.length === 0) {
        window.location.reload();
      }

    } catch (err) {
      console.error(err);
      setMessage("Errore di rete o aggiornamento fallito.");
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

  const getAvailableTracks = () => {
    if (!tracks || tracks.length === 0) {
      console.log("Nessun track disponibile");
      return [];
    }
    
    if (!races || races.length === 0) {
      console.log("Nessuna gara, restituisco tutti i tracks");
      return tracks;
    }
    
    const racedTracks = races.map(race => {
      console.log("Gara:", race.track_name);
      return race.track_name;
    });
    
    
    const availableTracks = tracks.filter(track => {
      const isRaced = racedTracks.includes(track.track_name);
      console.log(`${track.track_name} - già corso: ${isRaced}`);
      return !isRaced;
    });
    
    return availableTracks;
  };

  const getLatestRace = () => {
    if (!races || races.length === 0) return null;
    return races[races.length - 1];
  };

  const stateBadgeStyle = {
    beginning: "bg-gray-500 text-white",
    racing: "bg-red-700 text-white",
    finished: "bg-white text-black",
  };

  if (loading) return <p className="text-center text-gray-600 mt-10">Caricamento...</p>;
  if (!championship) return <p className="text-center text-red-500 mt-10">Campionato non trovato.</p>;

  return (
    <div>
      <div className="relative h-[40px] bg-black flex justify-center items-center w-full  border-t border-white mb-2">
        <h3 className="text-white py-3 text-xl font-semibold uppercase text-center">{championship.name}</h3>
        {state = races.length === 0 ? "beginning": races.length === tracks.length? "finished": "racing"}
        <span className={`absolute top-1/2 -translate-y-1/2 right-10 px-3 py-1 rounded-full text-sm font-semibold shadow ${stateBadgeStyle[state]}`} style={{ fontWeight: 700 }}>
          {state.toUpperCase()}
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
                    <td className="px-4 py-2 font-semibold"><ReactCountryFlag countryCode={rider.rider_country && rider.rider_country !== "0" ? rider.rider_country : "UN"} svg style={{width: '1em', height: '1em', marginRight: '10px'}}/>{rider.rider_name}</td>
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

      {standings.length === 0 ? <></> : (
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
      )}
                
      {getLatestRace() ? (
        <div className="px-6 mt-8 w-full mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 uppercase">Ultima gara <span className="ml-2">{getLatestRace().track_name}</span></h2>
          <section className="bg-white shadow border border-gray-200 overflow-x-auto">
            <table className="min-w-full table-auto text-gray-700">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-sm font-light text-white" 
                  style={{ background: 'linear-gradient(to right, black, red)' }}>
                  <th className="px-4 py-2 text-left">Posizione</th>
                  <th className="px-4 py-2 text-left">Pilota</th>
                  <th className="px-4 py-2 text-center">Tempo totale</th>
                  <th className="px-4 py-2 text-center">Punti</th>
                </tr>
              </thead>
              <tbody>
                {getLatestRace().results?.final_results
                  ?.sort((a, b) => a.position - b.position)
                  ?.map((result, index) => (
                  <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 text-lg ${result.retired ? 'text-red-600' : ''}`}>
                    <td className="px-4 py-2 font-semibold">
                      {result.retired ? 'RIT' : `${result.position}°`}
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      <ReactCountryFlag 
                        countryCode={result.rider_country && result.rider_country !== "0" ? result.rider_country : "UN"} 
                        svg 
                        style={{width: '1em', height: '1em', marginRight: '10px'}}
                      />
                      {result.rider_name}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {result.retired 
                        ? (result.retirement_reason || 'Ritirato') 
                        : (result.total_time 
                            ? `${Math.floor(result.total_time / 60)}:${(result.total_time % 60).toFixed(2).padStart(5, '0')}` 
                            : '-')
                      }
                    </td>
                    <td className="px-4 py-2 text-center font-semibold">
                      {result.points || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : (
        <></>
      )}

      {getLatestRace() && (
        <div className="px-6 w-full mx-auto ">
          <div className="bg-white shadow border-b border-x border-gray-200 overflow-x-auto p-4">
            <h5>Eventi salienti della gara</h5>
            <div className="mt-3 p-4 h-70 overflow-auto">
              {getLatestRace().results?.race_events?.length > 0 ? (
                <div className="space-y-3">
                  {getLatestRace().results.race_events.map((event, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center p-3 rounded-lg border-l-4 ${
                        event.tipo === 'ritiro' 
                          ? 'border-red-500 bg-red-50' 
                          : event.tipo === 'sorpasso'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-500 bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0 mr-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white ${
                          event.tipo === 'ritiro' 
                            ? 'bg-red-500' 
                            : event.tipo === 'sorpasso'
                            ? 'bg-blue-500'
                            : 'bg-gray-500'
                        }`}>
                          {event.giro}
                        </span>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-3 ${
                            event.tipo === 'ritiro' 
                              ? 'bg-red-100 text-red-800' 
                              : event.tipo === 'sorpasso'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.tipo.toUpperCase()}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {event.pilota}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          {event.motivo}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0 ml-4">
                        <span className={`material-symbols-outlined ${
                          event.tipo === 'ritiro' 
                            ? 'text-red-500' 
                            : event.tipo === 'sorpasso'
                            ? 'text-blue-500'
                            : 'text-gray-500'
                        }`}>
                          {event.tipo === 'ritiro' 
                            ? 'warning' 
                            : event.tipo === 'sorpasso'
                            ? 'trending_up'
                            : 'info'
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block">
                    info
                  </span>
                  <p>Nessun evento particolare durante questa gara</p>
                </div>
              )}
            </div>
            
            {getLatestRace().results?.race_stats && (
              <div className="px-4 pt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {getLatestRace().results.race_stats.finishers}
                    </p>
                    <p className="text-xs text-gray-600 uppercase">Arrivati</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {getLatestRace().results.race_stats.retirements}
                    </p>
                    <p className="text-xs text-gray-600 uppercase">Ritirati</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {getLatestRace().results.race_stats.total_participants}
                    </p>
                    <p className="text-xs text-gray-600 uppercase">Partecipanti</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">
                      {getLatestRace().results.race_stats.total_events}
                    </p>
                    <p className="text-xs text-gray-600 uppercase">Eventi</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {getAvailableTracks().length === 0 ? <></> : (
        <div className="px-6 mt-8 w-full mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 uppercase">Prossime gare</h2>
          <section className="bg-white shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full table-auto text-gray-700">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 text-sm font-light text-white" 
                    style={{ background: 'linear-gradient(to right, black, red)' }}>
                    <th className="px-4 py-2 text-left">Circuito</th>
                    <th className="px-4 py-2 text-center">Nazione</th>
                  </tr>
                </thead>
                <tbody>
                  {getAvailableTracks().map((track) => (
                    <tr key={track.track_id} className="border-b border-gray-200 hover:bg-gray-50 text-lg">
                      <td className="px-4 py-2 font-semibold">{track.track_name}</td>
                      <td className="px-4 py-2 text-center">{track.track_country}<ReactCountryFlag countryCode={track.track_country} svg style={{width: '1em', height: '1em', marginLeft: '10px'}}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </section>
        </div>
      )}

      <div className="mt-8 mb-10 w-full flex px-10 justify-between items-center">
        <button
          onClick={() => setShowSimulationModal(true)}
          disabled={simulatingRace || !championship.riders?.length || championship.state === 'finished'}
          className="flex items-center uppercase gap-2 px-3 py-2 bg-gray-800 text-white cursor-pointer font-semibold rounded-lg shadow hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-400 transition-all duration-200 ease-in-out"
        >
          <span className="material-symbols-outlined">sports_motorsports</span>
          <span>{simulatingRace ? "Simulando..." : "Simula GP"}</span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); 
            setEditName(championship.name);
            setShowEditModal(true);
          }}
          className="flex items-center uppercase gap-2 px-3 py-2 bg-green-700 text-white cursor-pointer font-semibold rounded-lg shadow hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-600 transition-all duration-200 ease-in-out">
          <span className="material-symbols-outlined">edit</span>
          <span>Modifica GP</span>
        </button>

        <button 
          onClick={(e) => {e.stopPropagation(); handleDelete(id);}}
          className="flex items-center uppercase gap-2 px-3 py-2 bg-red-800 text-white cursor-pointer font-semibold rounded-lg shadow hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-red-400 transition-all duration-200 ease-in-out">
          <span className="material-symbols-outlined">delete</span>
          <span>Cencella GP</span>
        </button>
      </div>

      {message && (<div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-sm font-medium ${message.includes("successo") ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>{message}</div>)}

      {showSimulationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Impostazioni gara</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Circuito</label>
                <select 
                  value={selectedTrack} 
                  onChange={(e) => setSelectedTrack(e.target.value)} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="">Seleziona circuito...</option>
                  {getAvailableTracks().map((track, index) => (
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

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4">Modifica Campionato</h2>

            <label className="block mb-2 font-semibold">Nome campionato</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />

            {races.length > 0 && (
              <div>
                <label className="block mb-2 font-semibold">Seleziona le gare che vuoi eliminare</label>
                <div className="max-h-48 overflow-y-auto px-5 py-2  mb-4">
                  {races.map((race) => (
                    <div
                      key={race._id}
                      className={`flex items-center justify-start mb-1 border border-gray-500/50 rounded shadow-md hover:scale-102 transition-transform px-3 py-2 select-none
                        ${editRaces.includes(race._id) ? 'bg-red-100 border-red-400' : 'bg-white hover:bg-gray-100'}
                        cursor-pointer`}
                      onClick={() => {
                        setEditRaces((prev) =>
                          prev.includes(race._id)
                            ? prev.filter((id) => id !== race._id)
                            : [...prev, race._id]
                        );
                      }}
                    >
                      {race.track_name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="w-full flex justify-center gap-10">
                <button
                  onClick={() => handleUpdate(championship._id)}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
                >
                  Aggiorna
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
                >
                  Annulla
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChampionshipDetails;