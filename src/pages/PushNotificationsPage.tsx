import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

interface PushToken {
    id: number;
    token: string;
    deviceId: string;
    platform?: string;
    deviceModel?: string;
    isActive: boolean;
    updatedAt: string;
}

interface PushLog {
    id: number;
    title: string;
    body: string;
    sentCount: number;
    successCount: number;
    failCount: number;
    sentAt: string;
}

interface SendStats {
    totalDevices: number;
    successCount: number;
    failCount: number;
    invalidTokensRemoved: number;
}

const PushNotificationsPage: React.FC = () => {
    const [tokens, setTokens] = useState<PushToken[]>([]);
    const [logs, setLogs] = useState<PushLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [lastSendResult, setLastSendResult] = useState<SendStats | null>(null);
    const [form, setForm] = useState({
        title: '',
        body: '',
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [tokensRes, logsRes] = await Promise.all([
                api.get<{ tokens: PushToken[] }>('/admin/push-tokens'),
                api.get<PushLog[]>('/admin/push/logs'),
            ]);
            setTokens(tokensRes.data.tokens || []);
            setLogs(logsRes.data || []);
        } catch (e) {
            console.error(e);
            alert('Veriler alınırken hata oluştu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.body) {
            alert('Başlık ve mesaj zorunludur');
            return;
        }

        if (!window.confirm(`"${form.title}" başlıklı bildirimi ${tokens.length} cihaza göndermek istiyor musunuz?`)) {
            return;
        }

        try {
            setSending(true);
            setLastSendResult(null);
            const res = await api.post<{ stats: SendStats }>('/admin/push/send', {
                title: form.title,
                body: form.body,
                data: { type: 'admin_push' },
            });
            setLastSendResult(res.data.stats);
            alert('Bildirim başarıyla gönderildi!');
            setForm({ title: '', body: '' });
            await loadData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Bildirim gönderilirken hata oluştu');
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('tr-TR');
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>📱 Push Bildirimler</h1>
                <p>Tüm kullanıcılara anlık bildirim gönderin (uygulama kapalı olsa bile)</p>
            </div>

            <div className="page-content">
                {/* İstatistikler */}
                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                            📲
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{tokens.length}</span>
                            <span className="stat-label">Kayıtlı Cihaz</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                            📤
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{logs.length}</span>
                            <span className="stat-label">Gönderilen Bildirim</span>
                        </div>
                    </div>
                    {lastSendResult && (
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                                📊
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{lastSendResult.successCount}/{lastSendResult.totalDevices}</span>
                                <span className="stat-label">Son Gönderim Başarı</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bildirim Gönder Formu */}
                <div className="panel panel--form">
                    <h2>🚀 Yeni Push Bildirim Gönder</h2>
                    <form onSubmit={handleSend} className="form-grid">
                        <div className="form-group">
                            <label>Başlık</label>
                            <input
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="Yeni sistem tavsiyeleri hazır!"
                                maxLength={50}
                            />
                            <small style={{ color: '#94A3B8', fontSize: '12px' }}>{form.title.length}/50 karakter</small>
                        </div>
                        <div className="form-group form-group--full">
                            <label>Mesaj</label>
                            <textarea
                                value={form.body}
                                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                                rows={3}
                                placeholder="Aralık ayı için yeni 1080p ve 2K sistem tavsiyeleri yayınlandı. Hemen inceleyin!"
                                maxLength={200}
                            />
                            <small style={{ color: '#94A3B8', fontSize: '12px' }}>{form.body.length}/200 karakter</small>
                        </div>
                        <div className="form-actions">
                            <button type="submit" disabled={sending || tokens.length === 0}>
                                {sending ? '⏳ Gönderiliyor...' : `📤 ${tokens.length} Cihaza Gönder`}
                            </button>
                        </div>
                    </form>
                    {tokens.length === 0 && (
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#F59E0B' }}>
                            ⚠️ Henüz kayıtlı cihaz yok. Kullanıcılar uygulamayı açtığında otomatik kaydolacaklar.
                        </div>
                    )}
                </div>

                {/* Gönderim Geçmişi */}
                <div className="panel panel--table">
                    <div className="panel-header">
                        <h2>📋 Gönderim Geçmişi</h2>
                        <div className="panel-header-right">
                            {loading && <span className="tag">Yükleniyor...</span>}
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Başlık</th>
                                    <th>Mesaj</th>
                                    <th>Gönderildi</th>
                                    <th>Başarılı</th>
                                    <th>Başarısız</th>
                                    <th>Tarih</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{log.title}</td>
                                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.body}
                                        </td>
                                        <td>{log.sentCount}</td>
                                        <td style={{ color: '#10B981' }}>{log.successCount}</td>
                                        <td style={{ color: log.failCount > 0 ? '#EF4444' : '#94A3B8' }}>{log.failCount}</td>
                                        <td>{formatDate(log.sentAt)}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8' }}>
                                            Henüz bildirim gönderilmemiş.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Kayıtlı Cihazlar */}
                <div className="panel panel--table">
                    <div className="panel-header">
                        <h2>📱 Kayıtlı Cihazlar</h2>
                        <div className="panel-header-right">
                            <span className="tag">{tokens.length} cihaz</span>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Platform</th>
                                    <th>Cihaz Modeli</th>
                                    <th>Durum</th>
                                    <th>Son Güncelleme</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tokens.slice(0, 20).map((token) => (
                                    <tr key={token.id}>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: token.platform === 'android' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                                                color: token.platform === 'android' ? '#10B981' : '#6366F1',
                                                textTransform: 'uppercase',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}>
                                                {token.platform || 'Bilinmiyor'}
                                            </span>
                                        </td>
                                        <td>{token.deviceModel || 'Bilinmiyor'}</td>
                                        <td>
                                            <span style={{ color: token.isActive ? '#10B981' : '#EF4444' }}>
                                                {token.isActive ? '✓ Aktif' : '✗ Pasif'}
                                            </span>
                                        </td>
                                        <td>{formatDate(token.updatedAt)}</td>
                                    </tr>
                                ))}
                                {tokens.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8' }}>
                                            Henüz kayıtlı cihaz yok.
                                        </td>
                                    </tr>
                                )}
                                {tokens.length > 20 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '12px 0', color: '#94A3B8' }}>
                                            ... ve {tokens.length - 20} cihaz daha
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PushNotificationsPage;
