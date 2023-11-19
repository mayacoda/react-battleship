import { BrowserRouter as Router } from "react-router-dom";
import { GameRoutes } from "@/pages/Routes.tsx";

function App() {
  return (
    <Router>
      <GameRoutes />
    </Router>
  );
}

export default App;
