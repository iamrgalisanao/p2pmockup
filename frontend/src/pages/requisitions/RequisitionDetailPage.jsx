import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Clock,
    CheckCircle,
    Send,
    Download,
    Plus,
    History,
    CheckSquare,
    Edit,
    ShoppingCart,
    AlertCircle,
    RotateCcw,
    FileText,
    TrendingDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../services/api';

const RequisitionDetailPage = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    const { data: r, isLoading } = useQuery({
        queryKey: ['requisition', id],
        queryFn: () => api.get(`/requisitions/${id}`).then(res => res.data),
    });

    const submitMutation = useMutation({
        mutationFn: () => api.post(`/requisitions/${id}/submit`),
        onSuccess: () => {
            toast.success('Submitted for approval!');
            queryClient.invalidateQueries({ queryKey: ['requisition', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });

    const [selectedQuote, setSelectedQuote] = useState(null);

    const addQuoteMutation = useMutation({
        mutationFn: (vendorId) => api.post(`/requisitions/${id}/quotes`, { vendor_id: vendorId }),
        onSuccess: () => {
            toast.success('Vendor quote added.');
            queryClient.invalidateQueries({ queryKey: ['requisition', id] });
        }
    });

    const updateQuotePricingMutation = useMutation({
        mutationFn: ({ quoteId, items }) => api.put(`/requisitions/${id}/quotes/${quoteId}/line-items`, { items }),
        onSuccess: () => {
            toast.success('Pricing updated.');
            queryClient.invalidateQueries({ queryKey: ['requisition', id] });
            setSelectedQuote(null);
        }
    });

    const awardMutation = useMutation({
        mutationFn: ({ quoteId, basis, justification }) =>
            api.post(`/requisitions/${id}/quotes/${quoteId}/award`, {
                award_basis: basis,
                override_justification: justification
            }),
        onSuccess: () => {
            toast.success('Contract awarded successfully!');
            queryClient.invalidateQueries({ queryKey: ['requisition', id] });
        }
    });

    const generateDocMutation = useMutation({
        mutationFn: (type) => api.post(`/requisitions/${id}/documents/generate`, { type }),
        onSuccess: () => {
            toast.success('Document generated.');
            queryClient.invalidateQueries({ queryKey: ['requisition', id] });
        }
    });

    const markSentMutation = useMutation({
        mutationFn: (type) => api.post(`/requisitions/${id}/documents/mark-sent`, { type }),
        onSuccess: () => {
            toast.success('Document marked as sent.');
            queryClient.invalidateQueries({ queryKey: ['requisition', id] });
        }
    });

    const viewDoc = async (type) => {
        try {
            const res = await api.get(`/requisitions/${id}/documents/view`, { params: { type } });
            window.open(res.data.url, '_blank');
        } catch (err) {
            toast.error('Failed to get document URL');
        }
    };

    const approveMutation = useMutation({
        mutationFn: ({ stepId, action, comment }) => api.post(`/requisitions/${id}/approval-steps/${stepId}/act`, { action, comment }),
        onSuccess: () => {
            toast.success('Action recorded.');
            queryClient.invalidateQueries({ queryKey: ['requisition', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });

    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => api.get('/vendors').then(res => res.data),
        enabled: activeTab === 'quotes-awarding'
    });

    if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading details...</div>;
    if (!r) return <div style={{ padding: '4rem', textAlign: 'center' }}>Requisition not found.</div>;

    return (
        <div className="detail-view animate-fade-in">
            {/* Header Bar */}
            <div className="detail-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{r.ref_number}</span>
                        <span className={`badge badge-${r.status}`}>{r.status.replace('_', ' ')}</span>
                        {r.priority === 'urgent' && <span className="badge badge-urgent">URGENT</span>}
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{r.title}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Created by {r.user?.name} &bull; {new Date(r.created_at).toLocaleDateString()}</p>
                </div>

                <div className="header-actions">
                    {(r.status === 'draft' || r.status === 'returned') && (
                        <>
                            <button className="btn btn-primary" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                                <Send size={18} />
                                {submitMutation.isPending ? '...' : 'SUBMIT PR'}
                            </button>
                            <button className="btn btn-outline" onClick={() => navigate(`/requisitions/${id}/edit`)}>
                                <Edit size={18} />
                                EDIT
                            </button>
                        </>
                    )}
                    <button className="btn btn-outline" onClick={() => {
                        const token = useAuthStore.getState().token;
                        const baseUrl = API_BASE_URL || 'http://localhost:8000/api';
                        const finalUrl = `${baseUrl}/reports/requisitions/${id}/export?token=${token}`;
                        window.open(finalUrl, '_blank');
                    }}>
                        <Download size={18} />
                        EXPORT
                    </button>
                    {r.status === 'approved' && (
                        <button className="btn btn-primary" style={{ background: '#059669' }}>
                            <Plus size={18} />
                            ISSUE PO
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="detail-tabs">
                {['Overview', 'BOQ Items', 'Quotes & Awarding', 'Comparison Matrix', 'NTA & PO', 'Approval Workflow', 'Attachments', 'Audit Log']
                    .filter(t => {
                        if (t === 'Quotes & Awarding' && ['draft', 'returned'].includes(r.status)) return false;
                        if (t === 'Comparison Matrix' && ['draft', 'returned'].includes(r.status)) return false;
                        if (t === 'NTA & PO' && !['approved', 'awarded', 'po_issued', 'mark_sent'].includes(r.status)) return false;
                        return true;
                    })
                    .map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'))}
                            style={{
                                padding: '1rem 0',
                                borderBottom: activeTab === t.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') ? '2px solid var(--primary)' : '2px solid transparent',
                                background: 'none',
                                borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: activeTab === t.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') ? 'var(--primary)' : 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {t}
                        </button>
                    ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Request Type</label>
                                    <div style={{ fontSize: '1rem', marginTop: '4px', fontWeight: 700, color: 'var(--primary)' }}>{r.request_type?.replace(/_/g, ' ').toUpperCase()}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cost Center</label>
                                    <div style={{ fontSize: '1rem', marginTop: '4px' }}>{r.cost_center || 'Not Specified'}</div>
                                </div>
                                {r.po_number && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>PO Number</label>
                                        <div style={{ fontSize: '1rem', marginTop: '4px' }}>{r.po_number}</div>
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Department</label>
                                    <div style={{ fontSize: '1rem', marginTop: '4px' }}>{r.department?.name}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Requested By</label>
                                    <div style={{ fontSize: '1rem', marginTop: '4px' }}>{r.requester?.name}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Date Needed</label>
                                    <div style={{ fontSize: '1rem', marginTop: '4px' }}>{new Date(r.date_needed).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Estimated Total</label>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>PHP {parseFloat(r.estimated_total).toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Particulars / Background</label>
                                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{r.particulars || 'No particulars provided.'}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'boq-items' && (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Details</th>
                                        <th>Unit</th>
                                        <th>Qty</th>
                                        <th>Est. Unit Cost</th>
                                        <th>TAX Info</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {r.line_items?.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{item.description}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                    {item.gl_account_code && `GL: ${item.gl_account_code} `}
                                                    {item.gl_category && `| Cat: ${item.gl_category}`}
                                                </div>
                                            </td>
                                            <td>{item.unit}</td>
                                            <td>{item.quantity}</td>
                                            <td>PHP {parseFloat(item.estimated_unit_cost).toLocaleString()}</td>
                                            <td>
                                                <div style={{ fontSize: '0.75rem' }}>{item.vat_type}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.wht_type}</div>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>PHP {parseFloat(item.line_total).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'quotes-awarding' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Quotes Controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Vendor Quotes</h2>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-outline" onClick={() => setActiveTab('comparison-matrix')}>
                                        <FileText size={18} /> Comparison Matrix
                                    </button>
                                    <select
                                        className="form-control"
                                        style={{ width: '200px' }}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addQuoteMutation.mutate(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    >
                                        <option value="">+ Add Vendor Quote</option>
                                        {vendors?.filter(v => !r.quotes?.some(q => q.vendor_id === v.id)).map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Quote Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                {r.quotes?.length === 0 ? (
                                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No quotes collected yet. Add vendors to start the sourcing process.
                                    </div>
                                ) : (
                                    r.quotes?.map(quote => (
                                        <div key={quote.id} className="glass-card" style={{ padding: '1.5rem', border: quote.is_awarded ? '2px solid var(--success)' : '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{quote.vendor.name}</h3>
                                                        {quote.is_awarded && <span className="badge badge-approved">AWARDED</span>}
                                                        {!quote.is_complete && <span className="badge badge-urgent">INCOMPLETE</span>}
                                                    </div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--primary)' }}>
                                                        PHP {parseFloat(quote.grand_total).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button className="btn btn-outline" onClick={() => setSelectedQuote(quote)}>
                                                        <Edit size={16} /> Edit Pricing
                                                    </button>
                                                    {quote.is_complete && !quote.is_awarded && (
                                                        <button className="btn btn-primary" onClick={() => {
                                                            const basis = confirm('Is this the Lowest Responsive Bid?') ? 'lowest_responsive_bid' : 'authorized_override';
                                                            const justification = basis === 'authorized_override' ? prompt('Justification for override:') : null;
                                                            if (basis === 'authorized_override' && !justification) return;
                                                            awardMutation.mutate({ quoteId: quote.id, basis, justification });
                                                        }}>
                                                            Award Contract
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Edit Pricing Modal (Simple Inline Implementation) */}
                            {selectedQuote && (
                                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                                    <div className="glass-card" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', padding: '2rem' }}>
                                        <h3 style={{ marginBottom: '1.5rem' }}>Edit Pricing: {selectedQuote.vendor.name}</h3>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Qty</th>
                                                    <th>Unit Price</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedQuote.line_items?.map(item => (
                                                    <tr key={item.id}>
                                                        <td>{item.requisition_line_item.description}</td>
                                                        <td>{item.requisition_line_item.quantity}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                defaultValue={item.unit_price}
                                                                onBlur={(e) => item.unit_price = e.target.value}
                                                            />
                                                        </td>
                                                        <td>PHP {(item.unit_price * item.requisition_line_item.quantity).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                            <button className="btn btn-outline" onClick={() => setSelectedQuote(null)}>Cancel</button>
                                            <button className="btn btn-primary" onClick={() => {
                                                const items = selectedQuote.line_items.map(i => ({ id: i.id, unit_price: i.unit_price }));
                                                updateQuotePricingMutation.mutate({ quoteId: selectedQuote.id, items });
                                            }}>Save Changes</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comparison-matrix' && (
                        <div className="glass-card" style={{ padding: '2rem', overflowX: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Comparison Matrix</h2>
                                <button className="btn btn-outline" onClick={() => setActiveTab('quotes-awarding')}>Back to List</button>
                            </div>
                            <table className="table comparison-table">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '250px' }}>Description / Line Item</th>
                                        <th style={{ width: '80px' }}>Qty</th>
                                        {r.quotes?.map(q => (
                                            <th key={q.id} style={{ textAlign: 'center', background: q.is_awarded ? 'rgba(16, 185, 129, 0.1)' : 'transparent', border: q.is_awarded ? '1px solid var(--success)' : 'none' }}>
                                                <div style={{ fontSize: '0.875rem', color: q.is_awarded ? 'var(--success)' : 'var(--text-muted)' }}>{q.vendor.name}</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)' }}>PHP {parseFloat(q.grand_total).toLocaleString()}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {r.line_items?.map(ri => (
                                        <tr key={ri.id}>
                                            <td style={{ fontSize: '0.875rem' }}>{ri.description}</td>
                                            <td>{ri.quantity}</td>
                                            {r.quotes?.map(q => {
                                                const qi = q.line_items?.find(i => i.requisition_line_item_id === ri.id);
                                                return (
                                                    <td key={q.id} style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 700 }}>PHP {parseFloat(qi?.unit_price || 0).toLocaleString()}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: PHP {parseFloat(qi?.line_total || 0).toLocaleString()}</div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'nta-po' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                            {/* NTA Section */}
                            <div className="glass-card" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem' }}>NOTICE TO AWARD</h3>
                                    {r.notice_to_award && (
                                        <span className={`badge badge-${r.notice_to_award.status}`}>{r.notice_to_award.status.replace('_', ' ').toUpperCase()}</span>
                                    )}
                                </div>

                                {r.notice_to_award ? (
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{r.notice_to_award.ref_number}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Issued: {new Date(r.notice_to_award.issued_at).toLocaleString()}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sent: {r.notice_to_award.sent_at ? new Date(r.notice_to_award.sent_at).toLocaleString() : 'Not yet marked as sent'}</div>

                                        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => viewDoc('nta')}>
                                                <FileText size={18} /> View PDF
                                            </button>
                                            {r.notice_to_award.status !== 'mark_sent' && (
                                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => markSentMutation.mutate('nta')}>
                                                    <Send size={18} /> Mark as Sent
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <AlertCircle size={40} color="var(--warning)" style={{ marginBottom: '1rem' }} />
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>NTA has not been generated yet.</p>
                                        <button className="btn btn-primary" onClick={() => generateDocMutation.mutate('nta')} disabled={generateDocMutation.isPending}>
                                            {generateDocMutation.isPending ? 'Generating...' : 'Generate NTA'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* PO/JO Section */}
                            <div className="glass-card" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem' }}>PURCHASE / JOB ORDER</h3>
                                    {r.purchase_order && (
                                        <span className={`badge badge-${r.purchase_order.status}`}>{r.purchase_order.status.replace('_', ' ').toUpperCase()}</span>
                                    )}
                                </div>

                                {r.purchase_order ? (
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{r.purchase_order.ref_number}</div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>Type: {r.purchase_order.type.replace('_', ' ').toUpperCase()}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Issued: {new Date(r.purchase_order.issued_at).toLocaleString()}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sent: {r.purchase_order.sent_at ? new Date(r.purchase_order.sent_at).toLocaleString() : 'Not yet marked as sent'}</div>

                                        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => viewDoc('po')}>
                                                <FileText size={18} /> View PDF
                                            </button>
                                            {r.purchase_order.status !== 'mark_sent' && (
                                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => markSentMutation.mutate('po')}>
                                                    <Send size={18} /> Mark as Sent
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <ShoppingCart size={40} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Ready for PO/JO generation.</p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => generateDocMutation.mutate('po')} disabled={generateDocMutation.isPending}>
                                                {generateDocMutation.isPending ? 'Working...' : 'Generate PO'}
                                            </button>
                                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => generateDocMutation.mutate('jo')} disabled={generateDocMutation.isPending}>
                                                {generateDocMutation.isPending ? 'Working...' : 'Generate JO'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'approval-workflow' && (
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {r.approval_steps?.map((step, idx) => (
                                    <div key={step.id} style={{ display: 'flex', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                background: step.action === 'approved' ? 'var(--success)' : (step.action === 'pending' ? 'var(--warning)' : 'rgba(255,255,255,0.05)'),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.action === 'approved' || step.action === 'pending' ? '#000' : 'var(--text-muted)',
                                                border: step.action === 'pending' ? 'none' : '1px solid var(--border)'
                                            }}>
                                                {step.action === 'approved' ? <CheckCircle size={20} /> : <span>{step.step_number}</span>}
                                            </div>
                                            {idx < r.approval_steps.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }} />}
                                        </div>
                                        <div style={{ flex: 1, paddingBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{step.step_label}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.actioned_at ? new Date(step.actioned_at).toLocaleString() : 'Pending'}</div>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Required: {step.role_required.replace('_', ' ').toUpperCase()}</div>
                                            {step.comment && (
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8, marginTop: '0.75rem', fontStyle: 'italic', fontSize: '0.8125rem', borderLeft: '3px solid var(--primary)', color: 'var(--text-muted)' }}>
                                                    &quot;{step.comment}&quot;
                                                </div>
                                            )}

                                            {/* Interaction Button for current approver */}
                                            {step.action === 'pending' && (
                                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-primary" style={{ background: 'var(--success)', padding: '6px 16px' }} onClick={() => approveMutation.mutate({ stepId: step.id, action: 'approved' })}>Approve</button>
                                                    <button className="btn btn-outline" style={{ color: 'var(--danger)', padding: '6px 16px' }} onClick={() => {
                                                        const comment = prompt('Enter reason:');
                                                        if (comment) approveMutation.mutate({ stepId: step.id, action: 'rejected', comment });
                                                    }}>Reject / Request Changes</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'attachments' && (

                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem' }}>REQUISITION ATTACHMENTS</h3>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="file"
                                        id="file-upload"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                formData.append('doc_type', 'supporting_doc');
                                                formData.append('entity_type', 'requisition');
                                                formData.append('entity_id', id);

                                                toast.promise(
                                                    api.post(`/requisitions/${id}/attachments`, formData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    }),
                                                    {
                                                        loading: 'Uploading...',
                                                        success: () => {
                                                            queryClient.invalidateQueries(['requisition', id]);
                                                            return 'File uploaded successfully!';
                                                        },
                                                        error: 'Upload failed.'
                                                    }
                                                );
                                            }
                                        }}
                                    />
                                    <button className="btn btn-primary" onClick={() => document.getElementById('file-upload').click()}>
                                        <Plus size={18} /> Upload File
                                    </button>
                                </div>
                            </div>

                            {r.attachments?.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text-muted)' }}>
                                    No attachments found. Please upload required documents (PR Form, Quotes, etc.)
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    {r.attachments?.map(att => (
                                        <div key={att.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)' }}>
                                            <div style={{ width: 44, height: 44, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                {att.mime_type?.includes('pdf') ? 'PDF' : att.original_filename.split('.').pop().toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.original_filename}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(att.size_bytes / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                            <button className="btn btn-outline" style={{ padding: '6px' }} onClick={async () => {
                                                const res = await api.get(`/attachments/${att.id}/url`);
                                                window.open(res.data.url, '_blank');
                                            }}>
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'audit-log' && (
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>AUDIT TRAIL</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {r.audit_logs?.map((log, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderLeft: '3px solid var(--primary)', background: 'rgba(255,255,255,0.02)', borderRadius: '0 8px 8px 0' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', letterSpacing: '0.5px' }}>{log.event?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN EVENT'}</div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{log.description || `Performed by ${log.user?.name || 'System'}`}</div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', textAlign: 'right' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <aside>
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckSquare size={18} color="var(--primary)" />
                            SOP Checklist
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'PR Form Generated', done: true },
                                { label: 'Dept Head Approved', done: r.status !== 'draft' && r.status !== 'submitted' },
                                { label: 'Min. 3 Vendor Quotes', done: r.quotes?.length >= 3 },
                                { label: 'Financial Compliance', done: r.is_compliant },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem' }}>
                                    {item.done ? <CheckCircle size={14} color="var(--success)" /> : <Clock size={14} color="#94a3b8" />}
                                    <span style={{ color: item.done ? 'var(--text-dark)' : 'var(--text-muted)' }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <History size={18} color="var(--primary)" />
                            SLA Status
                        </h3>
                        <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 12 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                <span>PR AGE</span>
                                <span style={{ color: 'var(--primary)' }}>Active</span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, margin: '12px 0' }}>
                                <div style={{ width: '40%', height: '100%', background: 'var(--primary)', borderRadius: 3, boxShadow: 'var(--shadow-glow)' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deadline: Pending Review</div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default RequisitionDetailPage;
