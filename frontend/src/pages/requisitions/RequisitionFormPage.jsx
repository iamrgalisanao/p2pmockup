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
    X
} from 'lucide-react';

const RequisitionFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = !!id;

    const [showWiki, setShowWiki] = useState(false);
    const [wikiSection, setWikiSection] = useState('intro');

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
            net_price: 0
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (items.some(i => !i.description)) {
            toast.error('Please fill in all item descriptions.');
            return;
        }
        mutation.mutate({
            ...form,
            items,
            estimated_total: calculateTotal()
        });
    };

    if (isEdit && isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading requisition details...</div>;

    return (
        <div className="form-view animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>{isEdit ? 'Edit Requisition' : 'Create New Requisition'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Fill in the details for your procurement request.</p>
                </div>
                <button
                    type="button"
                    className="btn btn-outline"
                    style={{ marginLeft: 'auto', gap: 8, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onClick={() => setShowWiki(!showWiki)}
                >
                    <BookOpen size={18} />
                    {showWiki ? 'Close Guide' : 'Open User Manual'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                <form onSubmit={handleSubmit} style={{ flex: 1 }}>
                    {/* STEP 1: SELECT REQUEST TYPE - Refined for better space utility */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STEP 1: SELECT REQUEST TYPE</label>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Alignment: CRIS Guide v2.4</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                            {[
                                { id: 'po_item', label: 'PO ITEMS', icon: '📦', color: '#6366f1' },
                                { id: 'non_po_item', label: 'NON-PO ITEMS', icon: '🏢', color: '#10b981' },
                                { id: 'cash_advance', label: 'CASH ADVANCE', icon: '💵', color: '#f59e0b' },
                                { id: 'liquidation', label: 'LIQUIDATION', icon: '📝', color: '#ef4444' }
                            ].map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setForm({ ...form, request_type: t.id })}
                                    style={{
                                        position: 'relative',
                                        padding: '1.25rem',
                                        borderRadius: '16px',
                                        border: form.request_type === t.id ? `2px solid ${t.color}` : '1px solid var(--border)',
                                        background: form.request_type === t.id ? `${t.color}08` : 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        boxShadow: form.request_type === t.id ? `0 10px 20px -5px ${t.color}20` : 'none',
                                        transform: form.request_type === t.id ? 'translateY(-2px)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: form.request_type === t.id ? t.color : '#f1f5f9',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.25rem',
                                        transition: 'all 0.3s'
                                    }}>
                                        {t.icon}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 800, fontSize: '0.75rem',
                                            color: form.request_type === t.id ? t.color : 'var(--text-dark)',
                                            letterSpacing: '0.02em'
                                        }}>{t.label}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Standard Protocol</div>
                                    </div>
                                    {form.request_type === t.id && (
                                        <div style={{ position: 'absolute', top: 10, right: 10 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                        <div className="form-main">
                            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', opacity: 0.7 }}>PRIMARY DETAILS</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                            Requisition Title / Purpose <span style={{ color: 'var(--accent)' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Purchase of IT Equipment"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {form.request_type === 'po_item' && (
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>PO Number</label>
                                            <input
                                                type="text"
                                                placeholder="Enter related PO..."
                                                value={form.po_number}
                                                onChange={(e) => setForm({ ...form, po_number: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="form-group" style={{ gridColumn: form.request_type === 'po_item' ? 'auto' : 'span 2' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                            Cost Center <span style={{ color: 'var(--accent)' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. CC-ADMIN-01"
                                            value={form.cost_center}
                                            onChange={(e) => setForm({ ...form, cost_center: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                            Particulars / Background <span style={{ color: 'var(--accent)' }}>*</span>
                                        </label>
                                        <textarea
                                            rows="3"
                                            placeholder="Additional particulars..."
                                            value={form.particulars}
                                            onChange={(e) => setForm({ ...form, particulars: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* STEP 3: BILL OF QUANTITIES (Ledger Style) */}
                            <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>BILL OF QUANTITIES (BOQ)</h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inventory ledger for this requisition. All fields required for SAP.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ padding: '8px 16px', fontSize: '0.8125rem', borderRadius: '10px' }}
                                        onClick={addItem}
                                    >
                                        <Plus size={16} /> Add New Line
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="ledger-row"
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'minmax(200px, 2fr) 100px 100px 150px 160px 140px 40px',
                                                gap: '12px',
                                                alignItems: 'start',
                                                padding: '1.25rem',
                                                background: '#ffffff',
                                                borderRadius: '14px',
                                                border: '1px solid var(--border)',
                                                transition: 'box-shadow 0.2s',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                                    Item Description <span style={{ color: 'var(--accent)' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Specify item or service..."
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    required
                                                    style={{ border: '1px solid transparent', background: '#f8fafc', fontWeight: 600, padding: '10px 12px' }}
                                                />
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                        <input
                                                            type="text"
                                                            placeholder="GL Code"
                                                            value={item.gl_account_code}
                                                            onChange={(e) => updateItem(index, 'gl_account_code', e.target.value)}
                                                            style={{ border: 'none', background: '#f1f5f9', fontSize: '0.7rem', padding: '6px 6px 6px 26px', borderRadius: '6px' }}
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Category"
                                                        value={item.gl_category}
                                                        onChange={(e) => updateItem(index, 'gl_category', e.target.value)}
                                                        style={{ border: 'none', background: '#f1f5f9', fontSize: '0.7rem', padding: '6px 8px', borderRadius: '6px' }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Unit</label>
                                                <input
                                                    type="text"
                                                    placeholder="pcs"
                                                    value={item.unit}
                                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                    style={{ background: '#f8fafc', textAlign: 'center', padding: '10px 4px' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Qty</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    style={{ background: '#f8fafc', textAlign: 'center', padding: '10px 4px' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Unit Cost</label>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>₱</span>
                                                    <input
                                                        type="number"
                                                        value={item.estimated_unit_cost}
                                                        onChange={(e) => updateItem(index, 'estimated_unit_cost', parseFloat(e.target.value) || 0)}
                                                        style={{ background: '#f8fafc', padding: '10px 10px 10px 24px', fontWeight: 700 }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Tax Config</label>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <select
                                                        value={item.vat_type}
                                                        onChange={(e) => updateItem(index, 'vat_type', e.target.value)}
                                                        style={{ padding: '6px 8px', fontSize: '0.7rem', background: '#eef2ff', borderColor: 'transparent', fontWeight: 600, color: 'var(--primary)' }}
                                                    >
                                                        <option>12% VAT</option>
                                                        <option>0% Rated</option>
                                                        <option>Exempt</option>
                                                    </select>
                                                    <select
                                                        value={item.wht_type}
                                                        onChange={(e) => updateItem(index, 'wht_type', e.target.value)}
                                                        style={{ padding: '6px 8px', fontSize: '0.7rem', background: '#f1f5f9', borderColor: 'transparent' }}
                                                    >
                                                        <option>None (X1)</option>
                                                        <option>1% WHT</option>
                                                        <option>2% WHT</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Line Total</label>
                                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', paddingTop: '8px' }}>
                                                    ₱ {(item.line_total || 0).toLocaleString()}
                                                </div>
                                            </div>

                                            <div style={{ paddingTop: '32px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        border: 'none', cursor: 'pointer', color: 'var(--danger)',
                                                        background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    marginTop: '2.5rem',
                                    padding: '1.5rem',
                                    background: 'var(--sidebar-bg)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    color: 'white',
                                    boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.3)'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 700, letterSpacing: '0.1em' }}>GRAND ESTIMATED TOTAL</div>
                                        <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>Total across {items.length} unique line items</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '1.25rem', opacity: 0.6, marginRight: '0.5rem' }}>PHP</span>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#cbd5e1' }}>{calculateTotal().toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', textAlign: 'right', fontSize: '1.25rem', fontWeight: 800 }}>
                                ESTIMATED TOTAL: <span style={{ color: 'var(--primary)', marginLeft: '1rem' }}>PHP {calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <aside className="form-sidebar">
                        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', opacity: 0.7 }}>SETTINGS</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                                        Department <span style={{ color: 'var(--accent)' }}>*</span>
                                    </label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>Project Scope</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                                        Date Needed <span style={{ color: 'var(--accent)' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={form.date_needed}
                                        onChange={(e) => setForm({ ...form, date_needed: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>Priority Level</label>
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
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '1rem', background: '#f8fafc', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: 10, fontSize: '0.8125rem' }}>
                                <Info size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                                <p>Ensure all items include specific specifications to help procurement find the best quotes.</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', height: '52px', fontSize: '1rem' }}
                            disabled={mutation.isPending}
                        >
                            <Save size={20} />
                            {mutation.isPending ? 'Processing...' : (isEdit ? 'Save Changes' : 'Create & Proceed')}
                        </button>
                    </aside>
                </form>

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
        </div>
    );
};

export default RequisitionFormPage;
