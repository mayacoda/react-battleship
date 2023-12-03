import { BrowserRouter as Router } from "react-router-dom";
import { GameRoutes } from "@/pages/Routes.tsx";
import { GameProvider } from "@/game-logic/GameProvider.tsx";
import { StrictMode } from "react";

function App() {
  return (
    <StrictMode>
      <Router>
        <GameProvider>
          <GameRoutes />
        </GameProvider>
      </Router>
    </StrictMode>
  );
}

export default App;
