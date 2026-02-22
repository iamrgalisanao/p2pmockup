import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Users,
    Search,
    ExternalLink,
    Plus,
    Mail,
    Phone
} from 'lucide-react';

const VendorListPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newVendor, setNewVendor] = useState({
        name: '',
        email: '',
        phone: '',
        contact_person: '',
        accreditation_status: 'active'
    });

    const query = useQuery({
        queryKey: ['vendors'],
        queryFn: () => api.get('/vendors').then(res => res.data),
    });
    const vendors = query.data;
    const isLoading = query.isLoading;

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/vendors', data),
        onSuccess: () => {
            toast.success('Vendor created successfully!');
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setIsModalOpen(false);
            setNewVendor({
                name: '',
                email: '',
                phone: '',
                contact_person: '',
                accreditation_status: 'active'
            });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to create vendor');
        }
    });

    const filteredVendors = vendors?.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Vendor Directory</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Accredited suppliers and contractors.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    <span>Add New Vendor</span>
                </button>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: '400px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Add New Vendor</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>VENDOR NAME</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newVendor.name}
                                    onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>EMAIL</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={newVendor.email}
                                    onChange={e => setNewVendor({ ...newVendor, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>PHONE</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newVendor.phone}
                                    onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>CONTACT PERSON</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newVendor.contact_person}
                                    onChange={e => setNewVendor({ ...newVendor, contact_person: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => createMutation.mutate(newVendor)} disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create Vendor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by vendor name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {isLoading ? (
                    <div>Loading vendors...</div>
                ) : (
                    filteredVendors?.map(vendor => (
                        <div key={vendor.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={24} color="var(--primary)" />
                                </div>
                                <span className={`badge badge-${vendor.accreditation_status}`}>
                                    {vendor.accreditation_status}
                                </span>
                            </div>

                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{vendor.name}</h3>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{vendor.contact_person || 'No contact person'}</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem' }}>
                                    <Mail size={14} color="#94a3b8" />
                                    <span>{vendor.email || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem' }}>
                                    <Phone size={14} color="#94a3b8" />
                                    <span>{vendor.phone || 'N/A'}</span>
                                </div>
                            </div>

                            <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.8125rem' }}>
                                View Quotes <ExternalLink size={14} style={{ marginLeft: '4px' }} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VendorListPage;
