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
    Moon,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const MainLayout = () => {
    const { user, logout } = useAuthStore();
    const { mode, toggleTheme } = useThemeStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const navItems = useMemo(() => [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'My Inbox', path: '/inbox', icon: Inbox, badge: inboxCount },
        { name: 'Requisitions', path: '/requisitions', icon: FileText },
        { name: 'Payment Requests', path: '/payment-requests', icon: FileText },
        { name: 'Vendors', path: '/vendors', icon: Truck },
        { name: 'User Management', path: '/users', icon: Users, role: ['admin', 'president'] },
        { name: 'Reports', path: '/reports', icon: LayoutDashboard },
        { name: 'Settings', path: '/settings', icon: Settings },
    ], [inboxCount, user]);

    return (
        <div className={`app-wrapper ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            <div className={`mobile-overlay ${isMobileMenuOpen ? 'show' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <div style={{
                            background: '#EB342E',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 900,
                            fontSize: '1.2rem'
                        }}>PITX</div>
                        {!isCollapsed && <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.5px', color: 'white', whiteSpace: 'nowrap' }}>P2P PROCUREMENT</span>}
                    </div>

                    <button
                        className="sidebar-collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            position: 'absolute',
                            right: isCollapsed ? '-1rem' : '-1.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '24px',
                            height: '48px',
                            borderRadius: '8px 0 0 8px',
                            background: 'white',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRight: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 101,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--primary)';
                            e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'white';
                        }}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => {
                        if (item.role && !item.role.includes(user?.role)) return null;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                title={isCollapsed ? item.name : ''}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <item.icon size={20} style={{ minWidth: 20 }} />
                                {!isCollapsed && <span>{item.name}</span>}
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

                <div className="sidebar-footer" style={{
                    marginTop: 'auto',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: '1.5rem',
                    display: 'flex',
                    flexDirection: isCollapsed ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    gap: isCollapsed ? '1rem' : '0.5rem'
                }}>
                    <div className="user-profile"
                        title={isCollapsed ? `${user?.name} (${user?.role})` : ''}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            overflow: 'hidden',
                            flex: 1
                        }}>
                        <div style={{
                            width: 36, height: 36, minWidth: 36,
                            borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, color: 'white'
                        }}>
                            {user?.name?.charAt(0)}
                        </div>
                        {!isCollapsed && (
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{user?.role?.replace('_', ' ')}</div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-icon-logout"
                        title="Logout"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            <main className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
                <header className={`header-top ${isScrolled ? 'scrolled' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setIsMobileMenuOpen(true)}
                            style={{
                                display: 'none',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-dark)',
                                cursor: 'pointer',
                            }}
                        >
                            <PlusCircle size={24} style={{ transform: 'rotate(45deg)' }} />
                        </button>

                        <div className="search-bar" style={{ position: 'relative', width: '320px', transition: 'width 0.3s ease' }}>
                            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 10 }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className="btn btn-outline desktop-only" style={{ padding: '8px' }} onClick={toggleTheme} title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="btn btn-outline desktop-only" style={{ padding: '8px' }}>
                            <Bell size={20} />
                        </button>
                        <button className="btn btn-primary shimmer create-btn" onClick={() => navigate('/requisitions/new')}>
                            <PlusCircle size={18} />
                            <span>Create</span>
                        </button>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
