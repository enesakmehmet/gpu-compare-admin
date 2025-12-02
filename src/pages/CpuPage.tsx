import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

interface CpuBenchmarks {
  passmark?: number;
  cinebenchS?: number;
  cinebenchM?: number;
}

interface Cpu {
  id?: number;
  brand: string;
  model: string;
  slug: string;
  cores?: number;
  threads?: number;
  baseClockMHz?: number;
  boostClockMHz?: number;
  tdp?: number;
  lithographyNm?: number;
  socket?: string;
  releaseYear?: number;
  benchmarks?: CpuBenchmarks;
}

const CpuPage: React.FC = () => {
  const [cpus, setCpus] = useState<Cpu[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brandFilter, setBrandFilter] = useState<'all' | 'AMD' | 'Intel'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<Cpu>({
    brand: 'AMD',
    model: '',
    slug: '',
  });
  const [bench, setBench] = useState<CpuBenchmarks>({});

  const loadCpus = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 200, sort: 'year' };
      if (brandFilter !== 'all') {
        params.brand = brandFilter;
      }
      const res = await api.get<Cpu[]>('/cpus', { params });
      setCpus(res.data);
    } catch (e) {
      console.error(e);
      alert('CPU listesi alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [brandFilter]);

  useEffect(() => {
    loadCpus();
  }, [loadCpus]);

  const updateForm = (field: keyof Cpu, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateBench = (field: keyof CpuBenchmarks, value: any) => {
    setBench((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.slug) {
      alert('Marka, model ve slug zorunludur');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        cores: form.cores ? Number(form.cores) : undefined,
        threads: form.threads ? Number(form.threads) : undefined,
        baseClockMHz: form.baseClockMHz ? Number(form.baseClockMHz) : undefined,
        boostClockMHz: form.boostClockMHz ? Number(form.boostClockMHz) : undefined,
        tdp: form.tdp ? Number(form.tdp) : undefined,
        lithographyNm: form.lithographyNm ? Number(form.lithographyNm) : undefined,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
        benchmarks: {
          passmark: bench.passmark ? Number(bench.passmark) : undefined,
          cinebenchS: bench.cinebenchS ? Number(bench.cinebenchS) : undefined,
          cinebenchM: bench.cinebenchM ? Number(bench.cinebenchM) : undefined,
        },
      };

      if (editingSlug) {
        await api.put(`/admin/cpus/${editingSlug}`, payload);
      } else {
        await api.post('/admin/cpus', payload);
      }
      await loadCpus();
      alert(editingSlug ? 'CPU güncellendi' : 'CPU eklendi');
    } catch (err) {
      console.error(err);
      alert('CPU eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cpu: Cpu) => {
    setForm({
      brand: cpu.brand,
      model: cpu.model,
      slug: cpu.slug,
      cores: cpu.cores,
      threads: cpu.threads,
      baseClockMHz: cpu.baseClockMHz,
      boostClockMHz: cpu.boostClockMHz,
      tdp: cpu.tdp,
      lithographyNm: cpu.lithographyNm,
      socket: cpu.socket,
      releaseYear: cpu.releaseYear,
    });
    setBench({
      passmark: cpu.benchmarks?.passmark,
      cinebenchS: cpu.benchmarks?.cinebenchS,
      cinebenchM: cpu.benchmarks?.cinebenchM,
    });
    setEditingSlug(cpu.slug);
  };

  const cancelEdit = () => {
    setForm({
      brand: 'AMD',
      model: '',
      slug: '',
    });
    setBench({});
    setEditingSlug(null);
  };

  const handleDelete = async (cpu: Cpu) => {
    if (!window.confirm(`${cpu.model} silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await api.delete(`/admin/cpus/${cpu.slug}`);
      await loadCpus();
    } catch (err) {
      console.error(err);
      alert('CPU silinirken hata oluştu');
    }
  };

  const filtered = cpus.filter((cpu) =>
    searchQuery
      ? cpu.model.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <div className="page">
      <div className="page-header">
        <h1>CPU Yönetimi</h1>
        <p>Yeni işlemci ekle ve mevcutları listele.</p>
      </div>
      <div className="page-content">
        <div className="panel panel--form">
          <h2>{editingSlug ? `CPU Güncelle (${editingSlug})` : 'Yeni CPU Ekle'}</h2>
          <form onSubmit={onSubmit} className="form-grid">
            <div className="form-group">
              <label>Marka</label>
              <select
                value={form.brand}
                onChange={(e) => updateForm('brand', e.target.value)}
              >
                <option value="AMD">AMD</option>
                <option value="Intel">Intel</option>
              </select>
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                value={form.model}
                onChange={(e) => updateForm('model', e.target.value)}
                placeholder="Ryzen 7 7800X3D"
              />
            </div>
            <div className="form-group">
              <label>Slug</label>
              <input
                value={form.slug}
                onChange={(e) => updateForm('slug', e.target.value)}
                placeholder="amd-ryzen-7-7800x3d"
                disabled={!!editingSlug}
              />
            </div>
            <div className="form-group">
              <label>Çekirdek (cores)</label>
              <input
                type="number"
                value={form.cores ?? ''}
                onChange={(e) => updateForm('cores', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Thread (threads)</label>
              <input
                type="number"
                value={form.threads ?? ''}
                onChange={(e) => updateForm('threads', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Base Clock (MHz)</label>
              <input
                type="number"
                value={form.baseClockMHz ?? ''}
                onChange={(e) => updateForm('baseClockMHz', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Boost Clock (MHz)</label>
              <input
                type="number"
                value={form.boostClockMHz ?? ''}
                onChange={(e) => updateForm('boostClockMHz', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>TDP (W)</label>
              <input
                type="number"
                value={form.tdp ?? ''}
                onChange={(e) => updateForm('tdp', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Lithography (nm)</label>
              <input
                type="number"
                value={form.lithographyNm ?? ''}
                onChange={(e) => updateForm('lithographyNm', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Socket</label>
              <input
                value={form.socket ?? ''}
                onChange={(e) => updateForm('socket', e.target.value)}
                placeholder="AM5, LGA1700..."
              />
            </div>
            <div className="form-group">
              <label>Çıkış Yılı</label>
              <input
                type="number"
                value={form.releaseYear ?? ''}
                onChange={(e) => updateForm('releaseYear', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Passmark</label>
              <input
                type="number"
                value={bench.passmark ?? ''}
                onChange={(e) => updateBench('passmark', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Cinebench Single</label>
              <input
                type="number"
                value={bench.cinebenchS ?? ''}
                onChange={(e) => updateBench('cinebenchS', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Cinebench Multi</label>
              <input
                type="number"
                value={bench.cinebenchM ?? ''}
                onChange={(e) => updateBench('cinebenchM', e.target.value)}
              />
            </div>

            <div className="form-actions">
              {editingSlug && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  İptal
                </button>
              )}
              <button type="submit" disabled={saving}>
                {saving ? 'Kaydediliyor...' : editingSlug ? 'CPU Güncelle' : 'CPU Ekle'}
              </button>
            </div>
          </form>
        </div>

        <div className="panel panel--table">
          <div className="panel-header">
            <h2>CPU Listesi</h2>
            <div className="panel-header-right">
              <input
                className="search-input"
                placeholder="Model ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
              <select
                className="filter-select"
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value as 'all' | 'AMD' | 'Intel');
                  setPage(1);
                }}
              >
                <option value="all">Tümü</option>
                <option value="AMD">AMD</option>
                <option value="Intel">Intel</option>
              </select>
              {loading && <span className="tag">Yükleniyor...</span>}
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Marka</th>
                  <th>Model</th>
                  <th>Çekirdek</th>
                  <th>Thread</th>
                  <th>Yıl</th>
                  <th>Passmark</th>
                  <th style={{ width: 140 }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((cpu) => (
                  <tr key={cpu.id ?? cpu.slug}>
                    <td>{cpu.brand}</td>
                    <td>{cpu.model}</td>
                    <td>{cpu.cores ?? '-'}</td>
                    <td>{cpu.threads ?? '-'}</td>
                    <td>{cpu.releaseYear ?? '-'}</td>
                    <td>{cpu.benchmarks?.passmark ?? '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-btn"
                          onClick={() => startEdit(cpu)}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="table-btn table-btn--danger"
                          onClick={() => handleDelete(cpu)}
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(1)}
              >
                «
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CpuPage;
