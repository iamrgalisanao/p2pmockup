import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Save,
    ArrowLeft,
    Plus,
    Trash2,
    Info,
    BookOpen,
    Search,
    ChevronRight,
    HelpCircle,
    X,
    CheckCircle,
    CheckSquare
} from 'lucide-react';

const RequisitionFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = !!id;

    const [showWiki, setShowWiki] = useState(false);
    const [wikiSection, setWikiSection] = useState('intro');
    const [step, setStep] = useState(1);

    const steps = [
        { id: 1, label: 'Details', icon: Info },
        { id: 2, label: 'Line Items', icon: Search },
        { id: 3, label: 'Attachments', icon: Plus },
        { id: 4, label: 'Review', icon: CheckSquare }
    ];

    const [form, setForm] = useState({
        title: '',
        request_type: 'po_item',
        po_number: '',
        particulars: '',
        department_id: '',
        cost_center: '',
        project_id: '',
        date_needed: '',
        priority: 'normal',
        description: '',
    });

    const [items, setItems] = useState([
        {
            description: '',
            unit: 'pcs',
            quantity: 1,
            estimated_unit_cost: 0,
            gl_account_code: '',
            gl_category: '',
            vat_type: '12% VAT',
            wht_type: 'None (X1)',
            gross_price: 0,
            net_price: 0,
            line_total: 0
        }
    ]);

    // Fetch Depts/Projects
    const { data: depts } = useQuery({
        queryKey: ['departments'],
        queryFn: () => api.get('/departments').then(res => res.data),
    });

    const { data: existingPR, isLoading } = useQuery({
        queryKey: ['requisition', id],
        queryFn: () => api.get(`/requisitions/${id}`).then(res => res.data),
        enabled: isEdit,
    });

    // Handle initial load for edit mode
    useEffect(() => {
        if (existingPR) {
            setForm({
                title: existingPR.title,
                request_type: existingPR.request_type || 'po_item',
                po_number: existingPR.po_number || '',
                particulars: existingPR.particulars || '',
                department_id: existingPR.department_id,
                cost_center: existingPR.cost_center || '',
                project_id: existingPR.project_id || '',
                date_needed: existingPR.date_needed.split('T')[0],
                priority: existingPR.priority,
                description: existingPR.description || '',
            });
            setItems(existingPR.line_items.map(i => ({
                id: i.id,
                description: i.description,
                unit: i.unit,
                quantity: i.quantity,
                estimated_unit_cost: i.estimated_unit_cost,
                gl_account_code: i.gl_account_code || '',
                gl_category: i.gl_category || '',
                vat_type: i.vat_type || '12% VAT',
                wht_type: i.wht_type || 'None (X1)',
                gross_price: i.gross_price || 0,
                net_price: i.net_price || 0,
                line_total: i.line_total || 0
            })));
        }
    }, [existingPR]);

    const mutation = useMutation({
        mutationFn: async (payload) => {
            const prRes = isEdit
                ? await api.put(`/requisitions/${id}`, payload)
                : await api.post('/requisitions', payload);
            return prRes.data;
        },
        onSuccess: (data) => {
            toast.success(isEdit ? 'Updated successfully!' : 'Created successfully!');
            queryClient.invalidateQueries({ queryKey: ['requisitions'] });
            navigate(`/requisitions/${data.id}`);
        }
    });

    const addItem = () => setItems([...items, {
        description: '',
        unit: 'pcs',
        quantity: 1,
        estimated_unit_cost: 0,
        gl_account_code: '',
        gl_category: '',
        vat_type: '12% VAT',
        wht_type: 'None (X1)',
        gross_price: 0,
        net_price: 0,
        line_total: 0
    }]);
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        const item = newItems[index];
        const qty = parseFloat(item.quantity) || 0;
        const gross = parseFloat(item.estimated_unit_cost) || 0;

        // Logical syncing for CRIS fields
        item.gross_price = parseFloat(gross.toFixed(2));

        // VAT & WHT Multipliers
        const vatRate = item.vat_type === '12% VAT' ? 0.12 : 0;
        const whtRate = item.wht_type === '1% WHT' ? 0.01 : (item.wht_type === '2% WHT' ? 0.02 : 0);

        // Calculate Net Price: Unit Cost * (1 + VAT - WHT)
        // Match backend rounding
        item.net_price = parseFloat((item.gross_price * (1 + vatRate - whtRate)).toFixed(2));
        item.line_total = parseFloat((qty * item.net_price).toFixed(2));


        setItems(newItems);
    };


    const calculateTotal = () => items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);

    const validateStep = (currentStep) => {
        if (currentStep === 1) {
            if (!form.title || !form.department_id || !form.cost_center || !form.date_needed || !form.particulars) {
                toast.error('Please fill in all required fields.');
                return false;
            }
        }
        if (currentStep === 2) {
            if (items.length === 0) {
                toast.error('At least one line item is required.');
                return false;
            }
            if (items.some(i => !i.description || !i.quantity || !i.estimated_unit_cost)) {
                toast.error('Please complete all line item details.');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateStep(2)) return;
        mutation.mutate({
            ...form,
            items,
            estimated_total: calculateTotal()
        });
    };

    if (isEdit && isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading requisition details...</div>;

    return (
        <div className="form-view animate-fade-in">
            <div className="form-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>{isEdit ? 'Edit Requisition' : 'Create New Requisition'}</h1>
                    <p className="desktop-only" style={{ color: 'var(--text-muted)' }}>Fill in the details for your procurement request.</p>
                </div>
                <button
                    type="button"
                    className="btn btn-outline desktop-only"
                    style={{ marginLeft: 'auto', gap: 8, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onClick={() => setShowWiki(!showWiki)}
                >
                    <BookOpen size={18} />
                    {showWiki ? 'Close Guide' : 'Open User Manual'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    {/* Progress Bar */}
                    <div className="stepper-container" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '3rem',
                        position: 'relative',
                        padding: '0 1rem'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            left: '2rem',
                            right: '2rem',
                            height: '2px',
                            background: 'var(--border)',
                            zIndex: 0
                        }}>
                            <div style={{
                                width: `${((step - 1) / (steps.length - 1)) * 100}%`,
                                height: '100%',
                                background: 'var(--primary)',
                                transition: 'all 0.3s ease'
                            }} />
                        </div>
                        {steps.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => step > s.id && setStep(s.id)}
                                style={{
                                    zIndex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: step > s.id ? 'pointer' : 'default'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: step >= s.id ? 'var(--primary)' : 'var(--bg-main)',
                                    border: `2px solid ${step >= s.id ? 'var(--primary)' : 'var(--border)'}`,
                                    color: step >= s.id ? 'white' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                    boxShadow: step === s.id ? '0 0 0 4px var(--primary-light)' : 'none'
                                }}>
                                    {step > s.id ? <CheckCircle size={20} /> : <s.icon size={20} />}
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: step >= s.id ? 'var(--text-dark)' : 'var(--text-muted)'
                                }}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="animate-slide-in">
                                {/* STEP 1: SELECT REQUEST TYPE */}
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STEP 1: SELECT REQUEST TYPE</label>
                                    </div>
                                    <div className="request-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                                        {[
                                            { id: 'po_item', label: 'PO ITEMS', icon: '📦', color: '#6366f1' },
                                            { id: 'non_po_item', label: 'NON-PO ITEMS', icon: '🏢', color: '#10b981' },
                                            { id: 'cash_advance', label: 'CASH ADVANCE', icon: '💵', color: '#f59e0b' },
                                            { id: 'liquidation', label: 'LIQUIDATION', icon: '📝', color: '#ef4444' }
                                        ].map(t => (
                                            <div
                                                key={t.id}
                                                className="request-type-card"
                                                onClick={() => setForm({ ...form, request_type: t.id })}
                                                style={{
                                                    padding: '1.25rem',
                                                    borderRadius: '16px',
                                                    border: form.request_type === t.id ? `2px solid ${t.color}` : '1px solid var(--border)',
                                                    background: form.request_type === t.id ? `${t.color}08` : 'var(--bg-card)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <div style={{ fontSize: '1.5rem' }}>{t.icon}</div>
                                                <div style={{ fontWeight: 800, fontSize: '0.75rem' }}>{t.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-card form-section" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', opacity: 0.7 }}>PRIMARY DETAILS</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>Title / Purpose <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <input
                                                type="text"
                                                value={form.title}
                                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Department <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <select
                                                value={form.department_id}
                                                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Dept</option>
                                                {depts?.filter(d => d.type === 'department').map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Project Scope</label>
                                            <select
                                                value={form.project_id}
                                                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                                            >
                                                <option value="">None (General Admin)</option>
                                                {depts?.filter(d => d.type === 'project').map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Cost Center <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <input
                                                type="text"
                                                value={form.cost_center}
                                                onChange={(e) => setForm({ ...form, cost_center: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Date Needed <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <input
                                                type="date"
                                                value={form.date_needed}
                                                onChange={(e) => setForm({ ...form, date_needed: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Priority Level</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    type="button"
                                                    className={`btn ${form.priority === 'normal' ? 'btn-primary' : 'btn-outline'}`}
                                                    onClick={() => setForm({ ...form, priority: 'normal' })}
                                                    style={{ flex: 1, fontSize: '0.75rem' }}
                                                >Normal</button>
                                                <button
                                                    type="button"
                                                    className={`btn ${form.priority === 'urgent' ? 'btn-primary' : 'btn-outline'}`}
                                                    onClick={() => setForm({ ...form, priority: 'urgent' })}
                                                    style={{ flex: 1, fontSize: '0.75rem', borderColor: form.priority === 'urgent' ? 'var(--danger)' : '' }}
                                                >Urgent</button>
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>Particulars <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <textarea
                                                rows="3"
                                                value={form.particulars}
                                                onChange={(e) => setForm({ ...form, particulars: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-slide-in">
                                <div className="glass-card" style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', letterSpacing: '0.05em', fontWeight: 800 }}>BILL OF QUANTITIES (BOQ)</h3>
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Itemize the goods or services requested below.</p>
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
                                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                            style={{ fontSize: '1rem' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                                                        <div className="boq-field-group">
                                                            <label className="boq-field-label">GL Account</label>
                                                            <input
                                                                placeholder="e.g. 50203010"
                                                                value={item.gl_account_code}
                                                                onChange={(e) => updateItem(index, 'gl_account_code', e.target.value)}
                                                                style={{ fontSize: '0.75rem' }}
                                                            />
                                                        </div>
                                                        <div className="boq-field-group">
                                                            <label className="boq-field-label">Category</label>
                                                            <input
                                                                placeholder="e.g. Office Supplies"
                                                                value={item.gl_category}
                                                                onChange={(e) => updateItem(index, 'gl_category', e.target.value)}
                                                                style={{ fontSize: '0.75rem' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="boq-field-group" style={{ justifyContent: 'center' }}>
                                                    <input
                                                        placeholder="pcs"
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                        style={{ textAlign: 'center' }}
                                                    />
                                                </div>
                                                <div className="boq-field-group" style={{ justifyContent: 'center' }}>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                        style={{ textAlign: 'center' }}
                                                    />
                                                </div>
                                                <div className="boq-field-group" style={{ justifyContent: 'center' }}>
                                                    <input
                                                        type="number"
                                                        value={item.estimated_unit_cost}
                                                        onChange={(e) => updateItem(index, 'estimated_unit_cost', e.target.value)}
                                                        style={{ textAlign: 'right' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>
                                                    PHP {item.line_total?.toLocaleString()}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <button type="button" onClick={() => removeItem(index)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.6'}>
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="boq-total-section">
                                        <div className="boq-total-label">ESTIMATED TOTAL:</div>
                                        <div className="boq-total-amount">PHP {calculateTotal().toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-slide-in">
                                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <Plus size={40} />
                                    </div>
                                    <h2>Attachments</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                        {isEdit
                                            ? 'Manage files associated with this requisition.'
                                            : 'You can upload supporting documents (signed PR, Specs, etc.) after saving this draft.'}
                                    </p>
                                    {!isEdit && (
                                        <div style={{ padding: '1.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '0.875rem' }}>
                                            Note: The system requires a record ID to link files. Please proceed to review.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-slide-in">
                                <div className="glass-card" style={{ padding: '2rem' }}>
                                    <h3 style={{ marginBottom: '1.5rem' }}>Review Details</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>TITLE</div>
                                            <div style={{ fontWeight: 700 }}>{form.title}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>TYPE</div>
                                            <div style={{ fontWeight: 700 }}>{form.request_type?.toUpperCase()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>TOTAL AMOUNT</div>
                                            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem' }}>₱{calculateTotal().toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>ITEMS</div>
                                            <div style={{ fontWeight: 700 }}>{items.length} line items</div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                        <strong>Ready to Submit?</strong> Once created, this will be saved as a Draft and you can then submit it for approval.
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
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                                style={{ minWidth: '120px' }}
                            >
                                <ArrowLeft size={18} /> {step === 1 ? 'Cancel' : 'Back'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={(e) => {
                                    if (step < 4) {
                                        if (validateStep(step)) {
                                            setStep(step + 1);
                                        }
                                    } else {
                                        handleSubmit(e);
                                    }
                                }}
                                style={{ minWidth: '160px' }}
                                disabled={mutation.isPending}
                            >
                                {step === 4 ? (mutation.isPending ? 'Saving...' : 'Create Requisition') : 'Continue'}
                                {step < 4 && <Plus size={18} style={{ marginLeft: 8 }} />}
                            </button>
                        </div>
                    </form>
                </div>
                {/* INTERACTIVE WIKI SIDEBAR */}
                {showWiki && (
                    <aside className="wiki-sidebar animate-fade-in" style={{ width: '350px', position: 'sticky', top: '2rem', height: 'calc(100vh - 12rem)', overflowY: 'auto' }}>
                        <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ padding: '1.5rem', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <HelpCircle size={20} />
                                    <h3 style={{ fontSize: '1rem', color: 'white', margin: 0 }}>Maker Guide (Wiki)</h3>
                                </div>
                                <X size={20} onClick={() => setShowWiki(false)} style={{ cursor: 'pointer' }} />
                            </div>

                            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                                    {['intro', 'types', 'financials', 'ledger', 'workflow'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setWikiSection(s)}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                whiteSpace: 'nowrap',
                                                background: wikiSection === s ? 'var(--primary)' : '#f1f5f9',
                                                color: wikiSection === s ? 'white' : 'var(--text-muted)',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {s.toUpperCase()}
                                        </button>
                                    ))}
                                </div>

                                {wikiSection === 'intro' && (
                                    <div className="wiki-content">
                                        <h4 style={{ marginBottom: '1rem' }}>Welcome, Maker!</h4>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                            As a <strong>Maker</strong> (Requester), your role is to initiate the procurement workflow.
                                            This interface is aligned with the <strong>CRIS Standard</strong> to ensure that
                                            all financial data is captured correctly from the start.
                                        </p>
                                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 8, borderLeft: '2px solid var(--warning)' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px' }}>PRO-TIP</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Always save as DRAFT if you are waiting for specific quote values to avoid re-submitting.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {wikiSection === 'types' && (
                                    <div className="wiki-content">
                                        <h4 style={{ marginBottom: '1rem' }}>Understanding Request Types</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)' }}>📦 PO Items</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>For regular goods/services that require a formal Purchase Order generated by the system.</div>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)' }}>🏢 Non-PO Items</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct payments or utility billings where no PO is required.</div>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)' }}>💵 Cash Advance</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Advance funds for authorized project expenses (Petty Cash replacement).</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {wikiSection === 'financials' && (
                                    <div className="wiki-content">
                                        <h4 style={{ marginBottom: '1rem' }}>Financial Metadata</h4>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            Critical fields required by Accounting (CRIS standard):
                                        </p>
                                        <ul style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '1rem' }}>
                                            <li style={{ marginBottom: '10px' }}><strong>Cost Center:</strong> The specific budget code where these funds will be deducted.</li>
                                            <li style={{ marginBottom: '10px' }}><strong>PO Number:</strong> For 'PO Items', link this to an existing commitment if available.</li>
                                            <li style={{ marginBottom: '10px' }}><strong>Particulars:</strong> Describe the "WHO, WHAT, WHERE, WHY" clearly.</li>
                                        </ul>
                                    </div>
                                )}

                                {wikiSection === 'ledger' && (
                                    <div className="wiki-content">
                                        <h4 style={{ marginBottom: '1rem' }}>Bill of Quantities (BOQ)</h4>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            Each line item must be categorized for the <strong>SAP Upload</strong> phase:
                                        </p>
                                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ fontSize: '0.75rem' }}>
                                                <strong>GL Code:</strong> General Ledger numeric code (e.g. 5001-24).
                                            </div>
                                            <div style={{ fontSize: '0.75rem' }}>
                                                <strong>VAT/WHT:</strong> Critical for net payment calculation. Default is 12% VAT.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {wikiSection === 'workflow' && (
                                    <div className="wiki-content">
                                        <h4 style={{ marginBottom: '1rem' }}>Step-by-Step Approval</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                                                <div style={{ position: 'absolute', left: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>1</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Dept Head Approval</div>
                                            </div>

                                            <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid #e2e8f0', marginLeft: '11px', paddingBottom: '10px' }}>
                                                <div style={{ position: 'absolute', left: '-12px', width: 24, height: 24, borderRadius: '50%', background: '#f43f5e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, border: '2px solid white' }}>$</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--accent)' }}>&gt; PHP 1.0M Barrier</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>If total exceeds 1M, a President Approval step is automatically injected.</div>
                                            </div>

                                            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                                                <div style={{ position: 'absolute', left: 0, width: 24, height: 24, borderRadius: '50%', background: '#64748b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>2</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Accounting Triple-Gate</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Staff (Check) → Supervisor (Review) → Manager (Endorse).</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ width: '100%', fontSize: '0.75rem' }}
                                    onClick={() => {
                                        const nextMap = { intro: 'types', types: 'financials', financials: 'ledger', ledger: 'workflow', workflow: 'intro' };
                                        setWikiSection(nextMap[wikiSection]);
                                    }}
                                >
                                    Next Topic <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div >
    );
};

export default RequisitionFormPage;
