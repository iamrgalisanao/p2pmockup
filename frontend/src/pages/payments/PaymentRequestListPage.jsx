import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentRequestService } from '../../services/paymentRequestService';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    Download,
    CreditCard
} from 'lucide-react';

const PaymentRequestListPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['payment-requests', page, status, search],
        queryFn: () => paymentRequestService.getAll({ page, status, search }).then(res => res.data),
    });

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Payment Requests</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track and manage all payment obligations and disbursements.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline">
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/payment-requests/new')}>
                        <Plus size={18} />
                        <span>New Payment Request</span>
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by vendor or ref..."
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
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paid">Paid</option>
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
                            <th>Vendor</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment Method</th>
                            <th>Date Due</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}><td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center' }}>Loading...</td></tr>
                            ))
                        ) : (
                            data?.data?.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.ref_number}</td>
                                    <td style={{ fontWeight: 500 }}>{r.vendor?.name}</td>
                                    <td style={{ fontWeight: 700 }}>PHP {parseFloat(r.amount).toLocaleString()}</td>
                                    <td>
                                        <span className={`badge badge-${r.status}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                            {r.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>{r.payment_method?.toUpperCase()}</td>
                                    <td>{r.due_date ? new Date(r.due_date).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => navigate(`/payment-requests/${r.id}`)}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!isLoading && (!data?.data || data.data.length === 0) && (
                            <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>No payment requests found.</td></tr>
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

export default PaymentRequestListPage;
