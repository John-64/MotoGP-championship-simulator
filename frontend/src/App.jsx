import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddRiders from "./components/AddRiders";
import ChampionshipForm from "./components/ChampionshipForm";
import ChampionshipList from "./components/ChampionshipList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <ChampionshipForm />
            <ChampionshipList />
          </>} 
        />
        <Route path="/championship/:id/add-riders" element={<AddRiders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
