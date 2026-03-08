import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requisitionService } from '../../services/requisitionService';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    Download,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import AdvancedFilterDrawer from '../../components/AdvancedFilterDrawer';
import EmptyState from '../../components/EmptyState';

const RequisitionListPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ by: 'updated_at', dir: 'desc' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [advancedFilters, setAdvancedFilters] = useState({
        status: '',
        priority: '',
        date_from: '',
        date_to: ''
    });

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['requisitions', page, debouncedSearch, sort, advancedFilters],
        queryFn: () => requisitionService.getAll({
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

    const handleExport = () => {
        const token = useAuthStore.getState().token;
        const finalUrl = `${API_BASE_URL}/reports/export?token=${token}`;
        window.open(finalUrl, '_blank');
    };

    const filterConfig = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'For Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'po_issued', label: 'PO Issued' },
                { value: 'rejected', label: 'Rejected' },
            ]
        },
        {
            key: 'priority',
            label: 'Priority',
            type: 'select',
            options: [
                { value: 'normal', label: 'Normal' },
                { value: 'urgent', label: 'Urgent' }
            ]
        },
        { key: 'date_from', label: 'Date From', type: 'date' },
        { key: 'date_to', label: 'Date To', type: 'date' },
    ];

    const activeFilterCount = Object.values(advancedFilters).filter(v => v !== '').length;

    const SortIcon = ({ field }) => {
        if (sort.by !== field) return <ArrowUpDown size={14} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />;
        return sort.dir === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
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
                        placeholder="Search ref, title, requester, or vendor..."
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
                    style={{ position: 'relative' }}
                >
                    <Filter size={18} />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--accent)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            border: '2px solid var(--bg-card)'
                        }}>
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="table-container">
                <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr style={{ background: 'none' }}>
                            <th onClick={() => handleSort('ref_number')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>REF NUMBER <SortIcon field="ref_number" /></div>
                            </th>
                            <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>TITLE <SortIcon field="title" /></div>
                            </th>
                            <th>DEPARTMENT</th>
                            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>STATUS <SortIcon field="status" /></div>
                            </th>
                            <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>PRIORITY <SortIcon field="priority" /></div>
                            </th>
                            <th onClick={() => handleSort('estimated_total')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>TOTAL <SortIcon field="estimated_total" /></div>
                            </th>
                            <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>DATE <SortIcon field="created_at" /></div>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="skeleton-row">
                                    <td colSpan="8"><div className="skeleton" style={{ height: '50px', borderRadius: ' var(--radius-sharp)' }}></div></td>
                                </tr>
                            ))
                        ) : data?.data?.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: 0 }}>
                                    <EmptyState icon={Search} title="No requisitions matching your criteria" />
                                </td>
                            </tr>
                        ) : (
                            data?.data?.map((r) => (
                                <tr key={r.id} className="row-hover">
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.ref_number}</td>
                                    <td style={{ fontWeight: 500 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{r.title}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>By {r.requester?.name}</span>
                                        </div>
                                    </td>
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
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => navigate(`/requisitions/${r.id}`)}>
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

export default RequisitionListPage;
