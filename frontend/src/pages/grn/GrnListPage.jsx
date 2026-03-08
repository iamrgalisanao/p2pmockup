import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { grnService } from '../../services/grnService';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Package,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
    Filter
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import AdvancedFilterDrawer from '../../components/AdvancedFilterDrawer';
import EmptyState from '../../components/EmptyState';

const GrnListPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ by: 'created_at', dir: 'desc' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [advancedFilters, setAdvancedFilters] = useState({
        date_from: '',
        date_to: ''
    });

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['grns', page, debouncedSearch, sort, advancedFilters],
        queryFn: () => grnService.getAll({
            page,
            search: debouncedSearch,
            sort_by: sort.by,
            sort_dir: sort.dir,
            ...advancedFilters
        }).then(res => res.data),
    });

    const handleSort = (field) => {
        setSort(prev => ({
            by: field,
            dir: prev.by === field && prev.dir === 'desc' ? 'asc' : 'desc'
        }));
    };

    const filterConfig = [
        { key: 'date_from', label: 'Received From', type: 'date' },
        { key: 'date_to', label: 'Received To', type: 'date' },
    ];

    const activeFilterCount = Object.values(advancedFilters).filter(v => v !== '').length;

    const SortIcon = ({ field }) => {
        if (sort.by !== field) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
        return sort.dir === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
    };

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
                        placeholder="Search by GRN, PO reference, or vendor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <button
                    className={`btn ${activeFilterCount > 0 ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setIsFilterOpen(true)}
                >
                    <Filter size={18} />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="filter-badge">{activeFilterCount}</span>
                    )}
                </button>
            </div>

            <div className="table-container">
                <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr style={{ background: 'none' }}>
                            <th onClick={() => handleSort('ref_number')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>GRN REF <SortIcon field="ref_number" /></div>
                            </th>
                            <th>PO REF</th>
                            <th>VENDOR</th>
                            <th onClick={() => handleSort('received_date')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>RECEIVED DATE <SortIcon field="received_date" /></div>
                            </th>
                            <th>RECEIVED BY</th>
                            <th>STATUS</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="skeleton-row">
                                    <td colSpan="7"><div className="skeleton" style={{ height: '50px', borderRadius: '4px' }}></div></td>
                                </tr>
                            ))
                        ) : data?.data?.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: 0 }}>
                                    <EmptyState icon={Package} title="No receipts found" />
                                </td>
                            </tr>
                        ) : (
                            data?.data?.map((g) => (
                                <tr key={g.id} className="row-hover">
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
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => navigate(`/grns/${g.id}`)}>
                                            VIEW
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

            <AdvancedFilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={refetch}
                filters={advancedFilters}
                setFilters={setAdvancedFilters}
                config={filterConfig}
            />
        </div>
    );
};

export default GrnListPage;
