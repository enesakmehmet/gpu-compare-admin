import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';
import DashboardPage from './pages/DashboardPage';
import CpuPage from './pages/CpuPage';
import GpuPage from './pages/GpuPage';
import RecommendedSystemsPage from './pages/RecommendedSystemsPage';
import NotificationsPage from './pages/NotificationsPage';
import PushNotificationsPage from './pages/PushNotificationsPage';
import SettingsPage from './pages/SettingsPage';

import RankingsPage from './pages/RankingsPage';
import PCBuilderPage from './pages/PCBuilderPage';
import LaptopsPage from './pages/LaptopsPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <BrowserRouter>
      <div className="app-root">
        {/* Mobile overlay */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

        <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
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
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              📊 Dashboard
            </NavLink>
            <NavLink
              to="/cpus"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              CPU&apos;lar
            </NavLink>
            <NavLink
              to="/gpus"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              GPU&apos;lar
            </NavLink>
            <NavLink
              to="/recommended-systems"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              Sistem Tavsiyeleri
            </NavLink>
            <NavLink
              to="/notifications"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              📋 Uygulama İçi Bildirim
            </NavLink>
            <NavLink
              to="/push-notifications"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              📱 Push Bildirimler
            </NavLink>
            <NavLink
              to="/settings"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              ⚙️ Ayarlar
            </NavLink>
            <NavLink
              to="/rankings"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              🏆 Benchmark Sıralaması
            </NavLink>
            <NavLink
              to="/pcbuilder"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              🖥️ PC Toplama Önerileri
            </NavLink>
            <NavLink
              to="/laptops"
              onClick={closeSidebar}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              💻 Laptop Yönetimi
            </NavLink>
          </nav>
          <div className="sidebar-footer">Sadece yönetim amaçlı kullanın</div>
        </aside>

        <div className="main">
          <header className="topbar">
            <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Menü">
              <span></span>
              <span></span>
              <span></span>
            </button>
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

              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/pcbuilder" element={<PCBuilderPage />} />
              <Route path="/laptops" element={<LaptopsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
