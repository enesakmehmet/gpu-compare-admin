import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Stats {
  totalDownloads: number;
  liveActive: number;
  dailyActive: number;
  weeklyActive: number;
  monthlyActive: number;
  platformStats: { platform: string; count: number }[];
  last7Days: { date: string; count: number }[];
}

interface ExtendedStats {
  daily: { date: string; label: string; activeUsers: number; newUsers: number }[];
  weekly: { weekStart: string; weekEnd: string; label: string; activeUsers: number }[];
  monthly: { month: string; label: string; activeUsers: number }[];
  platformBreakdown: { platform: string; count: number; percentage: number }[];
}

interface RevenueStats {
  activeUsers: { daily: number; weekly: number; monthly: number };
  impressions: { dailyBanner: number; dailyInterstitial: number; weeklyBanner: number; weeklyInterstitial: number };
  estimatedRevenue: { daily: number; weekly: number; monthly: number; dailyUSD: number; monthlyUSD: number };
  disclaimer: string;
}

interface Device {
  id: number;
  deviceId: string;
  platform: string | null;
  deviceModel: string | null;
  appVersion: string | null;
  firstSeenAt: string;
  lastActiveAt: string;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, extendedRes, revenueRes, devicesRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/analytics/stats/extended'),
        api.get('/analytics/stats/revenue'),
        api.get('/analytics/devices?limit=10'),
      ]);
      setStats(statsRes.data);
      setExtendedStats(extendedRes.data);
      setRevenueStats(revenueRes.data);
      setDevices(devicesRes.data);
      setError('');
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!window.confirm('Aynı cihaz modeline ait eski kayıtlar (farklı app versiyonları) silinecek. Devam edilsin mi?')) {
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post('/analytics/cleanup-duplicates');
      setMessage({ type: 'success', text: data.message || `${data.deleted} kayıt silindi` });
      fetchData(); // Refresh
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Temizleme sırasında hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR');
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Şimdi';
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffHour < 24) return `${diffHour} saat önce`;
    return `${diffDay} gün önce`;
  };

  if (loading && !stats) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (error && !stats) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-warning" onClick={handleCleanupDuplicates}>
            🧹 Test Kayıtlarını Temizle
          </button>
          <button className="btn btn-secondary" onClick={fetchData}>
            🔄 Yenile
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      {/* Ana İstatistik Kartları */}
      <div className="stats-grid">
        <div className="stat-card stat-card--primary">
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.totalDownloads || 0}</div>
            <div className="stat-label">Toplam İndirme</div>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.liveActive || 0}</div>
            <div className="stat-label">Şu An Aktif</div>
            <div className="stat-sublabel">Son 5 dakika</div>
          </div>
        </div>

        <div className="stat-card stat-card--info">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.dailyActive || 0}</div>
            <div className="stat-label">Bugün Aktif</div>
          </div>
        </div>

        <div className="stat-card stat-card--warning">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.weeklyActive || 0}</div>
            <div className="stat-label">Bu Hafta Aktif</div>
          </div>
        </div>

        <div className="stat-card stat-card--secondary">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.monthlyActive || 0}</div>
            <div className="stat-label">Bu Ay Aktif</div>
          </div>
        </div>
      </div>

      {/* Tahmini Gelir Kartları */}
      {revenueStats && (
        <div className="revenue-section">
          <h2>💰 Tahmini Reklam Geliri</h2>
          <div className="revenue-grid">
            <div className="revenue-card">
              <div className="revenue-icon">📅</div>
              <div className="revenue-content">
                <div className="revenue-value">₺{revenueStats.estimatedRevenue.daily.toFixed(2)}</div>
                <div className="revenue-label">Günlük</div>
                <div className="revenue-usd">${revenueStats.estimatedRevenue.dailyUSD.toFixed(2)} USD</div>
              </div>
            </div>
            <div className="revenue-card">
              <div className="revenue-icon">📆</div>
              <div className="revenue-content">
                <div className="revenue-value">₺{revenueStats.estimatedRevenue.weekly.toFixed(2)}</div>
                <div className="revenue-label">Haftalık</div>
              </div>
            </div>
            <div className="revenue-card revenue-card--highlight">
              <div className="revenue-icon">🗓️</div>
              <div className="revenue-content">
                <div className="revenue-value">₺{revenueStats.estimatedRevenue.monthly.toFixed(2)}</div>
                <div className="revenue-label">Aylık</div>
                <div className="revenue-usd">${revenueStats.estimatedRevenue.monthlyUSD.toFixed(2)} USD</div>
              </div>
            </div>
          </div>
          <div className="revenue-impressions">
            <span>📊 Günlük Gösterim: Banner: {revenueStats.impressions.dailyBanner} | Interstitial: {revenueStats.impressions.dailyInterstitial}</span>
          </div>
          <p className="disclaimer">{revenueStats.disclaimer}</p>
        </div>
      )}

      {/* Alt Bölüm */}
      <div className="dashboard-row">
        {/* Platform Dağılımı */}
        <div className="dashboard-card">
          <h3>📱 Platform Dağılımı</h3>
          <div className="platform-list">
            {extendedStats?.platformBreakdown?.map((p) => (
              <div key={p.platform} className="platform-item">
                <span className="platform-name">
                  {p.platform === 'android' ? '🤖 Android' :
                    p.platform === 'ios' ? '🍎 iOS' :
                      `📱 ${p.platform}`}
                </span>
                <div className="platform-stats">
                  <span className="platform-count">{p.count}</span>
                  <span className="platform-percent">%{p.percentage}</span>
                </div>
              </div>
            ))}
            {(!extendedStats?.platformBreakdown || extendedStats.platformBreakdown.length === 0) && (
              <div className="empty-state">Henüz veri yok</div>
            )}
          </div>
        </div>

        {/* Son 7 Gün Grafiği */}
        <div className="dashboard-card">
          <h3>📈 Son 7 Gün İndirmeler</h3>
          <div className="chart-bars">
            {stats?.last7Days?.map((day) => {
              const maxCount = Math.max(...(stats.last7Days?.map(d => d.count) || [1]));
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              return (
                <div key={day.date} className="chart-bar-container">
                  <div className="chart-bar" style={{ height: `${Math.max(height, 5)}%` }}>
                    <span className="chart-bar-value">{day.count}</span>
                  </div>
                  <span className="chart-bar-label">
                    {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Son Aktif Cihazlar */}
      <div className="dashboard-card dashboard-card--full">
        <h3>📲 Son Aktif Cihazlar</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Model</th>
                <th>Versiyon</th>
                <th>İlk Görülme</th>
                <th>Son Aktif</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td>
                    <span className={`platform-badge platform-badge--${device.platform || 'unknown'}`}>
                      {device.platform === 'android' ? '🤖' : device.platform === 'ios' ? '🍎' : '📱'}
                      {' '}{device.platform || 'Bilinmiyor'}
                    </span>
                  </td>
                  <td>{device.deviceModel || '-'}</td>
                  <td>{device.appVersion || '-'}</td>
                  <td>{formatDate(device.firstSeenAt)}</td>
                  <td>
                    <span className="time-badge">
                      {formatRelativeTime(device.lastActiveAt)}
                    </span>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">Henüz cihaz kaydı yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .dashboard-page {
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 24px;
          color: #1e293b;
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          cursor: pointer;
          font-size: 14px;
        }

        .message.success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .message.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 32px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.05);
        }

        .stat-card--primary .stat-icon { background: rgba(79, 70, 229, 0.1); }
        .stat-card--success .stat-icon { background: rgba(16, 185, 129, 0.1); }
        .stat-card--info .stat-icon { background: rgba(59, 130, 246, 0.1); }
        .stat-card--warning .stat-icon { background: rgba(245, 158, 11, 0.1); }
        .stat-card--secondary .stat-icon { background: rgba(107, 114, 128, 0.1); }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }

        .stat-sublabel {
          font-size: 12px;
          color: #94a3b8;
        }

        .dashboard-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 900px) {
          .dashboard-row {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .dashboard-card--full {
          grid-column: 1 / -1;
        }

        .dashboard-card h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #1e293b;
        }

        .platform-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .platform-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .platform-name {
          font-weight: 500;
          color: #334155;
        }

        .platform-count {
          font-weight: 700;
          color: #4f46e5;
          background: rgba(79, 70, 229, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 150px;
          gap: 8px;
          padding-top: 20px;
        }

        .chart-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .chart-bar {
          width: 100%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          min-height: 20px;
          transition: height 0.3s ease;
        }

        .chart-bar-value {
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px;
        }

        .chart-bar-label {
          font-size: 11px;
          color: #64748b;
          margin-top: 8px;
          text-transform: uppercase;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table td {
          font-size: 14px;
          color: #334155;
        }

        .data-table tbody tr:hover {
          background: #f8fafc;
        }

        .platform-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .platform-badge--android {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .platform-badge--ios {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }

        .platform-badge--unknown {
          background: rgba(107, 114, 128, 0.1);
          color: #64748b;
        }

        .time-badge {
          color: #10b981;
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          color: #94a3b8;
          padding: 24px;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #64748b;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background: #d97706;
        }

        .revenue-section {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          color: white;
        }

        .revenue-section h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
        }

        .revenue-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .revenue-grid {
            grid-template-columns: 1fr;
          }
        }

        .revenue-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .revenue-card--highlight {
          background: rgba(255, 255, 255, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .revenue-icon {
          font-size: 32px;
        }

        .revenue-value {
          font-size: 28px;
          font-weight: 700;
        }

        .revenue-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .revenue-usd {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .revenue-impressions {
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 13px;
        }

        .disclaimer {
          margin: 12px 0 0 0;
          font-size: 11px;
          opacity: 0.7;
          font-style: italic;
        }

        .platform-stats {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .platform-percent {
          font-size: 12px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
