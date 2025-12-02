import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

interface RecommendedSystem {
  id?: number;
  title: string;
  slug: string;
  resolution: string; // 1080p, 1440p, 4k
  category?: string;
  cpu: string;
  motherboard: string;
  gpu: string;
  ram: string;
  storage: string;
  psu: string;
  pcCase: string;
  notes?: string;
}

const RecommendedSystemsPage: React.FC = () => {
  const [systems, setSystems] = useState<RecommendedSystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [resolutionFilter, setResolutionFilter] = useState<'all' | '1080p' | '1440p'>('all');
  const [form, setForm] = useState<RecommendedSystem>({
    title: '',
    slug: '',
    resolution: '1080p',
    category: 'Ayın Sistemi',
    cpu: '',
    motherboard: '',
    gpu: '',
    ram: '',
    storage: '',
    psu: '',
    pcCase: '',
    notes: '',
  });

  const loadSystems = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (resolutionFilter !== 'all') {
        params.resolution = resolutionFilter;
      }
      const res = await api.get<RecommendedSystem[]>('/admin/recommended-systems', { params });
      setSystems(res.data);
    } catch (e) {
      console.error(e);
      alert('Sistem tavsiyeleri alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [resolutionFilter]);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const updateForm = (field: keyof RecommendedSystem, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      resolution: '1080p',
      category: 'Ayın Sistemi',
      cpu: '',
      motherboard: '',
      gpu: '',
      ram: '',
      storage: '',
      psu: '',
      pcCase: '',
      notes: '',
    });
    setEditingSlug(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.resolution) {
      alert('Başlık, slug ve çözünürlük zorunludur');
      return;
    }
    if (!form.cpu || !form.motherboard || !form.gpu || !form.ram || !form.storage || !form.psu || !form.pcCase) {
      alert('CPU, anakart, GPU, RAM, SSD, PSU ve kasa alanları zorunludur');
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form };
      if (editingSlug) {
        await api.put(`/admin/recommended-systems/${editingSlug}`, payload);
      } else {
        await api.post('/admin/recommended-systems', payload);
      }
      await loadSystems();
      alert(editingSlug ? 'Sistem güncellendi' : 'Sistem eklendi');
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Sistem kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (system: RecommendedSystem) => {
    setForm({
      title: system.title,
      slug: system.slug,
      resolution: system.resolution,
      category: system.category,
      cpu: system.cpu,
      motherboard: system.motherboard,
      gpu: system.gpu,
      ram: system.ram,
      storage: system.storage,
      psu: system.psu,
      pcCase: system.pcCase,
      notes: system.notes,
    });
    setEditingSlug(system.slug);
  };

  const handleDelete = async (system: RecommendedSystem) => {
    if (!window.confirm(`${system.title} silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await api.delete(`/admin/recommended-systems/${system.slug}`);
      await loadSystems();
    } catch (err) {
      console.error(err);
      alert('Sistem silinirken hata oluştu');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sistem Tavsiyeleri</h1>
        <p>1080p ve 2K için ayın sistem tavsiyelerini yönet.</p>
      </div>
      <div className="page-content">
        <div className="panel panel--form">
          <h2>{editingSlug ? `Sistem Güncelle (${editingSlug})` : 'Yeni Sistem Ekle'}</h2>
          <form onSubmit={onSubmit} className="form-grid">
            <div className="form-group">
              <label>Başlık</label>
              <input
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="1080p Gaming Entry"
              />
            </div>
            <div className="form-group">
              <label>Slug</label>
              <input
                value={form.slug}
                onChange={(e) => updateForm('slug', e.target.value)}
                placeholder="1080p-gaming-entry"
                disabled={!!editingSlug}
              />
            </div>
            <div className="form-group">
              <label>Çözünürlük</label>
              <select
                value={form.resolution}
                onChange={(e) => updateForm('resolution', e.target.value)}
              >
                <option value="1080p">1080p</option>
                <option value="1440p">1440p</option>
                <option value="4k">4K</option>
              </select>
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <input
                value={form.category ?? ''}
                onChange={(e) => updateForm('category', e.target.value)}
                placeholder="Ayın Sistemi, Mid Range..."
              />
            </div>

            <div className="form-group">
              <label>CPU</label>
              <input
                value={form.cpu}
                onChange={(e) => updateForm('cpu', e.target.value)}
                placeholder="Ryzen 5 5600 + soğutucu"
              />
            </div>
            <div className="form-group">
              <label>Anakart</label>
              <input
                value={form.motherboard}
                onChange={(e) => updateForm('motherboard', e.target.value)}
                placeholder="B550, Z690..."
              />
            </div>
            <div className="form-group">
              <label>Ekran Kartı</label>
              <input
                value={form.gpu}
                onChange={(e) => updateForm('gpu', e.target.value)}
                placeholder="RTX 3060, RX 6700 XT..."
              />
            </div>
            <div className="form-group">
              <label>RAM</label>
              <input
                value={form.ram}
                onChange={(e) => updateForm('ram', e.target.value)}
                placeholder="16GB DDR4 3600MHz"
              />
            </div>
            <div className="form-group">
              <label>Depolama (SSD)</label>
              <input
                value={form.storage}
                onChange={(e) => updateForm('storage', e.target.value)}
                placeholder="1TB NVMe SSD"
              />
            </div>
            <div className="form-group">
              <label>PSU</label>
              <input
                value={form.psu}
                onChange={(e) => updateForm('psu', e.target.value)}
                placeholder="650W 80+ Bronze"
              />
            </div>
            <div className="form-group">
              <label>Kasa</label>
              <input
                value={form.pcCase}
                onChange={(e) => updateForm('pcCase', e.target.value)}
                placeholder="Mesh ön panel, 3 fan"
              />
            </div>

            <div className="form-group form-group--full">
              <label>Notlar</label>
              <textarea
                value={form.notes ?? ''}
                onChange={(e) => updateForm('notes', e.target.value)}
                rows={3}
                placeholder="İsteğe bağlı yorum, upgrade önerileri vb."
              />
            </div>

            <div className="form-actions">
              {editingSlug && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  İptal
                </button>
              )}
              <button type="submit" disabled={saving}>
                {saving ? 'Kaydediliyor...' : editingSlug ? 'Sistemi Güncelle' : 'Sistem Ekle'}
              </button>
            </div>
          </form>
        </div>

        <div className="panel panel--table">
          <div className="panel-header">
            <h2>Sistem Listesi</h2>
            <div className="panel-header-right">
              <select
                className="filter-select"
                value={resolutionFilter}
                onChange={(e) => setResolutionFilter(e.target.value as 'all' | '1080p' | '1440p')}
              >
                <option value="all">Tümü</option>
                <option value="1080p">1080p</option>
                <option value="1440p">1440p</option>
                <option value="4k" disabled>
                  4K (ileride)
                </option>
              </select>
              {loading && <span className="tag">Yükleniyor...</span>}
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th>Çözünürlük</th>
                  <th>Kategori</th>
                  <th>CPU</th>
                  <th>GPU</th>
                  <th style={{ width: 140 }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {systems.map((s) => (
                  <tr key={s.id ?? s.slug}>
                    <td>{s.title}</td>
                    <td>{s.resolution}</td>
                    <td>{s.category ?? '-'}</td>
                    <td>{s.cpu}</td>
                    <td>{s.gpu}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-btn"
                          onClick={() => startEdit(s)}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="table-btn table-btn--danger"
                          onClick={() => handleDelete(s)}
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendedSystemsPage;
