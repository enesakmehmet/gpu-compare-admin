import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface MonitoringStats {
    overview: {
        totalRequests: number;
        todayRequests: number;
        last24HoursRequests: number;
        lastHourRequests: number;
        requestsPerMinute: number;
    };
    errors: {
        totalErrors24h: number;
        serverErrors: number;
        clientErrors: number;
        errorRate: string;
    };
    performance: {
        avgResponseTime: number;
        slowestEndpoints: Array<{ path: string; avgTime: number; count: number }>;
    };
    rateLimit: {
        exceeded24h: number;
    };
    topEndpoints: Array<{ path: string; count: number }>;
    errorEndpoints: Array<{ path: string; count: number }>;
    methodDistribution: Array<{ method: string; count: number }>;
    statusDistribution: Array<{ statusCode: number; count: number }>;
    dailyTrend: Array<{ date: string; count: number; avg_response_time: number; error_count: number }>;
}

interface RecentRequest {
    id: number;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    ip: string;
    createdAt: string;
    error?: string;
}

interface SystemHealth {
    status: string;
    timestamp: string;
    uptime: number;
    database: { status: string; responseTime: number };
    memory: { heapUsed: number; heapTotal: number; rss: number };
    nodeVersion: string;
}

const MonitoringPage: React.FC = () => {
    const [stats, setStats] = useState<MonitoringStats | null>(null);
    const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'health'>('overview');
    const [requestFilter, setRequestFilter] = useState<'all' | 'error' | 'success'>('all');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Her 30 saniyede güncelle
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'requests') {
            loadRecentRequests();
        }
    }, [activeTab, requestFilter]);

    const loadData = async () => {
        try {
            const [statsRes, healthRes] = await Promise.all([
                api.get('/monitoring/stats'),
                api.get('/monitoring/health'),
            ]);
            setStats(statsRes.data);
            setHealth(healthRes.data);
        } catch (error) {
            console.error('Failed to load monitoring data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRecentRequests = async () => {
        try {
            const res = await api.get(`/monitoring/requests?limit=100&status=${requestFilter === 'all' ? '' : requestFilter}`);
            setRecentRequests(res.data);
        } catch (error) {
            console.error('Failed to load recent requests:', error);
        }
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}g ${hours}s ${mins}d`;
    };

    const getStatusColor = (code: number) => {
        if (code < 300) return '#10b981';
        if (code < 400) return '#f59e0b';
        if (code < 500) return '#ef4444';
        return '#dc2626';
    };

    const getMethodColor = (method: string) => {
        const colors: Record<string, string> = {
            GET: '#10b981',
            POST: '#3b82f6',
            PUT: '#f59e0b',
            DELETE: '#ef4444',
            PATCH: '#8b5cf6',
        };
        return colors[method] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="monitoring-loading">
                <div className="loading-spinner"></div>
                <p>Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="monitoring-page">
            <div className="monitoring-header">
                <h1>📊 API Monitoring</h1>
                <div className="tab-buttons">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Genel Bakış
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Son İstekler
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
                        onClick={() => setActiveTab('health')}
                    >
                        Sistem Sağlığı
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && stats && (
                <div className="monitoring-content">
                    {/* Overview Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📈</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.overview.last24HoursRequests.toLocaleString()}</div>
                                <div className="stat-label">Son 24 Saat İstek</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⚡</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.overview.requestsPerMinute}/dk</div>
                                <div className="stat-label">İstek/Dakika</div>
                            </div>
                        </div>
                        <div className="stat-card error">
                            <div className="stat-icon">⚠️</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.errors.totalErrors24h}</div>
                                <div className="stat-label">Hata ({stats.errors.errorRate})</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⏱️</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.performance.avgResponseTime}ms</div>
                                <div className="stat-label">Ort. Yanıt Süresi</div>
                            </div>
                        </div>
                        <div className="stat-card warning">
                            <div className="stat-icon">🚫</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.rateLimit.exceeded24h}</div>
                                <div className="stat-label">Rate Limit Aşımı</div>
                            </div>
                        </div>
                    </div>

                    {/* Error Breakdown */}
                    <div className="section-grid">
                        <div className="section-card">
                            <h3>🔴 Hata Dağılımı (24 Saat)</h3>
                            <div className="error-breakdown">
                                <div className="error-item">
                                    <span className="error-label">5xx Server Errors</span>
                                    <span className="error-value danger">{stats.errors.serverErrors}</span>
                                </div>
                                <div className="error-item">
                                    <span className="error-label">4xx Client Errors</span>
                                    <span className="error-value warning">{stats.errors.clientErrors}</span>
                                </div>
                            </div>
                        </div>

                        <div className="section-card">
                            <h3>📊 HTTP Method Dağılımı</h3>
                            <div className="method-distribution">
                                {stats.methodDistribution.map((m) => (
                                    <div key={m.method} className="method-item">
                                        <span
                                            className="method-badge"
                                            style={{ backgroundColor: getMethodColor(m.method) }}
                                        >
                                            {m.method}
                                        </span>
                                        <span className="method-count">{m.count.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Endpoints */}
                    <div className="section-grid">
                        <div className="section-card">
                            <h3>🔥 En Çok İstek Alan Endpoint'ler</h3>
                            <div className="endpoint-list">
                                {stats.topEndpoints.slice(0, 5).map((e, i) => (
                                    <div key={e.path} className="endpoint-item">
                                        <span className="endpoint-rank">#{i + 1}</span>
                                        <span className="endpoint-path">{e.path}</span>
                                        <span className="endpoint-count">{e.count.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="section-card">
                            <h3>🐢 En Yavaş Endpoint'ler</h3>
                            <div className="endpoint-list">
                                {stats.performance.slowestEndpoints.slice(0, 5).map((e, i) => (
                                    <div key={e.path} className="endpoint-item">
                                        <span className="endpoint-rank">#{i + 1}</span>
                                        <span className="endpoint-path">{e.path}</span>
                                        <span className="endpoint-time">{e.avgTime}ms</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error Endpoints */}
                    {stats.errorEndpoints.length > 0 && (
                        <div className="section-card full-width">
                            <h3>❌ En Çok Hata Alan Endpoint'ler</h3>
                            <div className="endpoint-list">
                                {stats.errorEndpoints.map((e, i) => (
                                    <div key={e.path} className="endpoint-item error">
                                        <span className="endpoint-rank">#{i + 1}</span>
                                        <span className="endpoint-path">{e.path}</span>
                                        <span className="endpoint-count error">{e.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status Distribution */}
                    <div className="section-card full-width">
                        <h3>📋 Status Code Dağılımı</h3>
                        <div className="status-distribution">
                            {stats.statusDistribution.map((s) => (
                                <div key={s.statusCode} className="status-item">
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(s.statusCode) }}
                                    >
                                        {s.statusCode}
                                    </span>
                                    <span className="status-count">{s.count.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="monitoring-content">
                    <div className="requests-header">
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${requestFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setRequestFilter('all')}
                            >
                                Tümü
                            </button>
                            <button
                                className={`filter-btn ${requestFilter === 'success' ? 'active' : ''}`}
                                onClick={() => setRequestFilter('success')}
                            >
                                Başarılı
                            </button>
                            <button
                                className={`filter-btn ${requestFilter === 'error' ? 'active' : ''}`}
                                onClick={() => setRequestFilter('error')}
                            >
                                Hatalar
                            </button>
                        </div>
                        <button className="refresh-btn" onClick={loadRecentRequests}>
                            🔄 Yenile
                        </button>
                    </div>

                    <div className="requests-table-container">
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th>Zaman</th>
                                    <th>Method</th>
                                    <th>Path</th>
                                    <th>Status</th>
                                    <th>Süre</th>
                                    <th>IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRequests.map((req) => (
                                    <tr key={req.id} className={req.statusCode >= 400 ? 'error-row' : ''}>
                                        <td className="time-cell">
                                            {new Date(req.createdAt).toLocaleTimeString('tr-TR')}
                                        </td>
                                        <td>
                                            <span
                                                className="method-badge small"
                                                style={{ backgroundColor: getMethodColor(req.method) }}
                                            >
                                                {req.method}
                                            </span>
                                        </td>
                                        <td className="path-cell" title={req.path}>
                                            {req.path.length > 40 ? req.path.substring(0, 40) + '...' : req.path}
                                        </td>
                                        <td>
                                            <span
                                                className="status-badge small"
                                                style={{ backgroundColor: getStatusColor(req.statusCode) }}
                                            >
                                                {req.statusCode}
                                            </span>
                                        </td>
                                        <td className={req.responseTime > 1000 ? 'slow' : ''}>
                                            {req.responseTime}ms
                                        </td>
                                        <td className="ip-cell">{req.ip || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'health' && health && (
                <div className="monitoring-content">
                    <div className="health-grid">
                        <div className={`health-card ${health.status === 'healthy' ? 'healthy' : 'unhealthy'}`}>
                            <div className="health-status">
                                {health.status === 'healthy' ? '✅' : '❌'}
                            </div>
                            <h3>Sistem Durumu</h3>
                            <p className="status-text">{health.status === 'healthy' ? 'Sağlıklı' : 'Sorunlu'}</p>
                        </div>

                        <div className="health-card">
                            <div className="health-icon">⏰</div>
                            <h3>Uptime</h3>
                            <p className="health-value">{formatUptime(health.uptime)}</p>
                        </div>

                        <div className="health-card">
                            <div className="health-icon">🗄️</div>
                            <h3>Veritabanı</h3>
                            <p className="health-value">{health.database.responseTime}ms</p>
                            <p className="health-sub">{health.database.status}</p>
                        </div>

                        <div className="health-card">
                            <div className="health-icon">💾</div>
                            <h3>Memory (Heap)</h3>
                            <p className="health-value">{health.memory.heapUsed} / {health.memory.heapTotal} MB</p>
                        </div>

                        <div className="health-card">
                            <div className="health-icon">📦</div>
                            <h3>RSS Memory</h3>
                            <p className="health-value">{health.memory.rss} MB</p>
                        </div>

                        <div className="health-card">
                            <div className="health-icon">🟢</div>
                            <h3>Node Version</h3>
                            <p className="health-value">{health.nodeVersion}</p>
                        </div>
                    </div>

                    <div className="last-updated">
                        Son güncelleme: {new Date(health.timestamp).toLocaleString('tr-TR')}
                    </div>
                </div>
            )}

            <style>{`
        .monitoring-page {
          padding: 20px;
        }
        .monitoring-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .monitoring-header h1 {
          margin: 0;
          font-size: 24px;
          color: #1f2937;
        }
        .tab-buttons {
          display: flex;
          gap: 8px;
        }
        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: #6366f1;
          color: white;
        }
        .tab-btn:hover:not(.active) {
          background: #d1d5db;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .stat-card.error {
          border-left: 4px solid #ef4444;
        }
        .stat-card.warning {
          border-left: 4px solid #f59e0b;
        }
        .stat-icon {
          font-size: 32px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
        }
        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }

        .section-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .section-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .section-card.full-width {
          grid-column: 1 / -1;
        }
        .section-card h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #374151;
        }

        .error-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .error-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .error-value.danger { color: #dc2626; font-weight: 600; }
        .error-value.warning { color: #f59e0b; font-weight: 600; }

        .method-distribution {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .method-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .method-badge {
          padding: 4px 12px;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          font-size: 12px;
        }
        .method-badge.small {
          padding: 2px 8px;
          font-size: 11px;
        }

        .endpoint-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .endpoint-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .endpoint-item.error {
          background: #fef2f2;
        }
        .endpoint-rank {
          font-weight: 600;
          color: #6b7280;
          min-width: 30px;
        }
        .endpoint-path {
          flex: 1;
          font-family: monospace;
          font-size: 13px;
          color: #374151;
        }
        .endpoint-count {
          font-weight: 600;
          color: #6366f1;
        }
        .endpoint-count.error {
          color: #ef4444;
        }
        .endpoint-time {
          font-weight: 600;
          color: #f59e0b;
        }

        .status-distribution {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          font-size: 12px;
        }
        .status-badge.small {
          padding: 2px 8px;
          font-size: 11px;
        }

        .requests-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .filter-buttons {
          display: flex;
          gap: 8px;
        }
        .filter-btn {
          padding: 6px 14px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }
        .refresh-btn {
          padding: 8px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .requests-table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .requests-table {
          width: 100%;
          border-collapse: collapse;
        }
        .requests-table th {
          background: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 13px;
        }
        .requests-table td {
          padding: 10px 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 13px;
        }
        .requests-table tr.error-row {
          background: #fef2f2;
        }
        .time-cell {
          color: #6b7280;
          font-family: monospace;
        }
        .path-cell {
          font-family: monospace;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ip-cell {
          color: #6b7280;
          font-family: monospace;
        }
        .slow {
          color: #ef4444;
          font-weight: 600;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .health-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .health-card.healthy {
          border: 2px solid #10b981;
        }
        .health-card.unhealthy {
          border: 2px solid #ef4444;
        }
        .health-status {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .health-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .health-card h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6b7280;
        }
        .health-value {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
        .health-sub {
          font-size: 12px;
          color: #10b981;
          margin: 4px 0 0 0;
        }
        .last-updated {
          text-align: center;
          margin-top: 24px;
          color: #6b7280;
          font-size: 13px;
        }

        .monitoring-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default MonitoringPage;
