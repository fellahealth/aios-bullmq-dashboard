import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/OverviewPage';
import QueuePage from './pages/QueuePage';
import JobPage from './pages/JobPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/queue/:queueName" element={<QueuePage />} />
        <Route path="/queue/:queueName/:jobId" element={<JobPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
