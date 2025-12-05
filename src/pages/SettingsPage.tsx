import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
  isDefault: boolean;
}

const SettingsPage: React.FC = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/config');
      setConfigs(data);

      // Edit values'ı başlat
      const values: Record<string, string> = {};
      data.forEach((c: ConfigItem) => {
        values[c.key] = c.value;
      });
      setEditValues(values);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Ayarlar yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      const config = configs.find(c => c.key === key);

      await api.post('/admin/config', {
        key,
        value: editValues[key],
        description: config?.description,
      });

      setMessage({ type: 'success', text: `"${getDisplayName(key)}" ayarı güncellendi` });
      fetchConfigs();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Ayar güncellenemedi' });
    } finally {
      setSaving(false);
    }
  };

  const getDisplayName = (key: string): string => {
    const names: Record<string, string> = {
      requiredAdsCount: 'Gereken Reklam Sayısı',
      adUnlockDurationHours: 'Kilit Açık Kalma Süresi (Saat)',
    };
    return names[key] || key;
  };

  const getIcon = (key: string): string => {
    const icons: Record<string, string> = {
      requiredAdsCount: '🎬',
      adUnlockDurationHours: '⏰',
    };
    return icons[key] || '⚙️';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Uygulama Ayarları</h1>
        <p className="page-subtitle">Uygulama davranışlarını buradan yönetin</p>
      </div>

      {message && (
        <div className={`message ${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="settings-grid">
        {/* Reklam Ayarları */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span className="settings-icon">📺</span>
            <h2>Reklam Ayarları</h2>
          </div>
          <p className="settings-card-description">
            Sistem tavsiyeleri bölümü için reklam izleme gereksinimleri
          </p>

          <div className="settings-items">
            {configs
              .filter(c => ['requiredAdsCount', 'adUnlockDurationHours'].includes(c.key))
              .map(config => (
                <div key={config.key} className="setting-item">
                  <div className="setting-info">
                    <span className="setting-icon">{getIcon(config.key)}</span>
                    <div>
                      <label className="setting-label">{getDisplayName(config.key)}</label>
                      <p className="setting-description">{config.description}</p>
                    </div>
                  </div>
                  <div className="setting-control">
                    <input
                      type="number"
                      min="0"
                      value={editValues[config.key] || ''}
                      onChange={(e) => setEditValues({ ...editValues, [config.key]: e.target.value })}
                      className="setting-input"
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSave(config.key)}
                      disabled={saving || editValues[config.key] === config.value}
                    >
                      {saving ? '...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Bilgi Kartı */}
        <div className="settings-card info-card">
          <div className="settings-card-header">
            <span className="settings-icon">💡</span>
            <h2>Nasıl Çalışır?</h2>
          </div>
          <div className="info-content">
            <div className="info-item">
              <strong>Gereken Reklam Sayısı:</strong>
              <p>Kullanıcıların sistem tavsiyeleri bölümünü açmak için izlemesi gereken reklam adedi.</p>
            </div>
            <div className="info-item">
              <strong>Kilit Açık Kalma Süresi:</strong>
              <p>Kullanıcı gereken reklamları izledikten sonra bölümün kaç saat açık kalacağı.</p>
            </div>
            <div className="info-item info-warning">
              <strong>⚠️ Not:</strong>
              <p>Değişiklikler anında uygulamaya yansır. Yeni açılan uygulamalarda güncel değerler kullanılır.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .page-container {
          padding: 24px;
        }
        .page-header {
          margin-bottom: 32px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .page-subtitle {
          color: var(--text-secondary);
          font-size: 14px;
        }
        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          cursor: pointer;
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
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
        .settings-card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--border-color);
        }
        .settings-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .settings-card-header h2 {
          font-size: 18px;
          margin: 0;
        }
        .settings-icon {
          font-size: 24px;
        }
        .settings-card-description {
          color: var(--text-secondary);
          font-size: 13px;
          margin-bottom: 24px;
        }
        .settings-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 12px;
          gap: 16px;
        }
        .setting-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }
        .setting-icon {
          font-size: 20px;
          padding-top: 2px;
        }
        .setting-label {
          font-weight: 600;
          font-size: 14px;
          display: block;
          margin-bottom: 4px;
        }
        .setting-description {
          color: var(--text-secondary);
          font-size: 12px;
          margin: 0;
        }
        .setting-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .setting-input {
          width: 80px;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 16px;
          font-weight: 600;
          text-align: center;
        }
        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--primary-color);
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--primary-hover);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }
        .info-card {
          background: linear-gradient(135deg, var(--card-bg), rgba(99, 102, 241, 0.05));
        }
        .info-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .info-item strong {
          display: block;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .info-item p {
          color: var(--text-secondary);
          font-size: 12px;
          margin: 0;
          line-height: 1.5;
        }
        .info-warning {
          background: rgba(234, 179, 8, 0.1);
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #eab308;
        }
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
