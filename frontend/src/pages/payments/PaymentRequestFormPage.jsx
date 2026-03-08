import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentRequestService } from '../../services/paymentRequestService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    CheckCircle,
    Info,
    CreditCard,
    CheckSquare,
    Calculator,
    AlertCircle,
    ShoppingCart
} from 'lucide-react';

const PaymentRequestFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const isEdit = !!id;

    // Get requisition_id from URL if creating new RFP from a Requisition
    const queryParams = new URLSearchParams(location.search);
    const initialReqId = queryParams.get('requisition_id');

    const [step, setStep] = useState(1);
    const steps = [
        { id: 1, label: 'Details', icon: Info },
        { id: 2, label: 'Items', icon: Calculator },
        { id: 3, label: 'Payment Info', icon: CreditCard },
        { id: 4, label: 'Review', icon: CheckSquare }
    ];

    const [form, setForm] = useState({
        requisition_id: initialReqId || '',
        po_jo_id: '',
        vendor_id: '',
        title: '',
        particulars: '',
        payment_method: 'bank_transfer',
        due_date: '',
    });

    const [items, setItems] = useState([]);

    // Fetch requisition details if linked
    const { data: linkedRequisition, isLoading: isLoadingReq } = useQuery({
        queryKey: ['requisition', form.requisition_id],
        queryFn: () => api.get(`/requisitions/${form.requisition_id}`).then(res => res.data),
        enabled: !!form.requisition_id && !isEdit
    });

    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => api.get('/vendors').then(res => res.data),
    });

    const { data: requisitions } = useQuery({
        queryKey: ['requisitions', 'ready_for_rfp'],
        queryFn: () => api.get('/requisitions?status=po_issued,awarded').then(res => res.data),
        enabled: !isEdit && !form.requisition_id
    });

    // Auto-fill logic when requisition is selected/fetched
    useEffect(() => {
        if (linkedRequisition && !isEdit) {
            const poJo = linkedRequisition.purchase_order || linkedRequisition.job_order;
            setForm(prev => ({
                ...prev,
                po_jo_id: poJo?.id || '',
                vendor_id: poJo?.vendor_id || '',
                title: `RFP for ${linkedRequisition.title}`,
                particulars: linkedRequisition.particulars || ''
            }));

            if (poJo?.line_items) {
                setItems(poJo.line_items.map(li => ({
                    description: li.description,
                    unit: li.unit,
                    quantity: li.quantity,
                    unit_cost: li.unit_price,
                    line_total: li.line_total
                })));
            }
        }
    }, [linkedRequisition, isEdit]);

    const mutation = useMutation({
        mutationFn: (data) => isEdit ? paymentRequestService.update(id, data) : paymentRequestService.create(data),
        onSuccess: (res) => {
            const rfpId = res.data.id || id;
            toast.success(`RFP ${isEdit ? 'updated' : 'created'} draft successfully.`);
            queryClient.invalidateQueries({ queryKey: ['payment-requests'] });

            // Proactive: Ask user if they want to submit now or later
            if (confirm('RFP draft saved. Submit for Accounting Validation now?')) {
                api.post(`/payment-requests/${rfpId}/submit`)
                    .then(() => {
                        toast.success('RFP submitted to Accounting.');
                        navigate('/payment-requests');
                    })
                    .catch(() => navigate(`/payments/${rfpId}`));
            } else {
                navigate(`/payments/${rfpId}`);
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to save RFP');
        }
    });

    const calculateTotal = () => items.reduce((sum, item) => sum + parseFloat(item.line_total || 0), 0);

    const validateStep = (s) => {
        if (s === 1) {
            if (!form.title || !form.vendor_id || !form.po_jo_id) {
                toast.error('Title, Vendor, and associated PO/JO are required.');
                return false;
            }
        }
        if (s === 2 && items.length === 0) {
            toast.error('At least one item is required.');
            return false;
        }
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            ...form,
            line_items: items,
            amount: calculateTotal()
        });
    };

    if (isLoadingReq) return <div style={{ padding: '4rem', textAlign: 'center' }}>Fetching linked requisition and PO details...</div>;

    return (
        <div className="view animate-fade-in">
            <div className="form-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>{isEdit ? 'Edit RFP' : 'Create Request for Payment'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Generate a payment request based on an approved JO/PO.</p>
                </div>
            </div>

            <div className="stepper-container-simple" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
                {steps.map((s) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: step >= s.id ? 1 : 0.4 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', background: step >= s.id ? 'var(--primary)' : 'var(--bg-main)',
                            color: step >= s.id ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `2px solid ${step >= s.id ? 'var(--primary)' : 'var(--border)'}`,
                            transition: 'all 0.3s ease'
                        }}>
                            {step > s.id ? <CheckCircle size={18} /> : <s.icon size={18} />}
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', color: step >= s.id ? 'var(--text-dark)' : 'var(--text-muted)' }}>{s.label.toUpperCase()}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="animate-slide-in">
                {step === 1 && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={18} className="text-primary" /> Header Details
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>RFP Title</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Final Payment for Office Renovation" />
                            </div>
                            <div className="form-group">
                                <label>Linked Requisition</label>
                                <select
                                    value={form.requisition_id}
                                    onChange={e => setForm({ ...form, requisition_id: e.target.value })}
                                    disabled={!!initialReqId}
                                >
                                    <option value="">Manual Entry (Not Recommended)</option>
                                    {requisitions?.data?.map(req => (
                                        <option key={req.id} value={req.id}>{req.ref_number} - {req.title}</option>
                                    ))}
                                    {linkedRequisition && (
                                        <option value={linkedRequisition.id}>{linkedRequisition.ref_number} - {linkedRequisition.title}</option>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Associated Vendor / Payee</label>
                                <select value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })} disabled={!!linkedRequisition}>
                                    <option value="">Select Vendor</option>
                                    {vendors?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Particulars / Remarks</label>
                                <textarea
                                    value={form.particulars}
                                    onChange={e => setForm({ ...form, particulars: e.target.value })}
                                    rows={4}
                                    placeholder="Provide detailed context for accounting review..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calculator size={18} className="text-primary" /> Items for Payment
                            </h3>
                            <div className="badge badge-info" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <AlertCircle size={14} />
                                <span>Mapped from Approved PO/JO</span>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Description</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>Unit</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>Qty</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Unit Cost</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px' }}>{item.description}</td>
                                        <td style={{ textAlign: 'center' }}>{item.unit}</td>
                                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'right' }}>₱{parseFloat(item.unit_cost).toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>₱{parseFloat(item.line_total).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'right', padding: '20px', fontWeight: 600 }}>GRAND TOTAL</td>
                                    <td style={{ textAlign: 'right', padding: '20px', fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)' }}>₱{calculateTotal().toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {step === 3 && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={18} className="text-primary" /> Payment Method & Due Date
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Preferred Payment Method</label>
                                <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                                    <option value="bank_transfer">Bank Transfer (EFT)</option>
                                    <option value="check">Check Payment</option>
                                    <option value="petty_cash">Petty Cash</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Desired Due Date</label>
                                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '2rem' }}>Review Submission</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                            <div className="review-section">
                                <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem' }}>TITLE</label>
                                <div style={{ fontWeight: 700 }}>{form.title}</div>
                            </div>
                            <div className="review-section">
                                <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem' }}>TOTAL AMOUNT</label>
                                <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)' }}>₱{calculateTotal().toLocaleString()}</div>
                            </div>
                            <div className="review-section">
                                <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem' }}>VENDOR</label>
                                <div style={{ fontWeight: 700 }}>{vendors?.find(v => v.id == form.vendor_id)?.name}</div>
                            </div>
                        </div>
                        <div className="alert alert-info" style={{ marginTop: '2rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <ShoppingCart size={20} />
                            <p style={{ fontSize: '0.875rem' }}>Once saved, this RFP will be ready for Accounting validation before the final approval workflow begins.</p>
                        </div>
                    </div>
                )}

                <div className="form-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
                        {step === 1 ? 'Cancel' : 'Previous Step'}
                    </button>
                    {step < 4 ? (
                        <button type="button" className="btn btn-primary" onClick={() => validateStep(step) && setStep(step + 1)}>
                            Continue
                        </button>
                    ) : (
                        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Save RFP Draft'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default PaymentRequestFormPage;
