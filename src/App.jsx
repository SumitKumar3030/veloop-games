import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import GameHome from "./pages/GameHome";
import Redeem from "./pages/Redeem";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/:slug" element={<GameHome />} />
        <Route path="/redeem" element={<Redeem />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;