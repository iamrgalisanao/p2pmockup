import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Inbox,
    Users,
    Truck,
    Settings,
    LogOut,
    Bell,
    Search,
    PlusCircle,
    Sun,
    Moon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const MainLayout = () => {
    const { user, logout } = useAuthStore();
    const { mode, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

    // Fetch dynamic stats for notification counts (Industry Standard)
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get('/dashboard/stats').then(res => res.data),
        refetchInterval: 30000, // Refresh every 30 seconds for live feel
    });

    const inboxCount = stats?.inbox_count || 0;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'My Inbox', path: '/inbox', icon: Inbox, badge: inboxCount },
        { name: 'Requisitions', path: '/requisitions', icon: FileText },
        { name: 'Payment Requests', path: '/payment-requests', icon: FileText },
        { name: 'Vendors', path: '/vendors', icon: Truck },
        { name: 'User Management', path: '/users', icon: Users, role: ['admin', 'president'] },
        { name: 'Reports', path: '/reports', icon: LayoutDashboard },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="app-wrapper">
            <aside className="sidebar">
                <div className="sidebar-header" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #1D439B 50%, #EB342E 50%)',
                        borderRadius: 'var(--radius)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 900, fontSize: '1.25rem'
                    }}>P</div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px', color: 'var(--text-dark)' }}>PITX PROCURE</span>
                </div>

                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => {
                        if (item.role && !item.role.includes(user?.role)) return null;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                                {item.badge > 0 && (
                                    <span
                                        className="badge-pulse"
                                        style={{
                                            marginLeft: 'auto',
                                            background: 'var(--accent)',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: 10,
                                            fontSize: 10,
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: '20px'
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{user?.role?.replace('_', ' ')}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="header-top">
                    <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" placeholder="Search orders..." style={{ paddingLeft: '40px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className="btn btn-outline" style={{ padding: '8px' }} onClick={toggleTheme} title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="btn btn-outline" style={{ padding: '8px' }}>
                            <Bell size={20} />
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/requisitions/new')}>
                            <PlusCircle size={18} />
                            <span>Create Request</span>
                        </button>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
