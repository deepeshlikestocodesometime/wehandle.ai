import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminOverview from './pages/AdminOverview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        {/* Additional admin routes like /clients or /health can be added here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;