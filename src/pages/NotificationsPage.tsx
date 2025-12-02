import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

interface Notification {
  id?: number;
  title: string;
  message: string;
  category?: string;
  isActive: boolean;
  createdAt?: string;
}

const NotificationsPage: React.FC = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Notification>({
    title: '',
    message: '',
    category: 'system_recommendation',
    isActive: true,
  });

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<Notification[]>('/admin/notifications');
      setItems(res.data);
    } catch (e) {
      console.error(e);
      alert('Bildirimler alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const updateForm = (field: keyof Notification, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      category: 'system_recommendation',
      isActive: true,
    });
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      alert('Başlık ve mesaj zorunludur');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title,
        message: form.message,
        category: form.category || undefined,
        isActive: form.isActive,
      };

      if (editingId != null) {
        await api.put(`/admin/notifications/${editingId}`, payload);
      } else {
        await api.post('/admin/notifications', payload);
      }

      await loadNotifications();
      alert(editingId ? 'Bildirim güncellendi' : 'Bildirim eklendi');
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Bildirim kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (n: Notification) => {
    setForm({
      title: n.title,
      message: n.message,
      category: n.category,
      isActive: n.isActive,
    });
    setEditingId(n.id!);
  };

  const handleDelete = async (n: Notification) => {
    if (!window.confirm(`"${n.title}" bildirimini silmek istiyor musun?`)) return;
    try {
      await api.delete(`/admin/notifications/${n.id}`);
      await loadNotifications();
    } catch (err) {
      console.error(err);
      alert('Bildirim silinirken hata oluştu');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Bildirimler</h1>
        <p>Kullanıcılara gösterilecek duyuru ve bildirimleri yönetin.</p>
      </div>
      <div className="page-content">
        <div className="panel panel--form">
          <h2>{editingId ? `Bildirim Güncelle (#${editingId})` : 'Yeni Bildirim Ekle'}</h2>
          <form onSubmit={onSubmit} className="form-grid">
            <div className="form-group">
              <label>Başlık</label>
              <input
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="Bu ayın sistem tavsiyeleri hazır!"
              />
            </div>
            <div className="form-group form-group--full">
              <label>Mesaj</label>
              <textarea
                value={form.message}
                onChange={(e) => updateForm('message', e.target.value)}
                rows={3}
                placeholder="1080p ve 2K için yeni sistem tavsiyeleri yayınlandı. Uygulama içinden inceleyebilirsiniz."
              />
            </div>
            <div className="form-group">
              <label>Kategori (isteğe bağlı)</label>
              <input
                value={form.category ?? ''}
                onChange={(e) => updateForm('category', e.target.value)}
                placeholder="system_recommendation, info..."
              />
            </div>
            <div className="form-group">
              <label>Aktif mi?</label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateForm('isActive', e.target.checked)}
                />
                <span>Aktif (kullanıcılara göster)</span>
              </label>
            </div>

            <div className="form-actions">
              {editingId && (
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
                {saving ? 'Kaydediliyor...' : editingId ? 'Bildirimi Güncelle' : 'Bildirim Ekle'}
              </button>
            </div>
          </form>
        </div>

        <div className="panel panel--table">
          <div className="panel-header">
            <h2>Bildirim Listesi</h2>
            <div className="panel-header-right">
              {loading && <span className="tag">Yükleniyor...</span>}
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th>Kategori</th>
                  <th>Durum</th>
                  <th>Oluşturma</th>
                  <th style={{ width: 140 }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id ?? n.title}>
                    <td>{n.title}</td>
                    <td>{n.category ?? '-'}</td>
                    <td>{n.isActive ? 'Aktif' : 'Pasif'}</td>
                    <td>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="table-btn"
                          onClick={() => startEdit(n)}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="table-btn table-btn--danger"
                          onClick={() => handleDelete(n)}
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '12px 0' }}>
                      Henüz bildirim eklenmemiş.
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

export default NotificationsPage;
