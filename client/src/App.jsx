import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Step1Connect from './pages/Step1Connect';
import Step2Train from './pages/Step2Train';
import Step3BrandVoice from './pages/Step3BrandVoice';
import Overview from './pages/dashboard/Overview';
import Inbox from './pages/dashboard/Inbox';
import IntelligenceHub from './pages/dashboard/IntelligenceHub';
import Settings from './pages/dashboard/Settings';
import Landing from './pages/Landing';
import { authApi } from './lib/api';

function DashboardGate({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const token = localStorage.getItem('wehandle_token');
      if (!token) {
        if (mounted) setStatus('auth_missing');
        return;
      }
      try {
        const me = await authApi.getMe();
        const step = me?.merchant?.onboarding_step ?? 1;
        if (!mounted) return;
        if (step >= 5) {
          setStatus('ok');
        } else {
          setStatus(`step_${step}`);
        }
      } catch {
        if (mounted) setStatus('auth_missing');
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'loading') return null;
  if (status === 'auth_missing') return <Navigate to="/auth" replace />;
  if (status === 'ok') return children;
  if (status === 'step_1') return <Navigate to="/step-1" replace />;
  if (status === 'step_2') return <Navigate to="/step-2" replace />;
  if (status === 'step_3' || status === 'step_4') return <Navigate to="/step-3" replace />;
  return <Navigate to="/step-1" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/step-1" element={<Step1Connect />} />
        <Route path="/step-2" element={<Step2Train />} />
        <Route path="/step-3" element={<Step3BrandVoice />} />
        <Route path="/step-4" element={<Navigate to="/step-3" replace />} />

        <Route path="/dashboard" element={<DashboardGate><Overview /></DashboardGate>} />
        <Route path="/dashboard/inbox" element={<DashboardGate><Inbox /></DashboardGate>} />
        <Route path="/dashboard/training" element={<DashboardGate><IntelligenceHub /></DashboardGate>} />
        <Route path="/dashboard/settings" element={<DashboardGate><Settings /></DashboardGate>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
