import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MetricsDashboard } from './pages/MetricsDashboard';
import { MetricsForm } from './pages/MetricsForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota da Planilha/Dashboard */}
        <Route path="/" element={<MetricsDashboard />} />
        
        {/* Rota do Formulário de Inserção */}
        <Route path="/novo" element={<MetricsForm />} />

        {/* Fallback de segurança */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;