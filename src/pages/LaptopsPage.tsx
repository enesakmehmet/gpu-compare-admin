import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Checkbox,
    FormControlLabel,
    IconButton,
    Alert,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface GPU {
    id: number;
    model: string;
}

interface CPU {
    id: number;
    model: string;
}

interface Laptop {
    id: number;
    brand: string;
    series?: string;
    model: string;
    slug: string;
    price?: number;
    screenSize?: string;
    screenRes?: string;
    screenHz?: number;
    panelType?: string;
    ram?: string;
    storage?: string;
    gpuWatt?: number;
    muxSwitch: boolean;
    gpu: GPU;
    cpu: CPU;
}

const LaptopsPage = () => {
    const [laptops, setLaptops] = useState<Laptop[]>([]);
    const [gpus, setGpus] = useState<GPU[]>([]);
    const [cpus, setCpus] = useState<CPU[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingLaptop, setEditingLaptop] = useState<Laptop | null>(null);
    const [formData, setFormData] = useState({
        brand: '',
        series: '',
        model: '',
        slug: '',
        price: '',
        screenSize: '',
        screenRes: '',
        screenHz: '',
        panelType: '',
        ram: '',
        storage: '',
        gpuId: '',
        cpuId: '',
        gpuWatt: '',
        muxSwitch: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchLaptops();
        fetchFormOptions();
    }, []);

    const fetchLaptops = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/laptops`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLaptops(response.data);
        } catch (error) {
            setError('Laptoplar yüklenemedi');
        }
    };

    const fetchFormOptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/laptops/form-options`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGpus(response.data.gpus);
            setCpus(response.data.cpus);
        } catch (error) {
            setError('Form seçenekleri yüklenemedi');
        }
    };

    const handleOpenDialog = (laptop?: Laptop) => {
        if (laptop) {
            setEditingLaptop(laptop);
            setFormData({
                brand: laptop.brand,
                series: laptop.series || '',
                model: laptop.model,
                slug: laptop.slug,
                price: laptop.price?.toString() || '',
                screenSize: laptop.screenSize || '',
                screenRes: laptop.screenRes || '',
                screenHz: laptop.screenHz?.toString() || '',
                panelType: laptop.panelType || '',
                ram: laptop.ram || '',
                storage: laptop.storage || '',
                gpuId: laptop.gpu.id.toString(),
                cpuId: laptop.cpu.id.toString(),
                gpuWatt: laptop.gpuWatt?.toString() || '',
                muxSwitch: laptop.muxSwitch,
            });
        } else {
            setEditingLaptop(null);
            setFormData({
                brand: '',
                series: '',
                model: '',
                slug: '',
                price: '',
                screenSize: '',
                screenRes: '',
                screenHz: '',
                panelType: '',
                ram: '',
                storage: '',
                gpuId: '',
                cpuId: '',
                gpuWatt: '',
                muxSwitch: false,
            });
        }
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (editingLaptop) {
                await axios.put(`${API_URL}/admin/laptops/${editingLaptop.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Laptop güncellendi');
            } else {
                await axios.post(`${API_URL}/admin/laptops`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Laptop eklendi');
            }
            fetchLaptops();
            setTimeout(() => handleClose(), 1500);
        } catch (error: any) {
            setError(error.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu laptopu silmek istediğinizden emin misiniz?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/laptops/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Laptop silindi');
            fetchLaptops();
        } catch (error) {
            setError('Silme işlemi başarısız');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Laptop Yönetimi</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Yeni Laptop Ekle
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Marka</TableCell>
                            <TableCell>Model</TableCell>
                            <TableCell>GPU</TableCell>
                            <TableCell>CPU</TableCell>
                            <TableCell>Fiyat</TableCell>
                            <TableCell>Ekran</TableCell>
                            <TableCell align="right">İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {laptops.map((laptop) => (
                            <TableRow key={laptop.id}>
                                <TableCell>{laptop.brand}</TableCell>
                                <TableCell>{laptop.model}</TableCell>
                                <TableCell>{laptop.gpu?.model}</TableCell>
                                <TableCell>{laptop.cpu?.model}</TableCell>
                                <TableCell>{laptop.price ? `₺${laptop.price}` : '-'}</TableCell>
                                <TableCell>{laptop.screenSize} {laptop.screenHz}Hz</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpenDialog(laptop)} color="primary">
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(laptop.id)} color="error">
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{editingLaptop ? 'Laptop Düzenle' : 'Yeni Laptop Ekle'}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Marka *"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Seri"
                                value={formData.series}
                                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Model *"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Slug *"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                helperText="URL dostu isim (örn: msi-katana-15)"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Fiyat (₺)"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>GPU *</InputLabel>
                                <Select
                                    value={formData.gpuId}
                                    onChange={(e) => setFormData({ ...formData, gpuId: e.target.value })}
                                >
                                    {gpus.map((gpu) => (
                                        <MenuItem key={gpu.id} value={gpu.id}>{gpu.model}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>CPU *</InputLabel>
                                <Select
                                    value={formData.cpuId}
                                    onChange={(e) => setFormData({ ...formData, cpuId: e.target.value })}
                                >
                                    {cpus.map((cpu) => (
                                        <MenuItem key={cpu.id} value={cpu.id}>{cpu.model}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Ekran Boyutu"
                                value={formData.screenSize}
                                onChange={(e) => setFormData({ ...formData, screenSize: e.target.value })}
                                placeholder='15.6"'
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Çözünürlük"
                                value={formData.screenRes}
                                onChange={(e) => setFormData({ ...formData, screenRes: e.target.value })}
                                placeholder="FHD, QHD, 4K"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Yenileme Hızı (Hz)"
                                type="number"
                                value={formData.screenHz}
                                onChange={(e) => setFormData({ ...formData, screenHz: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Panel Tipi"
                                value={formData.panelType}
                                onChange={(e) => setFormData({ ...formData, panelType: e.target.value })}
                                placeholder="IPS, OLED"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="RAM"
                                value={formData.ram}
                                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                                placeholder="16GB DDR5"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Depolama"
                                value={formData.storage}
                                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                                placeholder="1TB SSD"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="GPU Watt (TGP)"
                                type="number"
                                value={formData.gpuWatt}
                                onChange={(e) => setFormData({ ...formData, gpuWatt: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.muxSwitch}
                                        onChange={(e) => setFormData({ ...formData, muxSwitch: e.target.checked })}
                                    />
                                }
                                label="MUX Switch Var"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>İptal</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingLaptop ? 'Güncelle' : 'Ekle'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LaptopsPage;
