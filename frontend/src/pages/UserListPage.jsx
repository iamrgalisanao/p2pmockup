import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    Search,
    UserPlus,
    Shield,
    Mail,
    Building
} from 'lucide-react';

const UserListPage = () => {
    const [search, setSearch] = useState('');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data),
    });

    const filteredUsers = users?.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>User Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage system access and team roles.</p>
                </div>
                <button className="btn btn-primary">
                    <UserPlus size={18} />
                    <span>Invite New User</span>
                </button>
            </div>

            <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Last Active</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
                        ) : (
                            filteredUsers?.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{user.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Mail size={12} /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Shield size={14} color="var(--primary)" />
                                            <span style={{ textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Building size={14} color="#94a3b8" />
                                            <span>{user.department?.name || 'General'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${user.is_active ? 'active' : 'inactive'}`} style={{
                                            background: user.is_active ? '#ecfdf5' : '#fef2f2',
                                            color: user.is_active ? '#059669' : '#dc2626'
                                        }}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.875rem' }}>Today, 10:45 AM</td>
                                    <td>
                                        <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Edit</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserListPage;
