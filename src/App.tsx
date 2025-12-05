import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';
import DashboardPage from './pages/DashboardPage';
import CpuPage from './pages/CpuPage';
import GpuPage from './pages/GpuPage';
import RecommendedSystemsPage from './pages/RecommendedSystemsPage';
import NotificationsPage from './pages/NotificationsPage';
import PushNotificationsPage from './pages/PushNotificationsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">DK</div>
            <div className="logo-text">
              <span className="logo-title">Donanım Kıyasla</span>
              <span className="logo-sub">Admin Panel</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              📊 Dashboard
            </NavLink>
            <NavLink
              to="/cpus"
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              CPU&apos;lar
            </NavLink>
            <NavLink
              to="/gpus"
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              GPU&apos;lar
            </NavLink>
            <NavLink
              to="/recommended-systems"
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              Sistem Tavsiyeleri
            </NavLink>
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              📋 Uygulama İçi Bildirim
            </NavLink>
            <NavLink
              to="/push-notifications"
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              📱 Push Bildirimler
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              ⚙️ Ayarlar
            </NavLink>
          </nav>
          <div className="sidebar-footer">Sadece yönetim amaçlı kullanın</div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="topbar-title">Veri Yönetimi</div>
            <div className="topbar-user">Admin</div>
          </header>

          <main className="main-content">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/cpus" element={<CpuPage />} />
              <Route path="/gpus" element={<GpuPage />} />
              <Route path="/recommended-systems" element={<RecommendedSystemsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/push-notifications" element={<PushNotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
