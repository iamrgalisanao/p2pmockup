import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { requisitionService } from '../services/requisitionService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Inbox,
    Clock,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    User,
    Building2,
    Calendar
} from 'lucide-react';

const InboxPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['inbox'],
        queryFn: () => api.get('/inbox').then(res => res.data),
    });

    const approveMutation = useMutation({
        mutationFn: ({ reqId, stepId, action, comment }) =>
            requisitionService.actOnStep(reqId, stepId, action, comment),
        onSuccess: () => {
            toast.success('Action recorded successfully.');
            queryClient.invalidateQueries(['inbox']);
            queryClient.invalidateQueries(['dashboard-stats']);
        }
    });

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Approval Inbox</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Tasks requiring your immediate review and signature.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {isLoading ? (
                    <div>Loading your tasks...</div>
                ) : (
                    data?.data?.map((step) => (
                        <div key={step.id} className="glass-card" style={{ padding: '1.75rem', borderLeft: step.requisition.priority === 'urgent' ? '4px solid var(--danger)' : '4px solid var(--warning)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(129, 140, 248, 0.15)', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(129, 140, 248, 0.3)' }}>
                                        {step.requisition.ref_number}
                                    </span>
                                    {step.requisition.priority === 'urgent' && (
                                        <span className="badge badge-urgent" style={{ fontSize: '0.65rem' }}>URGENT</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: step.sla_deadline && new Date(step.sla_deadline) < new Date() ? 'var(--danger)' : 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: 8 }}>
                                    <Clock size={14} />
                                    <span>SLA: {step.sla_deadline ? new Date(step.sla_deadline).toLocaleDateString() : 'No Deadline'}</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.step_label}</div>
                                <h3 style={{ fontSize: '1.125rem', marginTop: '4px', lineHeight: 1.3 }}>{step.requisition.title}</h3>
                            </div>

                            {step.requisition.description && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {step.requisition.description}
                                </p>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    <User size={16} color="var(--primary)" />
                                    <span>{step.requisition.requester.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    <Building2 size={16} color="var(--primary)" />
                                    <span>{step.requisition.department.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    <Calendar size={16} color="var(--primary)" />
                                    <span>Needed: {new Date(step.requisition.date_needed).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    <Inbox size={16} color="var(--primary)" />
                                    <span>{step.requisition.line_items?.length || 0} items</span>
                                </div>
                                {step.requisition.project && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-dark)', gridColumn: 'span 2' }}>
                                        <div style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 4, fontWeight: 700, fontSize: '0.7rem' }}>PROJECT</div>
                                        <span>{step.requisition.project.name}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', gridColumn: 'span 2', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                                    <span>ESTIMATED TOTAL:</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>PHP {parseFloat(step.requisition.estimated_total).toLocaleString()}</span>
                                </div>
                            </div>

                            {step.requisition.line_items && step.requisition.line_items.length > 0 && (
                                <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Line Items Preview</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {step.requisition.line_items.slice(0, 3).map((item, idx) => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.8125rem' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{idx + 1}.</span>
                                                    <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{item.description}</span>
                                                </div>
                                                <span style={{ whiteSpace: 'nowrap', color: 'var(--primary)' }}>{item.quantity} {item.unit}</span>
                                            </div>
                                        ))}
                                        {step.requisition.line_items.length > 3 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '8px', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                                                + {step.requisition.line_items.length - 3} more items
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)', flex: 1, boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)' }}
                                    onClick={() => approveMutation.mutate({ reqId: step.requisition_id, stepId: step.id, action: 'approved' })}
                                >
                                    <CheckCircle size={18} />
                                    Approve
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ color: 'var(--danger)', flex: 1, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
                                    onClick={() => {
                                        const comment = prompt('Enter reason for return/rejection:');
                                        if (comment) approveMutation.mutate({ reqId: step.requisition_id, stepId: step.id, action: 'returned', comment });
                                    }}
                                >
                                    <AlertCircle size={18} />
                                    Return
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: '8px', width: '48px' }}
                                    onClick={() => navigate(`/requisitions/${step.requisition_id}`)}
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {!isLoading && data?.data?.length === 0 && (
                    <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-glow)' }}>
                            <Inbox size={40} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Inbox Zero! ✨</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>You have no pending approvals for your role.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxPage;
