import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

interface GPU {
    id: number;
    brand: string;
    model: string;
    slug: string;
}

interface CPU {
    id: number;
    brand: string;
    model: string;
    slug: string;
}

interface GPURanking {
    id: number;
    gpuId: number;
    rank: number;
    score: number;
    category: string;
    description?: string;
    isActive: boolean;
    gpu?: GPU;
}

interface CPURanking {
    id: number;
    cpuId: number;
    rank: number;
    score: number;
    category: string;
    description?: string;
    isActive: boolean;
    cpu?: CPU;
}

const RankingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'gpu' | 'cpu'>('gpu');
    const [gpuRankings, setGpuRankings] = useState<GPURanking[]>([]);
    const [cpuRankings, setCpuRankings] = useState<CPURanking[]>([]);
    const [availableGPUs, setAvailableGPUs] = useState<GPU[]>([]);
    const [availableCPUs, setAvailableCPUs] = useState<CPU[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [category, setCategory] = useState('general');

    const [newItem, setNewItem] = useState({
        id: 0,
        rank: 1,
        score: 0,
        category: 'general',
        description: '',
        isActive: true,
    });

    const loadGPURankings = useCallback(async () => {
        try {
            setLoading(true);
            const [rankingsRes, availableRes] = await Promise.all([
                api.get(`/admin/rankings/gpu?category=${category}`),
                api.get('/admin/rankings/gpu/available'),
            ]);
            setGpuRankings(rankingsRes.data);
            setAvailableGPUs(availableRes.data);
        } catch (error) {
            console.error('Failed to load GPU rankings:', error);
        } finally {
            setLoading(false);
        }
    }, [category]);

    const loadCPURankings = useCallback(async () => {
        try {
            setLoading(true);
            const [rankingsRes, availableRes] = await Promise.all([
                api.get(`/admin/rankings/cpu?category=${category}`),
                api.get('/admin/rankings/cpu/available'),
            ]);
            setCpuRankings(rankingsRes.data);
            setAvailableCPUs(availableRes.data);
        } catch (error) {
            console.error('Failed to load CPU rankings:', error);
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        if (activeTab === 'gpu') {
            loadGPURankings();
        } else {
            loadCPURankings();
        }
    }, [activeTab, category, loadGPURankings, loadCPURankings]);

    const handleAdd = async () => {
        if (!newItem.id || !newItem.score) {
            alert('Lütfen tüm alanları doldurun');
            return;
        }

        try {
            const endpoint = activeTab === 'gpu' ? '/admin/rankings/gpu' : '/admin/rankings/cpu';
            const payload = activeTab === 'gpu'
                ? { gpuId: newItem.id, ...newItem }
                : { cpuId: newItem.id, ...newItem };

            await api.post(endpoint, payload);
            setShowAddModal(false);
            setNewItem({ id: 0, rank: 1, score: 0, category: 'general', description: '', isActive: true });

            if (activeTab === 'gpu') {
                loadGPURankings();
            } else {
                loadCPURankings();
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Ekleme başarısız');
        }
    };

    const handleDelete = async (itemId: number) => {
        if (!window.confirm('Bu öğeyi sıralamadan kaldırmak istediğinize emin misiniz?')) {
            return;
        }

        try {
            const endpoint = activeTab === 'gpu'
                ? `/admin/rankings/gpu/${itemId}`
                : `/admin/rankings/cpu/${itemId}`;
            await api.delete(endpoint);

            if (activeTab === 'gpu') {
                loadGPURankings();
            } else {
                loadCPURankings();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;

        const rankings = activeTab === 'gpu' ? [...gpuRankings] : [...cpuRankings];
        const temp = rankings[index].rank;
        rankings[index].rank = rankings[index - 1].rank;
        rankings[index - 1].rank = temp;

        try {
            const endpoint = activeTab === 'gpu' ? '/admin/rankings/gpu/reorder' : '/admin/rankings/cpu/reorder';
            const payload = activeTab === 'gpu'
                ? { rankings: rankings.map(r => ({ gpuId: r.gpuId, rank: r.rank })) }
                : { rankings: rankings.map((r: any) => ({ cpuId: r.cpuId, rank: r.rank })) };

            await api.put(endpoint, payload);

            if (activeTab === 'gpu') {
                loadGPURankings();
            } else {
                loadCPURankings();
            }
        } catch (error) {
            console.error('Reorder failed:', error);
        }
    };

    const handleMoveDown = async (index: number) => {
        const rankings = activeTab === 'gpu' ? gpuRankings : cpuRankings;
        if (index === rankings.length - 1) return;

        const newRankings = [...rankings];
        const temp = newRankings[index].rank;
        newRankings[index].rank = newRankings[index + 1].rank;
        newRankings[index + 1].rank = temp;

        try {
            const endpoint = activeTab === 'gpu' ? '/admin/rankings/gpu/reorder' : '/admin/rankings/cpu/reorder';
            const payload = activeTab === 'gpu'
                ? { rankings: newRankings.map(r => ({ gpuId: r.gpuId, rank: r.rank })) }
                : { rankings: newRankings.map((r: any) => ({ cpuId: r.cpuId, rank: r.rank })) };

            await api.put(endpoint, payload);

            if (activeTab === 'gpu') {
                loadGPURankings();
            } else {
                loadCPURankings();
            }
        } catch (error) {
            console.error('Reorder failed:', error);
        }
    };

    return (
        <div className="rankings-page">
            <div className="page-header">
                <h1>🏆 Benchmark Sıralaması</h1>
                <p>GPU ve CPU benchmark sıralamalarını yönetin</p>
            </div>

            <div className="rankings-controls">
                <div className="tab-buttons">
                    <button
                        className={`tab-btn ${activeTab === 'gpu' ? 'active' : ''}`}
                        onClick={() => setActiveTab('gpu')}
                    >
                        🎮 GPU Sıralaması
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'cpu' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cpu')}
                    >
                        💻 CPU Sıralaması
                    </button>
                </div>

                <div className="filter-controls">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="category-select"
                    >
                        <option value="general">Genel</option>
                        <option value="gaming">Oyun</option>
                        <option value="workstation">İş İstasyonu</option>
                        <option value="productivity">Üretkenlik</option>
                    </select>

                    <button
                        className="add-btn"
                        onClick={() => {
                            setNewItem({
                                id: 0,
                                rank: (activeTab === 'gpu' ? gpuRankings.length : cpuRankings.length) + 1,
                                score: 0,
                                category,
                                description: '',
                                isActive: true
                            });
                            setShowAddModal(true);
                        }}
                    >
                        ➕ Yeni Ekle
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Yükleniyor...</div>
            ) : (
                <div className="rankings-table-container">
                    <table className="rankings-table">
                        <thead>
                            <tr>
                                <th>Sıra</th>
                                <th>{activeTab === 'gpu' ? 'GPU' : 'CPU'}</th>
                                <th>Skor</th>
                                <th>Kategori</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'gpu' ? (
                                gpuRankings.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="rank-cell">
                                            <span className="rank-badge">#{item.rank}</span>
                                        </td>
                                        <td className="name-cell">
                                            <strong>{item.gpu?.brand} {item.gpu?.model}</strong>
                                            {item.description && <small>{item.description}</small>}
                                        </td>
                                        <td className="score-cell">{item.score.toLocaleString()}</td>
                                        <td>
                                            <span className="category-badge">{item.category}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                                                {item.isActive ? '✓ Aktif' : '✗ Pasif'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="action-btn"
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0}
                                            >
                                                ⬆️
                                            </button>
                                            <button
                                                className="action-btn"
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === gpuRankings.length - 1}
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDelete(item.gpuId)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                cpuRankings.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="rank-cell">
                                            <span className="rank-badge">#{item.rank}</span>
                                        </td>
                                        <td className="name-cell">
                                            <strong>{item.cpu?.brand} {item.cpu?.model}</strong>
                                            {item.description && <small>{item.description}</small>}
                                        </td>
                                        <td className="score-cell">{item.score.toLocaleString()}</td>
                                        <td>
                                            <span className="category-badge">{item.category}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                                                {item.isActive ? '✓ Aktif' : '✗ Pasif'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="action-btn"
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0}
                                            >
                                                ⬆️
                                            </button>
                                            <button
                                                className="action-btn"
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === cpuRankings.length - 1}
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDelete(item.cpuId)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {((activeTab === 'gpu' && gpuRankings.length === 0) ||
                                (activeTab === 'cpu' && cpuRankings.length === 0)) && (
                                    <tr>
                                        <td colSpan={6} className="empty-cell">
                                            Henüz sıralama eklenmemiş. "Yeni Ekle" butonunu kullanarak ekleyin.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>➕ Sıralamaya Ekle</h2>

                        <div className="form-group">
                            <label>{activeTab === 'gpu' ? 'GPU Seç' : 'CPU Seç'}</label>
                            <select
                                value={newItem.id}
                                onChange={(e) => setNewItem({ ...newItem, id: parseInt(e.target.value) })}
                            >
                                <option value={0}>-- Seçin --</option>
                                {activeTab === 'gpu' ? (
                                    availableGPUs.map(gpu => (
                                        <option key={gpu.id} value={gpu.id}>
                                            {gpu.brand} {gpu.model}
                                        </option>
                                    ))
                                ) : (
                                    availableCPUs.map(cpu => (
                                        <option key={cpu.id} value={cpu.id}>
                                            {cpu.brand} {cpu.model}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Sıra</label>
                                <input
                                    type="number"
                                    value={newItem.rank}
                                    onChange={(e) => setNewItem({ ...newItem, rank: parseInt(e.target.value) })}
                                    min={1}
                                />
                            </div>
                            <div className="form-group">
                                <label>Skor</label>
                                <input
                                    type="number"
                                    value={newItem.score}
                                    onChange={(e) => setNewItem({ ...newItem, score: parseInt(e.target.value) })}
                                    placeholder="Benchmark skoru"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Kategori</label>
                            <select
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            >
                                <option value="general">Genel</option>
                                <option value="gaming">Oyun</option>
                                <option value="workstation">İş İstasyonu</option>
                                <option value="productivity">Üretkenlik</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Açıklama (Opsiyonel)</label>
                            <input
                                type="text"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="Örn: En iyi fiyat/performans"
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                                İptal
                            </button>
                            <button className="btn-save" onClick={handleAdd}>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .rankings-page {
                    padding: 20px;
                }
                .page-header h1 {
                    margin: 0 0 8px 0;
                    font-size: 24px;
                }
                .page-header p {
                    margin: 0;
                    color: #64748b;
                }
                .rankings-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 24px 0;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .tab-buttons {
                    display: flex;
                    gap: 8px;
                }
                .tab-btn {
                    padding: 10px 20px;
                    border: none;
                    background: #1e293b;
                    color: #94a3b8;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .tab-btn.active {
                    background: #6366f1;
                    color: white;
                }
                .filter-controls {
                    display: flex;
                    gap: 12px;
                }
                .category-select {
                    padding: 10px 16px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                }
                .add-btn {
                    padding: 10px 20px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                }
                .rankings-table-container {
                    background: #0f172a;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #1e293b;
                }
                .rankings-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .rankings-table th {
                    background: #1e293b;
                    padding: 14px;
                    text-align: left;
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 13px;
                    text-transform: uppercase;
                }
                .rankings-table td {
                    padding: 14px;
                    border-top: 1px solid #1e293b;
                    color: #e2e8f0;
                }
                .rank-cell {
                    width: 80px;
                }
                .rank-badge {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 14px;
                }
                .name-cell strong {
                    display: block;
                }
                .name-cell small {
                    color: #64748b;
                    font-size: 12px;
                }
                .score-cell {
                    font-weight: 700;
                    color: #10b981;
                    font-size: 16px;
                }
                .category-badge {
                    background: #334155;
                    color: #e2e8f0;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    text-transform: capitalize;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .status-badge.active {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                }
                .status-badge.inactive {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                }
                .actions-cell {
                    display: flex;
                    gap: 8px;
                }
                .action-btn {
                    padding: 6px 10px;
                    background: #334155;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-btn:hover {
                    background: #475569;
                }
                .action-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .action-btn.delete:hover {
                    background: #ef4444;
                }
                .empty-cell {
                    text-align: center;
                    padding: 40px !important;
                    color: #64748b;
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #64748b;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal {
                    background: #0f172a;
                    border-radius: 16px;
                    padding: 24px;
                    width: 100%;
                    max-width: 500px;
                    border: 1px solid #1e293b;
                }
                .modal h2 {
                    margin: 0 0 20px 0;
                    color: #f1f5f9;
                }
                .form-group {
                    margin-bottom: 16px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 6px;
                    color: #94a3b8;
                    font-size: 13px;
                }
                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 10px 14px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 24px;
                }
                .btn-cancel {
                    padding: 10px 20px;
                    background: #334155;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }
                .btn-save {
                    padding: 10px 20px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default RankingsPage;
