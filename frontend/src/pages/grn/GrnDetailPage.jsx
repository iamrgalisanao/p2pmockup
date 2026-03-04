import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { grnService } from '../../services/grnService';
import {
    ArrowLeft,
    Package,
    Calendar,
    User,
    FileText,
    CheckCircle,
    Info
} from 'lucide-react';

const GrnDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: grn, isLoading } = useQuery({
        queryKey: ['grn', id],
        queryFn: () => grnService.getById(id).then(res => res.data),
    });

    if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading receipt details...</div>;
    if (!grn) return <div style={{ padding: '4rem', textAlign: 'center' }}>Receipt not found.</div>;

    return (
        <div className="view animate-fade-in">
            <div className="header-top" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate('/grns')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.75rem' }}>Receipt: {grn.ref_number}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Posted on {new Date(grn.created_at).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Line Items */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={18} color="var(--primary)" />
                            RECEIVED ITEMS
                        </h3>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th style={{ textAlign: 'center' }}>Received Qty</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grn.line_items?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{item.po_line_item?.description}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit: {item.po_line_item?.unit}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    background: 'var(--primary-light)',
                                                    color: 'var(--primary)',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontWeight: 700
                                                }}>
                                                    {item.quantity_received}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                {item.remarks || '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Remarks */}
                    {grn.remarks && (
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={18} color="var(--primary)" />
                                GENERAL REMARKS
                            </h3>
                            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-dark)' }}>{grn.remarks}</p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.875rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>SUMMARY</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Calendar size={18} color="var(--primary)" />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Received</div>
                                    <div style={{ fontWeight: 700 }}>{new Date(grn.received_date).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <User size={18} color="var(--primary)" />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Received By</div>
                                    <div style={{ fontWeight: 700 }}>{grn.received_by}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <FileText size={18} color="var(--primary)" />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Linked PO</div>
                                    <div
                                        style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}
                                        onClick={() => navigate(`/requisitions/${grn.purchase_order?.requisition_id}`)}
                                    >
                                        {grn.purchase_order?.ref_number}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <CheckCircle size={18} color="var(--success)" />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                                    <div style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)' }}>{grn.status}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>VENDOR</h4>
                        <div style={{ fontWeight: 700 }}>{grn.purchase_order?.vendor?.name}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GrnDetailPage;
