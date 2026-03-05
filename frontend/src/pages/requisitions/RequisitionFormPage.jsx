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
        funding_source: '',
        checked_by_ids: [],
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

    // Dynamic Ref Number and Funding Source Logic
    useEffect(() => {
        const updateDynamicFields = async () => {
            if (!form.department_id) return;

            // 1. Auto-set Funding Source
            let funding = form.funding_source;
            if (form.request_type === 'MRF') funding = 'OPEX';
            else if (form.request_type === 'JRF') funding = 'CAPEX';

            // 2. Fetch Next Ref Number if it's MRF/JRF and not editing existing
            if (!isEdit && (form.request_type === 'MRF' || form.request_type === 'JRF')) {
                try {
                    const res = await api.get('/requisitions/next-ref', {
                        params: { type: form.request_type, department_id: form.department_id }
                    });

                    if (form.po_number !== res.data.ref_number || form.funding_source !== funding) {
                        setForm(prev => ({
                            ...prev,
                            funding_source: funding,
                            po_number: res.data.ref_number
                        }));
                    }
                } catch (err) {
                    console.error("Failed to fetch next ref:", err);
                }
            } else if (form.funding_source !== funding) {
                setForm(prev => ({ ...prev, funding_source: funding }));
            }
        };

        updateDynamicFields();
    }, [form.department_id, form.request_type, isEdit]);

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
                funding_source: existingPR.funding_source || '',
                checked_by_ids: existingPR.checked_by_ids || [],
                ref_number_preview: existingPR.ref_number // Add this to state if we want to show it
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
            if (!form.title || !form.department_id || !form.cost_center || !form.date_needed) {
                toast.error('Please fill in all required fields.');
                return false;
            }
            if ((form.request_type === 'MRF' || form.request_type === 'JRF')) {
                if (!form.funding_source) {
                    toast.error('Funding Source is required for MRF/JRF.');
                    return false;
                }
                if (form.checked_by_ids.length === 0) {
                    toast.error('Please select at least one Department Head for "Checked By".');
                    return false;
                }
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
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>{isEdit ? 'Edit Requisition' : 'Create New Requisition'}</h1>
                    <p className="desktop-only" style={{ color: 'var(--text-muted)' }}>Fill in the details for your procurement request.</p>
                </div>
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
                            <div className="animate-fade-in">
                                {/* STEP 1: SELECT REQUEST TYPE */}
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STEP 1: SELECT REQUEST TYPE</label>
                                    </div>
                                    <div className="request-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                                        {[
                                            { id: 'MRF', label: 'MRF (Material Requisition)', icon: '📦', color: '#1D439B', subtitle: 'Funding from OPEX' },
                                            { id: 'JRF', label: 'JRF (Job Requisition)', icon: '🛠️', color: '#10b981', subtitle: 'Funding from CAPEX' },
                                            { id: 'po_item', label: 'PO ITEMS', icon: '📦', color: '#1D439B' },
                                            { id: 'non_po_item', label: 'NON-PO ITEMS', icon: '🏢', color: '#10b981' },
                                            { id: 'cash_advance', label: 'CASH ADVANCE', icon: '💵', color: '#f59e0b' },
                                            { id: 'liquidation', label: 'LIQUIDATION', icon: '📝', color: '#ef4444' }
                                        ].map(t => (
                                            <div
                                                key={t.id}
                                                className="request-type-card"
                                                onClick={() => {
                                                    let funding = form.funding_source;
                                                    if (t.id === 'MRF') funding = 'OPEX';
                                                    if (t.id === 'JRF') funding = 'CAPEX';
                                                    setForm({ ...form, request_type: t.id, funding_source: funding });
                                                }}
                                                style={{
                                                    padding: '1.25rem',
                                                    borderRadius: '12px',
                                                    border: form.request_type === t.id ? `2px solid ${t.color}` : '1px solid var(--border)',
                                                    background: form.request_type === t.id ? `${t.color}08` : 'var(--bg-card)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ fontSize: '1.5rem' }}>{t.icon}</div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>{t.label}</div>
                                                </div>
                                                {t.subtitle && <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{t.subtitle}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-card form-section" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', opacity: 0.7 }}>PRIMARY DETAILS</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                        {/* Row 1: Department (TL) and Title (TR) */}
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
                                            <label>Title / Purpose <span style={{ color: 'var(--accent)' }}>*</span></label>
                                            <input
                                                type="text"
                                                value={form.title}
                                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                                required
                                            />
                                        </div>

                                        {/* Row 2: MRF/JRF Number and Funding Source (for MRF/JRF) or Date Needed and Cost Center (for PR) */}
                                        {(form.request_type === 'MRF' || form.request_type === 'JRF') ? (
                                            <>
                                                <div className="form-group">
                                                    <label>{form.request_type} Number (Auto-Generated)</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={isEdit ? existingPR.ref_number : (form.po_number || 'Selecting dept...')}
                                                            style={{ fontWeight: 700, background: 'var(--bg-main)', color: 'var(--primary)' }}
                                                        />
                                                        {!isEdit && !form.po_number && form.department_id && (
                                                            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                                <div className="spinner-small" style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Funding Source</label>
                                                    <div style={{
                                                        padding: '0.75rem 1rem',
                                                        background: 'var(--bg-main)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius-sharp)',
                                                        fontWeight: 700,
                                                        color: 'var(--primary)',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {form.request_type === 'MRF' ? 'OPEX (Revenue)' : 'CAPEX (Capital)'}
                                                    </div>
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
                                            </>
                                        ) : (
                                            <>
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
                                            </>
                                        )}

                                        {(form.request_type === 'MRF' || form.request_type === 'JRF') && (
                                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                <label>Checked By (Department Heads) <span style={{ color: 'var(--accent)' }}>*</span></label>
                                                <div className="doc-selection-grid" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                                                    {depts?.find(d => d.id === form.department_id)?.users?.filter(u => u.role === 'dept_head').map(user => (
                                                        <label key={user.id} className="doc-selection-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={form.checked_by_ids.includes(user.id)}
                                                                onChange={(e) => {
                                                                    const ids = e.target.checked
                                                                        ? [...form.checked_by_ids, user.id]
                                                                        : form.checked_by_ids.filter(id => id !== user.id);
                                                                    setForm({ ...form, checked_by_ids: ids });
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>{user.name}</span>
                                                        </label>
                                                    ))}
                                                    {(!form.department_id) && <p style={{ gridColumn: 'span 2', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Please select a department first.</p>}
                                                    {form.department_id && depts?.find(d => d.id === form.department_id)?.users?.filter(u => u.role === 'dept_head').length === 0 && (
                                                        <p style={{ gridColumn: 'span 2', fontSize: '0.8125rem', color: 'var(--danger)', textAlign: 'center', padding: '1rem' }}>No Department Heads found.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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
                                                    ₱{item.line_total?.toLocaleString()}
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
                                        <div className="boq-total-amount">₱{calculateTotal().toLocaleString()}</div>
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
                            <div className="animate-fade-in">
                                <div className="glass-card" style={{ padding: '2rem' }}>
                                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 800, letterSpacing: '0.05em' }}>REVIEW YOUR REQUEST</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '2.5rem' }}>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.25rem' }}>TITLE / PURPOSE</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{form.title}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.25rem' }}>REQUEST TYPE</div>
                                            <div style={{ fontWeight: 700 }}>{form.request_type?.toUpperCase()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.25rem' }}>DEPARTMENT</div>
                                            <div style={{ fontWeight: 700 }}>{depts?.find(d => d.id === form.department_id)?.name || 'N/A'}</div>
                                        </div>

                                        {(form.request_type === 'MRF' || form.request_type === 'JRF') && (
                                            <>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.25rem' }}>FUNDING SOURCE</div>
                                                    <div style={{ fontWeight: 700 }}>{form.funding_source}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.25rem' }}>COST CENTER</div>
                                                    <div style={{ fontWeight: 700 }}>{form.cost_center}</div>
                                                </div>
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.5rem' }}>CHECKED BY (DEPT HEADS)</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {form.checked_by_ids.map(id => {
                                                            const user = depts?.flatMap(d => d.users || []).find(u => u.id === id);
                                                            return (
                                                                <div key={id} style={{ background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid var(--border)' }}>
                                                                    {user?.name || 'Unknown'}
                                                                </div>
                                                            );
                                                        })}
                                                        {form.checked_by_ids.length === 0 && <span style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>No Approvers Selected</span>}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.25rem' }}>DATE NEEDED</div>
                                            <div style={{ fontWeight: 700 }}>{form.date_needed || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.25rem' }}>ESTIMATED TOTAL</div>
                                            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem' }}>₱{calculateTotal().toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>ITEMS LIST</div>
                                        <div className="boq-header" style={{
                                            display: 'grid',
                                            gridTemplateColumns: '2fr 80px 80px 120px 150px',
                                            gap: '12px',
                                            borderBottom: '1px solid var(--border)',
                                            paddingBottom: '0.5rem',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div style={{ fontSize: '0.65rem' }}>Description</div>
                                            <div style={{ textAlign: 'center', fontSize: '0.65rem' }}>Unit</div>
                                            <div style={{ textAlign: 'center', fontSize: '0.65rem' }}>Qty</div>
                                            <div style={{ textAlign: 'right', fontSize: '0.65rem' }}>Price</div>
                                            <div style={{ textAlign: 'right', fontSize: '0.65rem' }}>Total</div>
                                        </div>
                                        {items.map((item, index) => (
                                            <div key={index} style={{
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 80px 80px 120px 150px',
                                                gap: '12px',
                                                padding: '0.75rem 0',
                                                borderBottom: '1px solid var(--border)',
                                                fontSize: '0.875rem'
                                            }}>
                                                <div>{item.description}</div>
                                                <div style={{ textAlign: 'center' }}>{item.unit}</div>
                                                <div style={{ textAlign: 'center' }}>{item.quantity}</div>
                                                <div style={{ textAlign: 'right' }}>₱{parseFloat(item.estimated_unit_cost || 0).toLocaleString()}</div>
                                                <div style={{ textAlign: 'right', fontWeight: 700 }}>₱{item.line_total?.toLocaleString()}</div>
                                            </div>
                                        ))}
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
            </div>
        </div>
    );
};

export default RequisitionFormPage;
