import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { RiskMonitoring } from './pages/RiskMonitoring';
import { Disruptions } from './pages/Disruptions';
import { Claims } from './pages/Claims';
import { Fraud } from './pages/Fraud';
import { Payouts } from './pages/Payouts';
import { Queues } from './pages/Queues';
import { MlInsights } from './pages/MlInsights';
import { UsersPage } from './pages/UsersPage';
import { SignalDebug } from './pages/SignalDebug';
import { SystemHealth } from './pages/SystemHealth';
import { SimulationControls } from './pages/SimulationControls';

const Guard = ({ children }: { children: JSX.Element }) => {
  return localStorage.getItem('adminToken') ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guard><Shell /></Guard>}>
          <Route index element={<Overview />} />
          <Route path="risk" element={<RiskMonitoring />} />
          <Route path="disruptions" element={<Disruptions />} />
          <Route path="claims" element={<Claims />} />
          <Route path="fraud" element={<Fraud />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="queues" element={<Queues />} />
          <Route path="ml" element={<MlInsights />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="signals" element={<SignalDebug />} />
          <Route path="health" element={<SystemHealth />} />
          <Route path="simulate" element={<SimulationControls />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
