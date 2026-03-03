import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Step1Connect from './pages/Step1Connect';
import Step2Train from './pages/Step2Train';
import Step3BrandVoice from './pages/Step3BrandVoice';
import Step4Install from './pages/Step4Install';
import Overview from './pages/dashboard/Overview';
import Inbox from './pages/dashboard/Inbox';
import IntelligenceHub from './pages/dashboard/IntelligenceHub';
import Settings from './pages/dashboard/Settings';
import Landing from './pages/Landing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication: The Front Door */}
         <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Navigate to="/auth" replace />} />

        {/* Onboarding Flow */}
        <Route path="/" element={<Navigate to="/step-1" replace />} />
        <Route path="/step-1" element={<Step1Connect />} />
        <Route path="/step-2" element={<Step2Train />} />
        <Route path="/step-3" element={<Step3BrandVoice />} />
        <Route path="/step-4" element={<Step4Install />} />

        {/* Client Dashboard */}
        <Route path="/dashboard" element={<Overview />} />
        <Route path="/dashboard/inbox" element={<Inbox />} />
        <Route path="/dashboard/training" element={<IntelligenceHub />} />
        <Route path="/dashboard/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;