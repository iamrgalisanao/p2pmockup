import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentRequestService } from '../../services/paymentRequestService';
import { ArrowLeft, Printer, Clock, CheckCircle, XCircle } from 'lucide-react';

const PaymentRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: request, isLoading } = useQuery({
        queryKey: ['payment-request', id],
        queryFn: () => paymentRequestService.getById(id).then(res => res.data),
    });

    if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading payment request details...</div>;
    if (!request) return <div style={{ padding: '4rem', textAlign: 'center' }}>Payment Request not found.</div>;

    return (
        <div className="view animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.75rem' }}>{request.ref_number}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>{request.title}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline">
                        <Printer size={18} />
                        <span>Print Voucher</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>PARTICULARS</h3>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{request.description || 'No additional details provided.'}</p>

                        <div style={{ marginTop: '2.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>PAYMENT ITEMS</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 0' }}>Description</th>
                                        <th style={{ textAlign: 'right', padding: '12px 0' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '12px 0' }}>Amount</th>
                                        <th style={{ textAlign: 'right', padding: '12px 0' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request.line_items?.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px 0' }}>{item.description}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 0' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 0' }}>₱{parseFloat(item.unit_cost).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 700 }}>₱{parseFloat(item.line_total).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'right', padding: '20px 0', fontWeight: 600 }}>SUBTOTAL</td>
                                        <td style={{ textAlign: 'right', padding: '20px 0', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>₱{parseFloat(request.amount).toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Request Status</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <span className={`badge badge-${request.status}`} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', width: '100%', textAlign: 'center' }}>
                                {request.status.toUpperCase()}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>VENDOR / PAYEE</label>
                                <span style={{ fontWeight: 700 }}>{request.vendor?.name}</span>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PAYMENT METHOD</label>
                                <span style={{ fontWeight: 700 }}>{request.payment_method?.replace(/_/g, ' ').toUpperCase()}</span>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DUE DATE</label>
                                <span style={{ fontWeight: 700 }}>{request.due_date ? new Date(request.due_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentRequestDetailPage;
