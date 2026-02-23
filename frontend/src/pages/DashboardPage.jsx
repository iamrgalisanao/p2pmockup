import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    FileText,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const navigate = useNavigate();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get('/dashboard/stats').then(res => res.data),
    });

    const { data: recent, isLoading: recentLoading } = useQuery({
        queryKey: ['recent-requisitions'],
        queryFn: () => api.get('/dashboard').then(res => res.data),
    });

    const cards = [
        { label: 'Total Active PR', value: stats?.draft || 0, icon: FileText, color: 'var(--primary)', bg: 'rgba(29, 67, 155, 0.1)' },
        { label: 'Pending Approvals', value: stats?.pending || 0, icon: Clock, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
        { label: 'Awaiting Quotes', value: stats?.po_issued || 0, icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
        { label: 'SLA Breaches', value: stats?.sla_breached || 0, icon: AlertTriangle, color: 'var(--accent)', bg: 'rgba(226, 31, 38, 0.1)' },
    ];

    return (
        <div className="dashboard-view animate-fade-in">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Procure-to-Pay Portal</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Welcome back, Alex Carter</p>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Last Updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            <div className="stats-grid">
                {cards.map((card, i) => (
                    <div key={i} className="stat-card" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <div className="icon-box" style={{ background: card.bg, borderRadius: '12px', width: '48px', height: '48px' }}>
                            <card.icon color={card.color} size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>{statsLoading ? '...' : card.value}</div>
                        </div>
                        {i === 3 && card.value > 0 && (
                            <div style={{ color: 'var(--accent)', background: 'rgba(226, 31, 38, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>ALERT</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="dashboard-main-grid">
                <div className="glass-card" style={{ padding: '2rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent Requisitions</h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Track latest procurement activities</p>
                        </div>
                        <button className="btn btn-outline desktop-only" style={{ fontSize: '0.75rem', padding: '8px 16px', borderRadius: '6px' }} onClick={() => navigate('/requisitions')}>
                            VIEW ALL <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="table-container" style={{ borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <table>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th>ID</th>
                                    <th>TITLE</th>
                                    <th className="desktop-only">DEPT</th>
                                    <th>STATUS</th>
                                    <th className="desktop-only">DATE</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent?.data?.slice(0, 5).map((r) => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>{r.ref_number}</td>
                                        <td style={{ fontWeight: 600 }}>{r.title}</td>
                                        <td className="desktop-only"><span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{r.department?.name || 'IT'}</span></td>
                                        <td>
                                            <span className={`badge badge-${r.status}`} style={{ fontSize: '0.65rem', borderRadius: '4px' }}>
                                                {r.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="desktop-only" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => navigate(`/requisitions/${r.id}`)}>
                                                DETAILS
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!recentLoading && (!recent?.data || recent.data.length === 0) && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            No active requisitions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem', borderRadius: '12px', height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Approval Inbox</h3>
                        {stats?.inbox_count > 0 && <span style={{ color: 'var(--accent)', background: 'rgba(226, 31, 38, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>{stats.inbox_count} ALERT</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {statsLoading ? (
                            <p>Loading inbox...</p>
                        ) : stats?.inbox_count === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 12, border: '1px dashed var(--border)' }}>
                                <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 1.25rem' }} />
                                <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>All Clear!</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>No pending approvals.</div>
                            </div>
                        ) : (
                            <>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ width: '4px', background: i === 1 ? 'var(--accent)' : 'var(--warning)', borderRadius: '2px' }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>PR-2024-00{i}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>2h ago</div>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>MacBook Pro M3 Max</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Requested by: Sarah J.</div>
                                        </div>
                                    </div>
                                ))}
                                <button className="btn btn-primary" style={{ width: '100%', borderRadius: '4px', fontWeight: 800, padding: '12px' }} onClick={() => navigate('/inbox')}>
                                    INBOX
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
