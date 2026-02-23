import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentRequestService } from '../../services/paymentRequestService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Info,
    CreditCard,
    CheckCircle,
    CheckSquare,
    Calculator
} from 'lucide-react';

const PaymentRequestFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = !!id;

    const [step, setStep] = useState(1);
    const steps = [
        { id: 1, label: 'Details', icon: Info },
        { id: 2, label: 'Bill of Quantities', icon: Calculator },
        { id: 3, label: 'Payment Info', icon: CreditCard },
        { id: 4, label: 'Review', icon: CheckSquare }
    ];

    const [form, setForm] = useState({
        requisition_id: '',
        vendor_id: '',
        title: '',
        description: '',
        payment_method: 'bank_transfer',
        due_date: '',
        bank_name: '',
        account_number: '',
        account_name: '',
    });

    const [items, setItems] = useState([
        { description: '', quantity: 1, unit_cost: 0, line_total: 0 }
    ]);

    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => api.get('/vendors').then(res => res.data),
    });

    const { data: requisitions } = useQuery({
        queryKey: ['requisitions', 'approved'],
        queryFn: () => api.get('/requisitions?status=approved').then(res => res.data),
    });

    const mutation = useMutation({
        mutationFn: (data) => isEdit ? paymentRequestService.update(id, data) : paymentRequestService.create(data),
        onSuccess: () => {
            toast.success(`Payment request ${isEdit ? 'updated' : 'created'} successfully`);
            queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
            navigate('/payment-requests');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Something went wrong');
        }
    });

    const addItem = () => setItems([...items, {
        description: '',
        unit: 'pcs',
        quantity: 1,
        unit_cost: 0,
        line_total: 0,
        gl_account_code: '',
        gl_category: ''
    }]);
    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'unit_cost') {
            newItems[index].line_total = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].unit_cost) || 0);
        }
        setItems(newItems);
    };

    const calculateTotal = () => items.reduce((sum, item) => sum + item.line_total, 0);

    const validateStep = (s) => {
        if (s === 1) {
            if (!form.title || !form.vendor_id) {
                toast.error('Please fill in title and vendor');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            ...form,
            items,
            amount: calculateTotal()
        });
    };

    return (
        <div className="view animate-fade-in">
            <div className="form-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>{isEdit ? 'Edit Payment Request' : 'New Payment Request'}</h1>
                    <p className="desktop-only" style={{ color: 'var(--text-muted)' }}>Create a voucher for disbursements and vendor payments.</p>
                </div>
            </div>

            <div className="stepper-container-simple" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem', position: 'relative' }}>
                {steps.map((s) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: step >= s.id ? 1 : 0.4 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', background: step >= s.id ? 'var(--primary)' : 'var(--bg-main)',
                            color: step >= s.id ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `2px solid ${step >= s.id ? 'var(--primary)' : 'var(--border)'}`,
                            boxShadow: step === s.id ? '0 0 0 4px var(--primary-glow)' : 'none',
                            transition: 'all 0.3s ease'
                        }}>
                            {step > s.id ? <CheckCircle size={18} /> : <s.icon size={18} />}
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.02em', color: step >= s.id ? 'var(--text-dark)' : 'var(--text-muted)' }}>{s.label.toUpperCase()}</span>
                        {s.id < 4 && <div className="desktop-only" style={{ width: '40px', height: '2px', background: 'var(--border)' }} />}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="animate-slide-in">
                {step === 1 && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Step 1: Payment Header</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Payment Title / Subject</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Office Supplies Reimbursement" />
                            </div>
                            <div className="form-group">
                                <label>Vendor / Payee</label>
                                <select value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                                    <option value="">Select Vendor</option>
                                    {vendors?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Related Approved Requisition (Optional)</label>
                                <select value={form.requisition_id} onChange={e => setForm({ ...form, requisition_id: e.target.value })}>
                                    <option value="">No PR Linked</option>
                                    {requisitions?.data?.map(r => <option key={r.id} value={r.id}>{r.ref_number} - {r.title}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', letterSpacing: '0.05em', fontWeight: 800 }}>BILL OF QUANTITIES (BOQ)</h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Items requesting for payment disbursement.</p>
                            </div>
                            <button type="button" className="btn btn-primary" onClick={addItem} style={{ gap: '8px', padding: '10px 20px' }}>
                                <Plus size={18} /> Add Line Item
                            </button>
                        </div>

                        {/* Table Headers */}
                        <div className="boq-header" style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 80px 80px 120px 150px 40px',
                            gap: '12px'
                        }}>
                            <div>Description & Allocation</div>
                            <div style={{ textAlign: 'center' }}>Unit</div>
                            <div style={{ textAlign: 'center' }}>Qty</div>
                            <div style={{ textAlign: 'right' }}>Unit Price</div>
                            <div style={{ textAlign: 'right' }}>Line Total</div>
                            <div></div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {items.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                                    No items added yet. Click "Add Line Item" to start.
                                </div>
                            ) : items.map((item, index) => (
                                <div key={index} className="boq-item-row animate-slide-in" style={{
                                    gridTemplateColumns: '2fr 80px 80px 120px 150px 40px'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div className="boq-field-group">
                                            <input
                                                placeholder="Enter item description..."
                                                value={item.description}
                                                onChange={e => updateItem(index, 'description', e.target.value)}
                                                style={{ fontSize: '1rem' }}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                                            <div className="boq-field-group">
                                                <label className="boq-field-label">GL Account</label>
                                                <input
                                                    placeholder="e.g. 50203010"
                                                    value={item.gl_account_code}
                                                    onChange={e => updateItem(index, 'gl_account_code', e.target.value)}
                                                    style={{ fontSize: '0.75rem' }}
                                                />
                                            </div>
                                            <div className="boq-field-group">
                                                <label className="boq-field-label">Category</label>
                                                <input
                                                    placeholder="e.g. Repairs & Maint."
                                                    value={item.gl_category}
                                                    onChange={e => updateItem(index, 'gl_category', e.target.value)}
                                                    style={{ fontSize: '0.75rem' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="boq-field-group" style={{ justifyContent: 'center' }}>
                                        <input
                                            placeholder="pcs"
                                            value={item.unit}
                                            onChange={e => updateItem(index, 'unit', e.target.value)}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </div>
                                    <div className="boq-field-group" style={{ justifyContent: 'center' }}>
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', e.target.value)}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </div>
                                    <div className="boq-field-group" style={{ justifyContent: 'center' }}>
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={item.unit_cost}
                                            onChange={e => updateItem(index, 'unit_cost', e.target.value)}
                                            style={{ textAlign: 'right' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>
                                        PHP {item.line_total.toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <button type="button" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }} onClick={() => setItems(items.filter((_, i) => i !== index))} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.6'}>
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="boq-total-section">
                            <div className="boq-total-label">TOTAL AMOUNT:</div>
                            <div className="boq-total-amount">PHP {calculateTotal().toLocaleString()}</div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Step 3: Disbursement Method</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="check">Check Payment</option>
                                    <option value="petty_cash">Petty Cash</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Estimated Due Date</label>
                                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                            </div>
                            {form.payment_method === 'bank_transfer' && (
                                <>
                                    <div className="form-group">
                                        <label>Bank Name</label>
                                        <input type="text" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Account Number</label>
                                        <input type="text" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Step 4: Review and Submit</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Header Information</h4>
                                <div style={{ fontWeight: 700 }}>{form.title}</div>
                                <div style={{ fontSize: '0.875rem' }}>Payee: {vendors?.find(v => v.id == form.vendor_id)?.name}</div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Financial Summary</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>PHP {calculateTotal().toLocaleString()}</div>
                                <div style={{ fontSize: '0.875rem' }}>Method: {form.payment_method?.replace(/_/g, ' ').toUpperCase()}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <button type="button" className="btn btn-outline" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    {step < 4 ? (
                        <button type="button" className="btn btn-primary" onClick={() => validateStep(step) && setStep(step + 1)}>
                            Continue
                        </button>
                    ) : (
                        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Processing...' : 'Submit Payment Request'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default PaymentRequestFormPage;
