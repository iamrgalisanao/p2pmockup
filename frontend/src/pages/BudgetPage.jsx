import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    TrendingUp,
    History,
    AlertCircle,
    ArrowLeftRight,
    ChevronLeft,
    PieChart,
    Layers,
    Activity,
    X,
    CheckCircle2
} from 'lucide-react';
import budgetService from '../services/budgetService';
import { toast } from 'react-hot-toast';

const BudgetActionModal = ({ isOpen, onClose, onSuccess, initialType = 'department', departments = [] }) => {
    const [actionType, setActionType] = useState('allocate'); // allocate | transfer
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        target_id: '',
        from_id: '',
        to_id: '',
        amount: '',
        reason: 'Initial Allocation'
    });

    if (!isOpen) return null;

    const handleAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (actionType === 'allocate') {
                await budgetService.updateLimit(formData.target_id, formData.amount);
                toast.success('Budget allocation updated successfully');
            } else {
                await budgetService.transfer({
                    from_id: formData.from_id,
                    to_id: formData.to_id,
                    amount: formData.amount,
                    reason: formData.reason
                });
                toast.success('Budget transfer successful');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error in budget action:', error);
            toast.error(error.response?.data?.message || 'Action failed. Check logs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`modal-overlay ${isOpen ? 'show' : ''}`} style={{ zIndex: 2000 }}>
            <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', color: 'var(--text-muted)' }} className="btn-outline p-1 rounded-full">
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Financial Action</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>Allocate funds or transfer between cost centers.</p>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-main)', padding: '4px', borderRadius: '12px', marginBottom: '2rem' }}>
                    <button
                        type="button"
                        onClick={() => setActionType('allocate')}
                        className={`btn ${actionType === 'allocate' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderRadius: '8px' }}
                    >
                        Allocate Limit
                    </button>
                    <button
                        type="button"
                        onClick={() => setActionType('transfer')}
                        className={`btn ${actionType === 'transfer' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderRadius: '8px' }}
                    >
                        Fund Transfer
                    </button>
                </div>

                <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {actionType === 'allocate' ? (
                        <>
                            <div>
                                <label className="budget-card-stat-label">Select {initialType === 'department' ? 'Department' : 'Project'}</label>
                                <select
                                    className="mt-1"
                                    value={formData.target_id}
                                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Target...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="budget-card-stat-label">Total Budget Limit (₱)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="mt-1"
                                    placeholder="Enter new budget cap..."
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="budget-card-stat-label">From (Source)</label>
                                <select
                                    className="mt-1"
                                    value={formData.from_id}
                                    onChange={(e) => setFormData({ ...formData, from_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Source...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} (₱{parseFloat(d.available || 0).toLocaleString()})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="budget-card-stat-label">To (Destination)</label>
                                <select
                                    className="mt-1"
                                    value={formData.to_id}
                                    onChange={(e) => setFormData({ ...formData, to_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Destination...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="budget-card-stat-label">Transfer Amount (₱)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="mt-1"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="budget-card-stat-label">Reason / Justification</label>
                                <textarea
                                    className="mt-1"
                                    rows="2"
                                    placeholder="E.g. Project realignment..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', width: '100%', borderRadius: '12px', padding: '1rem', fontBold: 800 }}
                    >
                        {loading ? 'Processing...' : actionType === 'allocate' ? 'Set Budget Limit' : 'Execute Transfer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const BudgetPage = () => {
    const [view, setView] = useState('summary'); // summary | ledger
    const [budgetType, setBudgetType] = useState('department'); // department | project
    const [data, setData] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchSummary();
    }, [budgetType]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const response = await budgetService.getSummary(budgetType);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching budget summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDept = async (dept) => {
        setLoading(true);
        try {
            const response = await budgetService.getDetails(dept.id);
            setSelectedDept(response.data);
            setView('ledger');
        } catch (error) {
            console.error('Error fetching budget details:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalBudget = data.reduce((acc, curr) => acc + (parseFloat(curr.budget_limit) || 0), 0);
    const totalAvailable = data.reduce((acc, curr) => acc + (parseFloat(curr.available) || 0), 0);
    const overallUtilization = totalBudget > 0 ? Math.round(((totalBudget - totalAvailable) / totalBudget) * 100) : 0;

    if (loading && data.length === 0) {
        return (
            <div className="view animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Activity className="animate-pulse" size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Syncing Ledger Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="view animate-fade-in">
            {/* Header Section */}
            <div className="header-top" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.04em' }}>
                        Budget Monitoring
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '1rem' }}>
                        Intelligent financial controls and real-time ledger tracking.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setBudgetType('department')}
                            className={`btn ${budgetType === 'department' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '0.5rem 1.25rem', textTransform: 'uppercase', fontSize: '0.7rem', borderRadius: '8px' }}
                        >
                            OPEX
                        </button>
                        <button
                            onClick={() => setBudgetType('project')}
                            className={`btn ${budgetType === 'project' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '0.5rem 1.25rem', textTransform: 'uppercase', fontSize: '0.7rem', borderRadius: '8px' }}
                        >
                            CAPEX
                        </button>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ borderRadius: '12px' }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <ArrowUpRight size={18} /> ALLOCATE FUNDS
                    </button>
                </div>
            </div>

            {view === 'summary' ? (
                <>
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card shimmer">
                            <div className="icon-box" style={{ background: 'rgba(29, 67, 155, 0.1)', color: 'var(--primary)' }}>
                                <Wallet size={20} />
                            </div>
                            <div>
                                <div className="budget-card-stat-label">Total Allocated</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>₱{totalBudget.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <div className="budget-card-stat-label">Total Available</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--success)' }}>₱{totalAvailable.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="icon-box" style={{ background: 'rgba(235, 52, 46, 0.1)', color: 'var(--accent)' }}>
                                <PieChart size={20} />
                            </div>
                            <div>
                                <div className="budget-card-stat-label">Overall Utilization</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{overallUtilization}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Filter budget lines by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '48px', borderRadius: '12px', background: 'var(--bg-main)' }}
                            />
                        </div>
                        <button className="btn btn-outline" style={{ borderRadius: '12px' }}>
                            <Layers size={18} />
                            <span className="desktop-only">Group By Category</span>
                        </button>
                    </div>

                    {/* Budget Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                        {filteredData.map((item, idx) => (
                            <div
                                key={item.id}
                                className="glass-card animate-slide-up"
                                style={{ padding: '2rem', cursor: 'pointer', animationDelay: `${idx * 0.05}s` }}
                                onClick={() => handleSelectDept(item)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{item.name}</h3>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID: {item.id.split('-')[0]}</div>
                                    </div>
                                    <div className="budget-card-utilization" style={{
                                        background: item.utilization_rate > 90 ? 'rgba(235, 52, 46, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: item.utilization_rate > 90 ? 'var(--accent)' : 'var(--success)'
                                    }}>
                                        {item.utilization_rate}%
                                    </div>
                                </div>

                                <div className="budget-progress-bg" style={{ marginBottom: '1.5rem' }}>
                                    <div
                                        className={`budget-progress-bar ${item.utilization_rate > 90 ? 'gradient-danger' :
                                            item.utilization_rate > 70 ? 'gradient-warning' :
                                                'gradient-safe'
                                            }`}
                                        style={{ width: `${Math.min(item.utilization_rate, 100)}%` }}
                                    ></div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <div className="budget-card-stat-label text-success" style={{ color: 'var(--success)' }}>Available</div>
                                        <div className="budget-card-stat-value">₱{(parseFloat(item.available) || 0).toLocaleString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="budget-card-stat-label">Total Limit</div>
                                        <div className="budget-card-stat-value">₱{(parseFloat(item.budget_limit) || 0).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                        style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                    >
                                        ALLOCATE <ArrowUpRight size={14} />
                                    </div>
                                    <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        LEDGER <History size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="animate-slide-up">
                    {/* Detailed Ledger Component */}
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                        <button className="btn btn-outline" onClick={() => setView('summary')} style={{ borderRadius: '8px', padding: '8px 16px' }}>
                            <ChevronLeft size={18} /> BACK TO OVERVIEW
                        </button>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-primary" style={{ borderRadius: '12px' }} onClick={() => setIsModalOpen(true)}>
                                <ArrowLeftRight size={18} /> <span className="desktop-only">Internal Transfer</span>
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '2.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(29, 67, 155, 0.02)' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{selectedDept.summary.name}</h1>
                                <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Transaction & Commitment Ledger History</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="glass-card" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                                    <div className="budget-card-stat-label" style={{ color: 'var(--success)' }}>CURRENT AVAILABLE</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--success)' }}>₱{(parseFloat(selectedDept.summary.available) || 0).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
                            <table style={{ width: '100%' }}>
                                <thead style={{ background: 'var(--bg-main)' }}>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Reference</th>
                                        <th>Description</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedDept.ledger.data || []).map((log) => (
                                        <tr key={log.id}>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className="ledger-type-badge" style={{
                                                    background: log.type === 'actual' ? 'rgba(16, 185, 129, 0.1)' :
                                                        log.type === 'encumbrance' ? 'rgba(29, 67, 155, 0.1)' :
                                                            log.type === 'pre_encumbrance' ? 'rgba(245, 158, 11, 0.1)' :
                                                                'rgba(148, 163, 184, 0.1)',
                                                    color: log.type === 'actual' ? 'var(--success)' :
                                                        log.type === 'encumbrance' ? 'var(--primary)' :
                                                            log.type === 'pre_encumbrance' ? 'var(--warning)' :
                                                                'var(--text-muted)'
                                                }}>
                                                    {log.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                                                {log.requisition?.ref_number || log.purchase_order?.ref_number || log.payment_request?.ref_number || 'ADJ-REF'}
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{log.description}</div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: log.amount < 0 ? 'var(--accent)' : 'var(--text-dark)' }}>
                                                {log.amount < 0 ? '-' : '+'}₱{Math.abs(parseFloat(log.amount) || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <BudgetActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchSummary}
                initialType={budgetType}
                departments={data}
            />
        </div>
    );
};

export default BudgetPage;
