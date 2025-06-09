import './index.css'
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from './Header';
import AddRiders from "./components/AddRiders";
import ChampionshipForm from "./components/ChampionshipForm";
import ChampionshipList from "./components/ChampionshipList";
import ChampionshipDetails from "./components/ChampionshipDetails";
import RidersList from "./components/RidersList";
import TrackList from './components/TrackList';
import ResultList from './components/ResultList';

function AppContent() {
  const location = useLocation();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const path = location.pathname;

    if (path === "/") {
      document.title = "MotoGP Championship Simulator";
    } else if (path === "/championship") {
      document.title = "Crea campionato";
    } else if (path.startsWith("/championship/") && path.includes("add-riders")) {
      document.title = "Aggiungi piloti";
    } else if (path.startsWith("/championship/")) {
      document.title = "Dettagli campionato";
    } else if (path === "/riders") {
      document.title = "Lista piloti";
    } else if (path === "/track") {
      document.title = "Lista circuiti";
    } else if (path === "/results") {
      document.title = "Risultati";
    } else {
      document.title = "MotoGP Championship Simulator";
    }
  }, [location]);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      <Header />
      {message && (
        <p
          className={`fixed left-1/2 top-4 transform -translate-x-1/2 text-sm px-4 py-2 rounded shadow-md transition-all duration-300 z-50 ${
            message.toLowerCase().includes("inserisci") || message.toLowerCase().includes("errore")
              ? "text-red-700 bg-red-100 border border-red-300"
              : "text-green-700 bg-green-100 border border-green-300"
          }`}
        >
          {message}
        </p>
      )}
      <Routes className='w-full min-h-100 h-screen font-pt'>
        <Route path="/" element={
            <div className='p-5'>
              <ChampionshipList />
          </div>} 
        />
        <Route path="/championship" element={<ChampionshipForm />} />
        <Route path="/championship/:id" element={<ChampionshipDetails />} />
        <Route path="/championship/:id/add-riders" element={<AddRiders />} />
        <Route path="/riders" element={<RidersList />} />
        <Route path="/track" element={<TrackList />} />
        <Route path="/results" element={<ResultList />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;