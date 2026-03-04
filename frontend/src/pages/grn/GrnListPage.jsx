import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { grnService } from '../../services/grnService';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Package
} from 'lucide-react';

const GrnListPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['grns', page, search],
        queryFn: () => grnService.getAll({ page, search }).then(res => res.data),
    });

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Receiving (GRN)</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track and manage goods received notes.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/grns/new')}>
                        <Plus size={18} />
                        <span>New Receipt</span>
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by GRN or PO reference..."
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
                            <th>GRN Ref</th>
                            <th>PO Ref</th>
                            <th>Vendor</th>
                            <th>Received Date</th>
                            <th>Received By</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}><td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center' }}>Loading...</td></tr>
                            ))
                        ) : (
                            data?.data?.map((g) => (
                                <tr key={g.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{g.ref_number}</td>
                                    <td>{g.purchase_order?.ref_number}</td>
                                    <td>{g.purchase_order?.vendor?.name}</td>
                                    <td>{new Date(g.received_date).toLocaleDateString()}</td>
                                    <td>{g.received_by}</td>
                                    <td>
                                        <span className={`badge badge-${g.status}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                            {g.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => navigate(`/grns/${g.id}`)}>
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!isLoading && data?.data?.length === 0 && (
                            <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Package size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <p>No goods received notes found.</p>
                            </td></tr>
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

export default GrnListPage;
