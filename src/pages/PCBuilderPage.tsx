import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

// Types
interface Motherboard {
    id: number;
    brand: string;
    model: string;
    slug: string;
    socket: string;
    chipset: string;
    formFactor: string;
    ramType: string;
    ramSlots: number;
    maxRamGB: number;
    m2Slots: number;
    hasWifi: boolean;
    isActive: boolean;
}

interface RAM {
    id: number;
    brand: string;
    model: string;
    slug: string;
    type: string;
    capacityGB: number;
    speedMHz: number;
    sticks: number;
    latency?: string;
    isActive: boolean;
}

interface Storage {
    id: number;
    brand: string;
    model: string;
    slug: string;
    type: string;
    interface: string;
    capacityGB: number;
    readSpeedMBs?: number;
    writeSpeedMBs?: number;
    isActive: boolean;
}

interface PSU {
    id: number;
    brand: string;
    model: string;
    slug: string;
    wattage: number;
    efficiency: string;
    modular: string;
    formFactor: string;
    isActive: boolean;
}

interface PCCase {
    id: number;
    brand: string;
    model: string;
    slug: string;
    formFactor: string;
    maxGpuLengthMM: number;
    maxCoolerHeightMM: number;
    driveBays25: number;
    driveBays35: number;
    isActive: boolean;
}

interface Cooler {
    id: number;
    brand: string;
    model: string;
    slug: string;
    type: string;
    maxTDP: number;
    heightMM?: number;
    sockets: string[];
    isActive: boolean;
}

type ComponentType = 'motherboard' | 'ram' | 'storage' | 'psu' | 'case' | 'cooler';

const sockets = ['AM4', 'AM5', 'LGA1700', 'LGA1200', 'LGA1151'];
const ramTypes = ['DDR4', 'DDR5'];
const formFactors = ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'];
const efficiencies = ['80+ Bronze', '80+ Gold', '80+ Platinum', '80+ Titanium'];
const coolerTypes = ['Air', 'AIO-120', 'AIO-240', 'AIO-280', 'AIO-360'];

const PCBuilderPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ComponentType>('motherboard');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data states
    const [motherboards, setMotherboards] = useState<Motherboard[]>([]);
    const [rams, setRams] = useState<RAM[]>([]);
    const [storages, setStorages] = useState<Storage[]>([]);
    const [psus, setPsus] = useState<PSU[]>([]);
    const [cases, setCases] = useState<PCCase[]>([]);
    const [coolers, setCoolers] = useState<Cooler[]>([]);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [mbRes, ramRes, storageRes, psuRes, caseRes, coolerRes] = await Promise.all([
                api.get<Motherboard[]>('/pcbuilder/motherboards'),
                api.get<RAM[]>('/pcbuilder/rams'),
                api.get<Storage[]>('/pcbuilder/storages'),
                api.get<PSU[]>('/pcbuilder/psus'),
                api.get<PCCase[]>('/pcbuilder/cases'),
                api.get<Cooler[]>('/pcbuilder/coolers'),
            ]);
            setMotherboards(mbRes.data);
            setRams(ramRes.data);
            setStorages(storageRes.data);
            setPsus(psuRes.data);
            setCases(caseRes.data);
            setCoolers(coolerRes.data);
        } catch (e) {
            console.error('Load error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const endpoint = `/pcbuilder/admin/${activeTab === 'case' ? 'cases' : activeTab + 's'}`;

            if (editingSlug) {
                await api.put(`${endpoint}/${editingSlug}`, formData);
            } else {
                await api.post(endpoint, formData);
            }

            setShowForm(false);
            setFormData({});
            setEditingSlug(null);
            await loadData();
            alert('✅ Kaydedildi!');
        } catch (e: any) {
            alert(e.response?.data?.error || 'Hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (slug: string) => {
        if (!window.confirm('Silmek istediğinize emin misiniz?')) return;

        try {
            const endpoint = `/pcbuilder/admin/${activeTab === 'case' ? 'cases' : activeTab + 's'}/${slug}`;
            await api.delete(endpoint);
            await loadData();
            alert('✅ Silindi!');
        } catch (e: any) {
            alert(e.response?.data?.error || 'Silme hatası');
        }
    };

    const handleEdit = (item: any) => {
        setFormData(item);
        setEditingSlug(item.slug);
        setShowForm(true);
    };

    const handleNew = () => {
        setFormData({});
        setEditingSlug(null);
        setShowForm(true);
    };

    const renderForm = () => {
        switch (activeTab) {
            case 'motherboard':
                return (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Marka</label>
                                <input value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="ASUS" />
                            </div>
                            <div className="form-group">
                                <label>Model</label>
                                <input value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="ROG STRIX B650-A" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Socket</label>
                                <select value={formData.socket || ''} onChange={e => setFormData({ ...formData, socket: e.target.value })}>
                                    <option value="">Seçin</option>
                                    {sockets.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Chipset</label>
                                <input value={formData.chipset || ''} onChange={e => setFormData({ ...formData, chipset: e.target.value })} placeholder="B650" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Form Factor</label>
                                <select value={formData.formFactor || ''} onChange={e => setFormData({ ...formData, formFactor: e.target.value })}>
                                    <option value="">Seçin</option>
                                    {formFactors.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>RAM Tipi</label>
                                <select value={formData.ramType || ''} onChange={e => setFormData({ ...formData, ramType: e.target.value })}>
                                    <option value="">Seçin</option>
                                    {ramTypes.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>RAM Slot</label>
                                <input type="number" value={formData.ramSlots || 4} onChange={e => setFormData({ ...formData, ramSlots: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label>Max RAM (GB)</label>
                                <input type="number" value={formData.maxRamGB || 128} onChange={e => setFormData({ ...formData, maxRamGB: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label>M.2 Slot</label>
                                <input type="number" value={formData.m2Slots || 2} onChange={e => setFormData({ ...formData, m2Slots: parseInt(e.target.value) })} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>
                                <input type="checkbox" checked={formData.hasWifi || false} onChange={e => setFormData({ ...formData, hasWifi: e.target.checked })} />
                                WiFi Var
                            </label>
                        </div>
                    </>
                );
            case 'ram':
                return (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Marka</label>
                                <input value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Corsair" />
                            </div>
                            <div className="form-group">
                                <label>Model</label>
                                <input value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="Vengeance RGB 32GB" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tip</label>
                                <select value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="">Seçin</option>
                                    {ramTypes.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Kapasite (GB)</label>
                                <input type="number" value={formData.capacityGB || ''} onChange={e => setFormData({ ...formData, capacityGB: parseInt(e.target.value) })} placeholder="32" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Hız (MHz)</label>
                                <input type="number" value={formData.speedMHz || ''} onChange={e => setFormData({ ...formData, speedMHz: parseInt(e.target.value) })} placeholder="5600" />
                            </div>
                            <div className="form-group">
                                <label>Kit Sayısı</label>
                                <input type="number" value={formData.sticks || 2} onChange={e => setFormData({ ...formData, sticks: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label>Latency</label>
                                <input value={formData.latency || ''} onChange={e => setFormData({ ...formData, latency: e.target.value })} placeholder="CL36" />
                            </div>
                        </div>
                    </>
                );
            case 'storage':
                return (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Marka</label>
                                <input value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Samsung" />
                            </div>
                            <div className="form-group">
                                <label>Model</label>
                                <input value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="990 Pro 2TB" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tip</label>
                                <select value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="">Seçin</option>
                                    <option value="SSD">SSD</option>
                                    <option value="HDD">HDD</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Arayüz</label>
                                <select value={formData.interface || ''} onChange={e => setFormData({ ...formData, interface: e.target.value })}>
                                    <option value="">Seçin</option>
                                    <option value="NVMe">NVMe</option>
                                    <option value="SATA">SATA</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Kapasite (GB)</label>
                                <input type="number" value={formData.capacityGB || ''} onChange={e => setFormData({ ...formData, capacityGB: parseInt(e.target.value) })} placeholder="2000" />
                            </div>
                            <div className="form-group">
                                <label>Okuma (MB/s)</label>
                                <input type="number" value={formData.readSpeedMBs || ''} onChange={e => setFormData({ ...formData, readSpeedMBs: parseInt(e.target.value) })} placeholder="7450" />
                            </div>
                            <div className="form-group">
                                <label>Yazma (MB/s)</label>
                                <input type="number" value={formData.writeSpeedMBs || ''} onChange={e => setFormData({ ...formData, writeSpeedMBs: parseInt(e.target.value) })} placeholder="6900" />
                            </div>
                        </div>
                    </>
                );
            case 'psu':
                return (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Marka</label>
                                <input value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Corsair" />
                            </div>
                            <div className="form-group">
                                <label>Model</label>
                                <input value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="RM850x" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Güç (W)</label>
                                <input type="number" value={formData.wattage || ''} onChange={e => setFormData({ ...formData, wattage: parseInt(e.target.value) })} placeholder="850" />
                            </div>
                            <div className="form-group">
                                <label>Verimlilik</label>
                                <select value={formData.efficiency || ''} onChange={e => setFormData({ ...formData, efficiency: e.target.value })}>
                                    <option value="">Seçin</option>
                                    {efficiencies.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Modüler</label>
                                <select value={formData.modular || ''} onChange={e => setFormData({ ...formData, modular: e.target.value })}>
                                    <option value="">Seçin</option>
                                    <option value="Full">Full Modüler</option>
                                    <option value="Semi">Semi Modüler</option>
                                    <option value="Non">Modüler Değil</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Form Factor</label>
                                <select value={formData.formFactor || 'ATX'} onChange={e => setFormData({ ...formData, formFactor: e.target.value })}>
                                    <option value="ATX">ATX</option>
                                    <option value="SFX">SFX</option>
                                </select>
                            </div>
                        </div>
                    </>
                );
            case 'case':
                return (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Marka</label>
                                <input value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="NZXT" />
                            </div>
                            <div className="form-group">
                                <label>Model</label>
                                <input value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="H510" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Form Factor</label>
                                <select value={formData.formFactor || ''} onChange={e => setFormData({ ...formData, formFactor: e.target.value })}>
                                    <option value="">Seçin</option>
                                    {formFactors.map(f => <option key={f} value={f}>{f}</option>)}
                                    <option value="Full-Tower">Full Tower</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Max GPU (mm)</label>
                                <input type="number" value={formData.maxGpuLengthMM || ''} onChange={e => setFormData({ ...formData, maxGpuLengthMM: parseInt(e.target.value) })} placeholder="400" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Max Cooler (mm)</label>
                                <input type="number" value={formData.maxCoolerHeightMM || ''} onChange={e => setFormData({ ...formData, maxCoolerHeightMM: parseInt(e.target.value) })} placeholder="165" />
                            </div>
                            <div className="form-group">
                                <label>2.5" Slot</label>
                                <input type="number" value={formData.driveBays25 || 2} onChange={e => setFormData({ ...formData, driveBays25: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label>3.5" Slot</label>
                                <input type="number" value={formData.driveBays35 || 2} onChange={e => setFormData({ ...formData, driveBays35: parseInt(e.target.value) })} />
                            </div>
                        </div>
                    </>
                );
            case 'cooler':
                return (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Marka</label>
                                <input value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Noctua" />
                            </div>
                            <div className="form-group">
                                <label>Model</label>
                                <input value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="NH-D15" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Tip</label>
                                <select value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="">Seçin</option>
                                    {coolerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Max TDP (W)</label>
                                <input type="number" value={formData.maxTDP || ''} onChange={e => setFormData({ ...formData, maxTDP: parseInt(e.target.value) })} placeholder="250" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Yükseklik (mm, hava soğutucu)</label>
                                <input type="number" value={formData.heightMM || ''} onChange={e => setFormData({ ...formData, heightMM: parseInt(e.target.value) || null })} placeholder="165" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Desteklenen Soketler</label>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {sockets.map(s => (
                                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                            type="checkbox"
                                            checked={(formData.sockets || []).includes(s)}
                                            onChange={e => {
                                                const current = formData.sockets || [];
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, sockets: [...current, s] });
                                                } else {
                                                    setFormData({ ...formData, sockets: current.filter((x: string) => x !== s) });
                                                }
                                            }}
                                        />
                                        {s}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    const renderTable = () => {
        switch (activeTab) {
            case 'motherboard':
                return (
                    <table>
                        <thead>
                            <tr>
                                <th>Marka</th>
                                <th>Model</th>
                                <th>Socket</th>
                                <th>Chipset</th>
                                <th>Form Factor</th>
                                <th>RAM</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {motherboards.map(m => (
                                <tr key={m.id}>
                                    <td>{m.brand}</td>
                                    <td>{m.model}</td>
                                    <td><span className="tag">{m.socket}</span></td>
                                    <td>{m.chipset}</td>
                                    <td>{m.formFactor}</td>
                                    <td>{m.ramType} ({m.ramSlots} slot)</td>
                                    <td>
                                        <button className="btn-sm" onClick={() => handleEdit(m)}>✏️</button>
                                        <button className="btn-sm btn-danger" onClick={() => handleDelete(m.slug)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'ram':
                return (
                    <table>
                        <thead>
                            <tr>
                                <th>Marka</th>
                                <th>Model</th>
                                <th>Tip</th>
                                <th>Kapasite</th>
                                <th>Hız</th>
                                <th>Kit</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rams.map(r => (
                                <tr key={r.id}>
                                    <td>{r.brand}</td>
                                    <td>{r.model}</td>
                                    <td><span className="tag">{r.type}</span></td>
                                    <td>{r.capacityGB} GB</td>
                                    <td>{r.speedMHz} MHz</td>
                                    <td>{r.sticks}x</td>
                                    <td>
                                        <button className="btn-sm" onClick={() => handleEdit(r)}>✏️</button>
                                        <button className="btn-sm btn-danger" onClick={() => handleDelete(r.slug)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'storage':
                return (
                    <table>
                        <thead>
                            <tr>
                                <th>Marka</th>
                                <th>Model</th>
                                <th>Tip</th>
                                <th>Arayüz</th>
                                <th>Kapasite</th>
                                <th>Okuma/Yazma</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {storages.map(s => (
                                <tr key={s.id}>
                                    <td>{s.brand}</td>
                                    <td>{s.model}</td>
                                    <td><span className="tag">{s.type}</span></td>
                                    <td>{s.interface}</td>
                                    <td>{s.capacityGB >= 1000 ? `${s.capacityGB / 1000} TB` : `${s.capacityGB} GB`}</td>
                                    <td>{s.readSpeedMBs || '-'}/{s.writeSpeedMBs || '-'} MB/s</td>
                                    <td>
                                        <button className="btn-sm" onClick={() => handleEdit(s)}>✏️</button>
                                        <button className="btn-sm btn-danger" onClick={() => handleDelete(s.slug)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'psu':
                return (
                    <table>
                        <thead>
                            <tr>
                                <th>Marka</th>
                                <th>Model</th>
                                <th>Güç</th>
                                <th>Verimlilik</th>
                                <th>Modüler</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {psus.map(p => (
                                <tr key={p.id}>
                                    <td>{p.brand}</td>
                                    <td>{p.model}</td>
                                    <td><span className="tag">{p.wattage}W</span></td>
                                    <td>{p.efficiency}</td>
                                    <td>{p.modular}</td>
                                    <td>
                                        <button className="btn-sm" onClick={() => handleEdit(p)}>✏️</button>
                                        <button className="btn-sm btn-danger" onClick={() => handleDelete(p.slug)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'case':
                return (
                    <table>
                        <thead>
                            <tr>
                                <th>Marka</th>
                                <th>Model</th>
                                <th>Form Factor</th>
                                <th>Max GPU</th>
                                <th>Max Cooler</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases.map(c => (
                                <tr key={c.id}>
                                    <td>{c.brand}</td>
                                    <td>{c.model}</td>
                                    <td><span className="tag">{c.formFactor}</span></td>
                                    <td>{c.maxGpuLengthMM}mm</td>
                                    <td>{c.maxCoolerHeightMM}mm</td>
                                    <td>
                                        <button className="btn-sm" onClick={() => handleEdit(c)}>✏️</button>
                                        <button className="btn-sm btn-danger" onClick={() => handleDelete(c.slug)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'cooler':
                return (
                    <table>
                        <thead>
                            <tr>
                                <th>Marka</th>
                                <th>Model</th>
                                <th>Tip</th>
                                <th>Max TDP</th>
                                <th>Yükseklik</th>
                                <th>Soketler</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coolers.map(c => (
                                <tr key={c.id}>
                                    <td>{c.brand}</td>
                                    <td>{c.model}</td>
                                    <td><span className="tag">{c.type}</span></td>
                                    <td>{c.maxTDP}W</td>
                                    <td>{c.heightMM ? `${c.heightMM}mm` : '-'}</td>
                                    <td>{c.sockets?.join(', ') || '-'}</td>
                                    <td>
                                        <button className="btn-sm" onClick={() => handleEdit(c)}>✏️</button>
                                        <button className="btn-sm btn-danger" onClick={() => handleDelete(c.slug)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            default:
                return null;
        }
    };

    const getTabLabel = (tab: ComponentType) => {
        switch (tab) {
            case 'motherboard': return '🔲 Anakart';
            case 'ram': return '🧠 RAM';
            case 'storage': return '💾 Depolama';
            case 'psu': return '⚡ PSU';
            case 'case': return '🖥️ Kasa';
            case 'cooler': return '❄️ Soğutucu';
        }
    };

    const getCount = (tab: ComponentType) => {
        switch (tab) {
            case 'motherboard': return motherboards.length;
            case 'ram': return rams.length;
            case 'storage': return storages.length;
            case 'psu': return psus.length;
            case 'case': return cases.length;
            case 'cooler': return coolers.length;
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>🛠️ PC Builder - Parça Yönetimi</h1>
                <p>Sistem oluşturucu için parça ekleyin ve yönetin</p>
            </div>

            <div className="page-content">
                {/* Tabs */}
                <div className="tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {(['motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'] as ComponentType[]).map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'tab-btn--active' : ''}`}
                            onClick={() => { setActiveTab(tab); setShowForm(false); }}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: activeTab === tab ? '2px solid #6366F1' : '1px solid #334155',
                                backgroundColor: activeTab === tab ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: activeTab === tab ? '#6366F1' : '#94A3B8',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            {getTabLabel(tab)} ({getCount(tab)})
                        </button>
                    ))}
                </div>

                {/* Add Button */}
                <div style={{ marginBottom: '16px' }}>
                    <button onClick={handleNew} style={{ padding: '10px 20px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        ➕ Yeni Ekle
                    </button>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="panel panel--form" style={{ marginBottom: '24px' }}>
                        <h2>{editingSlug ? 'Düzenle' : 'Yeni Ekle'}: {getTabLabel(activeTab)}</h2>
                        <div className="form-grid">
                            {renderForm()}
                        </div>
                        <div className="form-actions" style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                            <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
                            </button>
                            <button onClick={() => { setShowForm(false); setFormData({}); setEditingSlug(null); }} style={{ padding: '10px 20px', backgroundColor: '#64748B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                İptal
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="panel panel--table">
                    <div className="panel-header">
                        <h2>{getTabLabel(activeTab)} Listesi</h2>
                        <div className="panel-header-right">
                            {loading && <span className="tag">Yükleniyor...</span>}
                            <span className="tag">{getCount(activeTab)} kayıt</span>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        {renderTable()}
                        {getCount(activeTab) === 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                                Henüz kayıt yok. "Yeni Ekle" butonuna tıklayarak başlayın.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PCBuilderPage;
