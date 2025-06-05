import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddRiders from "./components/AddRiders";
import ChampionshipForm from "./components/ChampionshipForm";
import ChampionshipList from "./components/ChampionshipList";
import ChampionshipDetails from "./components/ChampionshipDetails";
import RidersList from "./components/RidersList";
import Header from './Header';

function App() {
  return (
    <BrowserRouter>
      <Header></Header>
      <Routes>
        <Route path="/" element={
          <div className='w-full min-h-150 font-pt'>
            <div className='p-5'>
              <ChampionshipList />
              <button onClick={() => window.location.href = "/championship"}
                className="bg-black hover:bg-gray-800 cursor-pointer text-white font-bold py-2 px-4 rounded mt-4"  
              >Crea un nuovo campionato</button>
            </div>
          </div>} 
        />
        <Route path="/championship" element={<ChampionshipForm />} />
        <Route path="/championship/:id" element={<ChampionshipDetails />} />
        <Route path="/championship/:id/add-riders" element={<AddRiders />} />
        <Route path="/riders" element={<RidersList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
