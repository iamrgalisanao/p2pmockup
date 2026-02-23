import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Building2,
    Search,
    ExternalLink,
    Plus,
    Mail,
    Phone,
    Edit,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    UserCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const VendorListPage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const canManageVendors = ['admin', 'proc_officer'].includes(user?.role);

    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        contact_person: '',
        accreditation_status: 'active'
    });

    const { data: vendors, isLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => api.get('/vendors').then(res => res.data),
    });

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editingVendor) {
                return api.put(`/vendors/${editingVendor.id}`, data);
            }
            return api.post('/vendors', data);
        },
        onSuccess: () => {
            toast.success(`Vendor ${editingVendor ? 'updated' : 'created'} successfully!`);
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            closeModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || `Failed to ${editingVendor ? 'update' : 'create'} vendor`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/vendors/${id}`),
        onSuccess: () => {
            toast.success('Vendor deleted successfully.');
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete vendor. They might have active quotes.');
        }
    });

    const openModal = (vendor = null) => {
        if (vendor) {
            setEditingVendor(vendor);
            setFormData({
                name: vendor.name,
                email: vendor.email || '',
                phone: vendor.phone || '',
                contact_person: vendor.contact_person || '',
                accreditation_status: vendor.accreditation_status
            });
        } else {
            setEditingVendor(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                contact_person: '',
                accreditation_status: 'active'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingVendor(null);
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete vendor "${name}"? This action cannot be undone.`)) {
            deleteMutation.mutate(id);
        }
    };

    const filteredVendors = vendors?.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.email?.toLowerCase().includes(search.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="badge badge-success"><CheckCircle2 size={12} style={{ marginRight: 4 }} /> Active</span>;
            case 'suspended':
                return <span className="badge badge-warning"><AlertTriangle size={12} style={{ marginRight: 4 }} /> Suspended</span>;
            case 'blacklisted':
                return <span className="badge badge-danger"><XCircle size={12} style={{ marginRight: 4 }} /> Blacklisted</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="view animate-fade-in">
            <div className="header-top" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Vendor Directory</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage accredited suppliers and contractors.</p>
                </div>
                {canManageVendors && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        <span>Add New Vendor</span>
                    </button>
                )}
            </div>

            <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by vendor name, email, or contact person..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '44px', background: 'transparent', border: 'none', boxShadow: 'none' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>Loading vendors...</div>
                ) : filteredVendors?.length === 0 ? (
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                        <Building2 size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                        <p>No vendors found matching your search.</p>
                    </div>
                ) : (
                    filteredVendors?.map(vendor => (
                        <div key={vendor.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'transform 0.2s' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Building2 size={24} color="var(--primary)" />
                                </div>
                                <div>
                                    {getStatusBadge(vendor.accreditation_status)}
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-dark)' }}>{vendor.name}</h3>
                            <div style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <UserCircle size={14} />
                                {vendor.contact_person || 'No main contact'}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    <Mail size={14} style={{ opacity: 0.7 }} />
                                    <span>{vendor.email || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    <Phone size={14} style={{ opacity: 0.7 }} />
                                    <span>{vendor.phone || 'N/A'}</span>
                                </div>
                            </div>

                            {canManageVendors && (
                                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                                    <button className="btn btn-outline" style={{ flex: 1, padding: '8px' }} onClick={() => openModal(vendor)}>
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button className="btn btn-outline" style={{ color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px' }} onClick={() => handleDelete(vendor.id, vendor.name)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingVendor ? 'Edit Vendor Profile' : 'Register New Vendor'}</h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>COMPANY / VENDOR NAME *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter registered business name"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>EMAIL ADDRESS</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="sales@company.com"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>PHONE NUMBER</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+63 900 000 0000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>CONTACT PERSON</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.contact_person}
                                        onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                                        placeholder="Full Name (Designation)"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ACCREDITATION STATUS</label>
                                    <select
                                        className="form-control"
                                        value={formData.accreditation_status}
                                        onChange={e => setFormData({ ...formData, accreditation_status: e.target.value })}
                                    >
                                        <option value="active">Active (Approved Supplier)</option>
                                        <option value="suspended">Suspended (Temporary Hold)</option>
                                        <option value="blacklisted">Blacklisted (Do Not Use)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                                    {saveMutation.isPending ? 'Saving...' : (editingVendor ? 'Save Changes' : 'Register Vendor')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorListPage;
