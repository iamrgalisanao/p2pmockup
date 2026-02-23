import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    FileText,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    TrendingUp,
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
        { label: 'Active Drafts', value: stats?.draft || 0, icon: FileText, color: 'var(--primary)', bg: 'rgba(129, 140, 248, 0.15)' },
        { label: 'In Approval', value: stats?.pending || 0, icon: Clock, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)' },
        { label: 'Completed', value: stats?.po_issued || 0, icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)' },
        { label: 'SLA Breached', value: stats?.sla_breached || 0, icon: AlertTriangle, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.15)' },
    ];

    return (
        <div className="dashboard-view animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem' }}>Welcome Back 👋</h1>
                <p style={{ color: 'var(--text-muted)' }}>Here is what&apos;s happening in your procurement pipeline today.</p>
            </div>

            <div className="stats-grid">
                {cards.map((card, i) => (
                    <div key={i} className="stat-card">
                        <div className="icon-box" style={{ background: card.bg }}>
                            <card.icon color={card.color} size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{card.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{statsLoading ? '...' : card.value}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                            <TrendingUp size={14} /> +12%
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem' }}>Recent Requisitions</h3>
                        <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 12px' }} onClick={() => navigate('/requisitions')}>
                            View All <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Title</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent?.data?.slice(0, 5).map((r) => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.ref_number}</td>
                                        <td>{r.title}</td>
                                        <td>
                                            <span className={`badge badge-${r.priority}`}>
                                                {r.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${r.status}`}>
                                                {r.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => navigate(`/requisitions/${r.id}`)}>
                                                <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!recentLoading && (!recent?.data || recent.data.length === 0) && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No active requisitions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Your Approval Inbox</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats?.inbox_count === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>All Clear!</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No pending approvals for your role.</div>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: 12, borderLeft: '4px solid var(--warning)' }}>
                                <div style={{ fontWeight: 700, color: 'var(--warning)' }}>{stats?.inbox_count} Pending Steps</div>
                                <div style={{ fontSize: '0.8125rem', color: 'rgba(245,158,11,0.8)', marginBottom: '0.75rem' }}>You have tasks requiring your review.</div>
                                <button className="btn btn-primary" style={{ background: 'var(--warning)', width: '100%', fontSize: '0.75rem', color: '#000' }} onClick={() => navigate('/inbox')}>
                                    Open Inbox
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
