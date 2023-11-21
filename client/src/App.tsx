import { BrowserRouter as Router } from "react-router-dom";
import { GameRoutes } from "@/pages/Routes.tsx";
import { GameProvider } from "@/game-logic/GameProvider.tsx";

function App() {
  return (
    <Router>
      <GameProvider>
        <GameRoutes />
      </GameProvider>
    </Router>
  );
}

export default App;
