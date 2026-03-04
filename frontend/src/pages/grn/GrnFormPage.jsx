import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { grnService } from '../../services/grnService';
import toast from 'react-hot-toast';
import {
    Save,
    ArrowLeft,
    Plus,
    Package,
    Calendar,
    User,
    FileText,
    CheckCircle
} from 'lucide-react';

const GrnFormPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedPo, setSelectedPo] = useState(null);
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({
        received_date: new Date().toISOString().split('T')[0],
        received_by: '',
        remarks: ''
    });

    // 1. Fetch Approved/Awarded POs that need receiving
    const { data: pos, isLoading: loadingPos } = useQuery({
        queryKey: ['purchase-orders-to-receive'],
        // We assume POs with status 'po_issued' are ready for GRN
        queryFn: () => api.get('/requisitions?status=po_issued').then(res => res.data),
    });

    const handleSelectPo = async (poId) => {
        try {
            const res = await api.get(`/requisitions/${poId}`);
            const poData = res.data.purchase_order;
            setSelectedPo(poData);
            // Pre-fill items from PO line items
            setItems(poData.line_items.map(item => ({
                po_line_item_id: item.id,
                description: item.description,
                unit: item.unit,
                ordered_qty: item.quantity,
                quantity_received: item.quantity, // Default to full receipt
                remarks: ''
            })));
        } catch (error) {
            toast.error("Failed to load PO details.");
        }
    };

    const mutation = useMutation({
        mutationFn: (payload) => grnService.create(payload),
        onSuccess: () => {
            toast.success('Goods Received Note created successfully!');
            queryClient.invalidateQueries({ queryKey: ['grns'] });
            navigate('/grns');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to create GRN');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedPo) return toast.error("Please select a Purchase Order.");

        mutation.mutate({
            purchase_order_id: selectedPo.id,
            ...form,
            line_items: items
        });
    };

    return (
        <div className="form-view animate-fade-in">
            <div className="form-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Create Goods Received Note</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Confirm receipt of goods or services from a Purchase Order.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Step 1: Select PO */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} color="var(--primary)" />
                            1. SELECT PURCHASE ORDER
                        </h3>

                        {loadingPos ? (
                            <p>Loading available POs...</p>
                        ) : (
                            <select
                                className="form-control"
                                style={{ width: '100%' }}
                                onChange={(e) => handleSelectPo(e.target.value)}
                                value={selectedPo?.requisition_id || ''}
                            >
                                <option value="">-- Choose an Issued PO --</option>
                                {pos?.data?.map(pr => (
                                    <option key={pr.id} value={pr.id}>
                                        {pr.purchase_order?.ref_number} - {pr.title} ({pr.purchase_order?.vendor?.name})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Step 2: Line Items */}
                    {selectedPo && (
                        <div className="glass-card animate-slide-in" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Package size={18} color="var(--primary)" />
                                2. CONFIRM QUANTITIES
                            </h3>

                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th style={{ textAlign: 'center' }}>Ordered</th>
                                            <th style={{ textAlign: 'center' }}>Received</th>
                                            <th>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit: {item.unit}</div>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.ordered_qty}</td>
                                                <td style={{ width: '120px' }}>
                                                    <input
                                                        type="number"
                                                        value={item.quantity_received}
                                                        onChange={(e) => {
                                                            const newItems = [...items];
                                                            newItems[idx].quantity_received = e.target.value;
                                                            setItems(newItems);
                                                        }}
                                                        style={{ textAlign: 'center' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        placeholder="Optional notes..."
                                                        value={item.remarks}
                                                        onChange={(e) => {
                                                            const newItems = [...items];
                                                            newItems[idx].remarks = e.target.value;
                                                            setItems(newItems);
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Details & Action */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>RECEIPT DETAILS</h3>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem' }}>Received Date</label>
                            <input
                                type="date"
                                value={form.received_date}
                                onChange={(e) => setForm({ ...form, received_date: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem' }}>Received By</label>
                            <input
                                placeholder="Name of recipient"
                                value={form.received_by}
                                onChange={(e) => setForm({ ...form, received_by: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.75rem' }}>Overall Remarks</label>
                            <textarea
                                rows="3"
                                placeholder="..."
                                value={form.remarks}
                                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', gap: '8px' }}
                            onClick={handleSubmit}
                            disabled={!selectedPo || mutation.isPending}
                        >
                            <CheckCircle size={18} />
                            {mutation.isPending ? 'Saving...' : 'Post Receipt'}
                        </button>
                    </div>

                    {selectedPo && (
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                            <h4 style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>LINKED PURCHASE ORDER</h4>
                            <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{selectedPo.ref_number}</div>
                            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{selectedPo.vendor?.name}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrnFormPage;
