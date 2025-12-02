import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

interface GpuBenchmarks {
  timeSpy?: number;
  passmark?: number;
}

interface Gpu {
  id?: number;
  brand: string;
  model: string;
  slug: string;
  cudaCores?: number;
  streamProcessors?: number;
  baseClock?: number;
  boostClock?: number;
  vramGB: number;
  vramType: string;
  tdp?: number;
  pcie?: string;
  outputs?: string[];
  cooling?: string;
  releaseYear?: number;
  directx?: string;
  benchmarks?: GpuBenchmarks;
  fps?: {
    games: Record<string, {
      '1080p'?: number;
      '1440p'?: number;
      '4k'?: number;
    }>;
  };
}

interface GameRow {
  name: string;
  p1080?: string;
  p1440?: string;
  p4k?: string;
}

const GpuPage: React.FC = () => {
  const [gpus, setGpus] = useState<Gpu[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brandFilter, setBrandFilter] = useState<'all' | 'NVIDIA' | 'AMD'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Gpu>>({
    brand: 'NVIDIA',
    vramGB: 8,
    vramType: 'GDDR6',
  });
  const [bench, setBench] = useState<GpuBenchmarks>({});
  const [outputs, setOutputs] = useState('');
  const [gameRows, setGameRows] = useState<GameRow[]>([
    { name: 'Cyberpunk 2077' },
    { name: 'Red Dead Redemption 2' },
    { name: 'Fortnite' },
  ]);

  const loadGpus = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 200, sort: 'year' };
      if (brandFilter !== 'all') {
        params.brand = brandFilter;
      }
      const res = await api.get<Gpu[]>('/gpus', { params });
      setGpus(res.data);
    } catch (e) {
      console.error(e);
      alert('GPU listesi alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [brandFilter]);

  useEffect(() => {
    loadGpus();
  }, [loadGpus]);

  const updateForm = (field: keyof Gpu, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateBench = (field: keyof GpuBenchmarks, value: any) => {
    setBench((prev) => ({ ...prev, [field]: value }));
  };

  const updateGameRow = (index: number, field: keyof GameRow, value: string) => {
    setGameRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addGameRow = () => {
    setGameRows((prev) => [...prev, { name: '' }]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.slug || form.vramGB == null || !form.vramType) {
      alert('Marka, model, slug, vramGB ve vramType zorunludur');
      return;
    }

    const games: Record<string, { '1080p'?: number; '1440p'?: number; '4k'?: number }> = {};
    for (const row of gameRows) {
      if (!row.name) continue;
      const entry: { '1080p'?: number; '1440p'?: number; '4k'?: number } = {};
      if (row.p1080) entry['1080p'] = Number(row.p1080);
      if (row.p1440) entry['1440p'] = Number(row.p1440);
      if (row.p4k) entry['4k'] = Number(row.p4k);
      if (Object.keys(entry).length > 0) {
        games[row.name] = entry;
      }
    }

    const fps = Object.keys(games).length > 0 ? games : undefined;

    try {
      setSaving(true);
      const payload = {
        ...form,
        vramGB: Number(form.vramGB),
        cudaCores: form.cudaCores ? Number(form.cudaCores) : undefined,
        streamProcessors: form.streamProcessors ? Number(form.streamProcessors) : undefined,
        baseClock: form.baseClock ? Number(form.baseClock) : undefined,
        boostClock: form.boostClock ? Number(form.boostClock) : undefined,
        tdp: form.tdp ? Number(form.tdp) : undefined,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
        outputs,
        benchmarks: {
          timeSpy: bench.timeSpy ? Number(bench.timeSpy) : undefined,
          passmark: bench.passmark ? Number(bench.passmark) : undefined,
        },
        fps,
      };

      if (editingSlug) {
        await api.put(`/admin/gpus/${editingSlug}`, payload);
      } else {
        await api.post('/admin/gpus', payload);
      }
      await loadGpus();
      alert(editingSlug ? 'GPU güncellendi' : 'GPU eklendi');
    } catch (err) {
      console.error(err);
      alert('GPU eklenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (gpu: Gpu) => {
    setForm({
      brand: gpu.brand,
      model: gpu.model,
      slug: gpu.slug,
      cudaCores: gpu.cudaCores,
      streamProcessors: gpu.streamProcessors,
      baseClock: gpu.baseClock,
      boostClock: gpu.boostClock,
      vramGB: gpu.vramGB,
      vramType: gpu.vramType,
      tdp: gpu.tdp,
      pcie: gpu.pcie,
      cooling: gpu.cooling,
      releaseYear: gpu.releaseYear,
      directx: gpu.directx,
    });
    setBench({
      timeSpy: gpu.benchmarks?.timeSpy,
      passmark: gpu.benchmarks?.passmark,
    });
    setOutputs(gpu.outputs ? gpu.outputs.join(', ') : '');

    if (gpu.fps?.games) {
      const rows: GameRow[] = Object.entries(gpu.fps.games).map(([name, values]) => ({
        name,
        p1080: values['1080p']?.toString() ?? '',
        p1440: values['1440p']?.toString() ?? '',
        p4k: values['4k']?.toString() ?? '',
      }));
      setGameRows(rows.length > 0 ? rows : [{ name: '' }]);
    }

    setEditingSlug(gpu.slug);
  };

  const cancelEdit = () => {
    setForm({
      brand: 'NVIDIA',
      vramGB: 8,
      vramType: 'GDDR6',
    });
    setBench({});
    setOutputs('');
    setGameRows([
      { name: 'Cyberpunk 2077' },
      { name: 'Red Dead Redemption 2' },
      { name: 'Fortnite' },
    ]);
    setEditingSlug(null);
  };

  const handleDelete = async (gpu: Gpu) => {
    if (!window.confirm(`${gpu.model} silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await api.delete(`/admin/gpus/${gpu.slug}`);
      await loadGpus();
    } catch (err) {
      console.error(err);
      alert('GPU silinirken hata oluştu');
    }
  };

  const filtered = gpus.filter((gpu) =>
    searchQuery
      ? gpu.model.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <div className="page">
      <div className="page-header">
        <h1>GPU Yönetimi</h1>
        <p>Yeni ekran kartı ekle ve mevcutları listele.</p>
      </div>
      <div className="page-content">
        <div className="panel panel--form">
          <h2>{editingSlug ? `GPU Güncelle (${editingSlug})` : 'Yeni GPU Ekle'}</h2>
          <form onSubmit={onSubmit} className="form-grid">
            <div className="form-group">
              <label>Marka</label>
              <select
                value={form.brand ?? ''}
                onChange={(e) => updateForm('brand', e.target.value)}
              >
                <option value="NVIDIA">NVIDIA</option>
                <option value="AMD">AMD</option>
              </select>
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                value={form.model ?? ''}
                onChange={(e) => updateForm('model', e.target.value)}
                placeholder="RTX 4070 Super"
              />
            </div>
            <div className="form-group">
              <label>Slug</label>
              <input
                value={form.slug ?? ''}
                onChange={(e) => updateForm('slug', e.target.value)}
                placeholder="nvidia-rtx-4070-super"
                disabled={!!editingSlug}
              />
            </div>
            <div className="form-group">
              <label>VRAM (GB)</label>
              <input
                type="number"
                value={form.vramGB ?? ''}
                onChange={(e) => updateForm('vramGB', Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>VRAM Tipi</label>
              <input
                value={form.vramType ?? ''}
                onChange={(e) => updateForm('vramType', e.target.value)}
                placeholder="GDDR6X"
              />
            </div>
            <div className="form-group">
              <label>Cuda Cores / Stream Processors</label>
              <input
                type="number"
                value={form.cudaCores ?? form.streamProcessors ?? ''}
                onChange={(e) => updateForm('cudaCores', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Base Clock (MHz)</label>
              <input
                type="number"
                value={form.baseClock ?? ''}
                onChange={(e) => updateForm('baseClock', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Boost Clock (MHz)</label>
              <input
                type="number"
                value={form.boostClock ?? ''}
                onChange={(e) => updateForm('boostClock', e.target.value)}
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
              <label>PCIe</label>
              <input
                value={form.pcie ?? ''}
                onChange={(e) => updateForm('pcie', e.target.value)}
                placeholder="4.0 x16"
              />
            </div>
            <div className="form-group">
              <label>Çıkışlar (virgülle)</label>
              <input
                value={outputs}
                onChange={(e) => setOutputs(e.target.value)}
                placeholder="HDMI 2.1, DP 1.4a"
              />
            </div>
            <div className="form-group">
              <label>Sogutma</label>
              <input
                value={form.cooling ?? ''}
                onChange={(e) => updateForm('cooling', e.target.value)}
                placeholder="Triple-fan"
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
              <label>DirectX</label>
              <input
                value={form.directx ?? ''}
                onChange={(e) => updateForm('directx', e.target.value)}
                placeholder="12 Ultimate"
              />
            </div>

            <div className="form-group">
              <label>TimeSpy</label>
              <input
                type="number"
                value={bench.timeSpy ?? ''}
                onChange={(e) => updateBench('timeSpy', e.target.value)}
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

            <div className="form-group form-group--full">
              <label>FPS (oyun bazlı)</label>
              <div className="fps-grid">
                <div className="fps-row fps-row--head">
                  <div>Oyun</div>
                  <div>1080p</div>
                  <div>1440p</div>
                  <div>4K</div>
                </div>
                {gameRows.map((row, index) => (
                  <div key={index} className="fps-row">
                    <input
                      className="fps-cell"
                      placeholder="Oyun adı"
                      value={row.name}
                      onChange={(e) => updateGameRow(index, 'name', e.target.value)}
                    />
                    <input
                      className="fps-cell"
                      type="number"
                      value={row.p1080 ?? ''}
                      onChange={(e) => updateGameRow(index, 'p1080', e.target.value)}
                    />
                    <input
                      className="fps-cell"
                      type="number"
                      value={row.p1440 ?? ''}
                      onChange={(e) => updateGameRow(index, 'p1440', e.target.value)}
                    />
                    <input
                      className="fps-cell"
                      type="number"
                      value={row.p4k ?? ''}
                      onChange={(e) => updateGameRow(index, 'p4k', e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <button type="button" className="fps-add" onClick={addGameRow}>
                + Satır Ekle
              </button>
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
                {saving ? 'Kaydediliyor...' : editingSlug ? 'GPU Güncelle' : 'GPU Ekle'}
              </button>
            </div>
          </form>
        </div>

        <div className="panel panel--table">
          <div className="panel-header">
            <h2>GPU Listesi</h2>
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
                  setBrandFilter(e.target.value as 'all' | 'NVIDIA' | 'AMD');
                  setPage(1);
                }}
              >
                <option value="all">Tümü</option>
                <option value="NVIDIA">NVIDIA</option>
                <option value="AMD">AMD</option>
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
                  <th>VRAM</th>
                  <th>Yıl</th>
                  <th>TimeSpy</th>
                  <th style={{ width: 140 }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((gpu) => (
                  <tr key={gpu.id ?? gpu.slug}>
                    <td>{gpu.brand}</td>
                    <td>{gpu.model}</td>
                    <td>{gpu.vramGB} GB</td>
                    <td>{gpu.releaseYear ?? '-'}</td>
                    <td>{gpu.benchmarks?.timeSpy ?? '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-btn"
                          onClick={() => startEdit(gpu)}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="table-btn table-btn--danger"
                          onClick={() => handleDelete(gpu)}
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

export default GpuPage;
