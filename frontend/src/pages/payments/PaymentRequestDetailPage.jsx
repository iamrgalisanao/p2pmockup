import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentRequestService } from '../../services/paymentRequestService';
import { useAuthStore } from '../../store/authStore';
import {
    ArrowLeft,
    Printer,
    Clock,
    CheckCircle,
    XCircle,
    ShieldCheck,
    UserCheck,
    MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PaymentRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const { data: request, isLoading } = useQuery({
        queryKey: ['payment-request', id],
        queryFn: () => paymentRequestService.getById(id).then(res => res.data),
    });

    const accountingValidateMutation = useMutation({
        mutationFn: () => paymentRequestService.accountingValidate(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['payment-request', id]);
            toast.success('RFP validated by accounting.');
        },
        onError: (error) => toast.error(error.response?.data?.error || 'Validation failed')
    });

    const actMutation = useMutation({
        mutationFn: ({ stepId, data }) => paymentRequestService.act(id, stepId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['payment-request', id]);
            toast.success('Action recorded successfully.');
        },
        onError: (error) => toast.error(error.response?.data?.error || 'Action failed')
    });

    if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading payment request details...</div>;
    if (!request) return <div style={{ padding: '4rem', textAlign: 'center' }}>Payment Request not found.</div>;

    const currentStep = request.approvals?.find(s => s.action === 'pending');
    const isMyTurn = currentStep && (user?.role === currentStep.role_required || user?.role === 'admin');
    const canValidate = request.status === 'accounting_validated' &&
        ['admin', 'accounting_staff', 'accounting_supervisor', 'accounting_manager'].includes(user?.role);

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
                    {/* Action Header for Workflow */}
                    {(canValidate || isMyTurn) && (
                        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--primary-light)', background: 'rgba(var(--primary-rgb), 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <ShieldCheck className="text-primary" size={24} />
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem' }}>
                                            {canValidate ? 'Accounting Validation Required' : `Decision Required: ${currentStep.step_label}`}
                                        </h3>
                                        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Please review the attached documents and details before proceeding.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    {canValidate ? (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => accountingValidateMutation.mutate()}
                                            disabled={accountingValidateMutation.isPending}
                                        >
                                            <ShieldCheck size={18} />
                                            <span>Validate & Start Workflow</span>
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => actMutation.mutate({ stepId: currentStep.id, data: { action: 'rejected', comment: prompt('Enter rejection reason:') } })}
                                                disabled={actMutation.isPending}
                                            >
                                                <XCircle size={18} />
                                                <span>Reject</span>
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => actMutation.mutate({ stepId: currentStep.id, data: { action: 'approved', comment: 'Approved via Web' } })}
                                                disabled={actMutation.isPending}
                                            >
                                                <CheckCircle size={18} />
                                                <span>Approve</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>PARTICULARS</h3>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{request.particulars || 'No additional details provided.'}</p>

                        <div style={{ marginTop: '2.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>PAYMENT ITEMS</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 0' }}>Description</th>
                                        <th style={{ textAlign: 'right', padding: '12px 0' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '12px 0' }}>Unit Cost</th>
                                        <th style={{ textAlign: 'right', padding: '12px 0' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request.line_items?.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px 0' }}>{item.description}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 0' }}>{parseFloat(item.quantity).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 0' }}>₱{parseFloat(item.unit_cost || 0).toLocaleString()}</td>
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

                    {/* Approval History */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>APPROVAL PROGRESS</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {request.approvals?.map((step) => (
                                <div key={step.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: step.action !== 'pending' ? 'var(--bg-subtle)' : 'transparent' }}>
                                    <div style={{ color: step.action === 'approved' ? 'var(--success)' : (step.action === 'rejected' ? 'var(--error)' : 'var(--text-muted)') }}>
                                        {step.action === 'approved' && <CheckCircle size={20} />}
                                        {step.action === 'rejected' && <XCircle size={20} />}
                                        {step.action === 'pending' && <Clock size={20} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600 }}>{step.step_label}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{step.role_required.toUpperCase()}</span>
                                        </div>
                                        {step.actor && (
                                            <div style={{ fontSize: '0.875rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <UserCheck size={14} />
                                                <span>{step.actor.full_name}</span>
                                                <span style={{ opacity: 0.5 }}>• {new Date(step.actioned_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {step.comment && (
                                            <div style={{ fontSize: '0.875rem', marginTop: '8px', padding: '8px', background: 'var(--card-bg)', borderRadius: '6px', borderLeft: '3px solid var(--border)', display: 'flex', gap: '6px' }}>
                                                <MessageSquare size={14} style={{ marginTop: '3px' }} />
                                                <p style={{ fontStyle: 'italic' }}>{step.comment}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Request Status</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <span className={`badge badge-${request.status}`} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', width: '100%', textAlign: 'center' }}>
                                {request.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>VENDOR / PAYEE</label>
                                <span style={{ fontWeight: 700 }}>{request.vendor?.name || request.payee_name}</span>
                            </div>
                            {request.po_jo && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>RELEVANT {request.po_jo.type.toUpperCase()}</label>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{request.po_jo.ref_number}</span>
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DUE DATE</label>
                                <span style={{ fontWeight: 700 }}>{request.due_date ? new Date(request.due_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            {request.accounting_validator && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ACCOUNTING VALIDATION</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <ShieldCheck size={14} className="text-success" />
                                        <span style={{ fontWeight: 600 }}>{request.accounting_validator.full_name}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(request.accounting_validated_at).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentRequestDetailPage;
