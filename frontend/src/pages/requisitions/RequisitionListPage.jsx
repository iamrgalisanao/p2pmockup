import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requisitionService } from '../../services/requisitionService';
import { reportService } from '../../services/reportService';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    Download
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const RequisitionListPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['requisitions', page, status, search],
        queryFn: () => requisitionService.getAll({ page, status, search }).then(res => res.data),
    });

    const handleExport = () => {
        const token = useAuthStore.getState().token;
        const finalUrl = `http://localhost:8000/api/reports/export?token=${token}`;
        window.open(finalUrl, '_blank');
    };

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Purchasing Requisitions</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage and track all procurement requests.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" onClick={handleExport}>
                        <Download size={18} />
                        <span>Export Excel</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/requisitions/new')}>
                        <Plus size={18} />
                        <span>Create New PR</span>
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by ref or title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>

                <select
                    style={{ width: '200px' }}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft (Maker)</option>
                    <option value="submitted">For Approval (DH)</option>
                    <option value="for_transmittal">For Transmittal</option>
                    <option value="for_review">For Review</option>
                    <option value="for_endorsement">For Endorsement</option>
                    <option value="approved">Approved</option>
                    <option value="po_issued">PO Issued</option>
                    <option value="rejected">Rejected</option>
                    <option value="returned">Returned</option>
                </select>

                <button className="btn btn-outline">
                    <Filter size={18} />
                    <span>More Filters</span>
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Ref Number</th>
                            <th>Requisition Title</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Est. Total</th>
                            <th>Date Created</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}><td colSpan="8" style={{ padding: '1.5rem', textAlign: 'center' }}>Loading...</td></tr>
                            ))
                        ) : (
                            data?.data?.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.ref_number}</td>
                                    <td style={{ fontWeight: 500 }}>{r.title}</td>
                                    <td>{r.department?.name}</td>
                                    <td>
                                        <span className={`badge badge-${r.status}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                            {r.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${r.priority}`}>
                                            {r.priority}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        PHP {parseFloat(r.estimated_total).toLocaleString()}
                                    </td>
                                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => navigate(`/requisitions/${r.id}`)}>
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Showing {data?.from || 0} to {data?.to || 0} of {data?.total || 0} results
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-outline"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        className="btn btn-outline"
                        disabled={!data?.next_page_url}
                        onClick={() => setPage(p => p + 1)}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequisitionListPage;
