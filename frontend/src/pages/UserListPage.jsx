import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Search,
    UserPlus,
    Shield,
    Mail,
    Building,
    Edit2,
    X,
    CheckCircle2,
    Lock
} from 'lucide-react';

const UserListPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'requester',
        department_id: '',
        is_active: true
    });

    const roles = [
        { value: 'requester', label: 'Requester' },
        { value: 'dept_head', label: 'Department Head' },
        { value: 'proc_officer', label: 'Procurement Officer' },
        { value: 'finance_reviewer', label: 'Finance Reviewer' },
        { value: 'president', label: 'President' },
        { value: 'accounting_staff', label: 'Accounting Staff' },
        { value: 'accounting_supervisor', label: 'Accounting Supervisor' },
        { value: 'accounting_manager', label: 'Accounting Manager' },
        { value: 'admin', label: 'System Admin' }
    ];

    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data),
    });

    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data),
    });

    const filteredUsers = users?.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editingUser) {
                // Remove empty password so it isn't updated
                const payload = { ...data };
                if (!payload.password) delete payload.password;
                return api.put(`/users/${editingUser.id}`, payload);
            }
            return api.post('/users', data);
        },
        onSuccess: () => {
            toast.success(editingUser ? 'User updated successfully.' : 'User created successfully.');
            queryClient.invalidateQueries(['users']);
            closeModal();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Setup failed. Please check your inputs.');
        }
    });

    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                department_id: user.department_id || '',
                is_active: user.is_active === 1 || user.is_active === true
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'requester',
                department_id: departments?.[0]?.id || '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>User Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage system access, team roles, and departments.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()} style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', border: 'none' }}>
                    <UserPlus size={18} />
                    <span>Invite New User</span>
                </button>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by user's name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '44px', width: '100%', maxWidth: '500px' }}
                        className="form-control"
                    />
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>User Profile</th>
                            <th>Role Access</th>
                            <th>Department</th>
                            <th>Status Account</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingUsers ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Fetching users securely...</td></tr>
                        ) : (
                            filteredUsers?.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '10px',
                                                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 800, color: 'var(--primary)'
                                            }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{user.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <Mail size={12} color="var(--primary)" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Shield size={14} color="var(--primary)" />
                                            <span style={{ fontWeight: 600 }}>{user.role.replace(/_/g, ' ').toUpperCase()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                            <Building size={14} />
                                            <span>{user.department?.name || 'General / System'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${user.is_active ? 'approved' : 'returned'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px' }}>
                                            {user.is_active ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                                            {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openModal(user)}>
                                            <Edit2 size={14} /> Edit Profile
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!isLoadingUsers && filteredUsers?.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                    No users found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingUser ? 'Edit User Configuration' : 'Create System User'}</h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Password {editingUser && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.75rem' }}>(Leave blank to keep current)</span>}</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        minLength={8}
                                    />
                                </div>

                                <div>
                                    <label className="form-label">System Role Matrix</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {roles.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">Primary Department</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={formData.department_id}
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                    >
                                        {departments?.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                                    <input
                                        type="checkbox"
                                        id="activeStatus"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
                                    />
                                    <label htmlFor="activeStatus" style={{ cursor: 'pointer', fontWeight: 600, color: formData.is_active ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                                        User Account is Active
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '2px' }}>Inactive accounts cannot log in to the P2P system.</div>
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saveMutation.isPending}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                                    {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserListPage;
