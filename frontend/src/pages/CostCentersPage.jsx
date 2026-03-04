import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Layers,
    Briefcase,
    Building2,
    Save,
    X,
    Activity
} from 'lucide-react';
import departmentService from '../services/departmentService';
import { toast } from 'react-hot-toast';

const CostCentersPage = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'department',
        code: '',
        budget_limit: 0,
        parent_id: ''
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await departmentService.getAll();
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load cost centers');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (dept = null) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                type: dept.type,
                code: dept.code || '',
                budget_limit: dept.budget_limit || 0,
                parent_id: dept.parent_id || ''
            });
        } else {
            setEditingDept(null);
            setFormData({
                name: '',
                type: 'department',
                code: '',
                budget_limit: 0,
                parent_id: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await departmentService.update(editingDept.id, formData);
                toast.success('Cost center updated successfully');
            } else {
                await departmentService.create(formData);
                toast.success('New cost center created');
            }
            fetchDepartments();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving department:', error);
            toast.error(error.response?.data?.message || 'Failed to save');
        }
    };

    const filteredDepts = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && departments.length === 0) {
        return (
            <div className="view animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Activity className="animate-pulse" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900 }}>Cost Centers & Projects</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage organizational hierarchy, OPEX departments, and CAPEX projects.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> NEW COST CENTER
                </button>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '48px', borderRadius: '12px', background: 'var(--bg-main)' }}
                    />
                </div>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div className="table-container" style={{ border: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name & Code</th>
                                <th>Type</th>
                                <th>Parent Entity</th>
                                <th style={{ textAlign: 'right' }}>Budget Limit</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDepts.map(dept => (
                                <tr key={dept.id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{dept.name}</div>
                                        {dept.code && <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{dept.code}</div>}
                                    </td>
                                    <td>
                                        <span className={`badge ${dept.type === 'project' ? 'badge-for-review' : 'badge-draft'}`} style={{ borderRadius: '6px' }}>
                                            {dept.type === 'project' ? <Briefcase size={12} style={{ marginRight: '4px' }} /> : <Building2 size={12} style={{ marginRight: '4px' }} />}
                                            {dept.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        {dept.parent ? dept.parent.name : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Root Level</span>}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                        ₱{(parseFloat(dept.budget_limit) || 0).toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn-outline"
                                            style={{ padding: '6px', borderRadius: '8px', marginRight: '8px' }}
                                            onClick={() => handleOpenModal(dept)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="modal-overlay show">
                    <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', color: 'var(--text-muted)' }} className="btn-outline p-1 rounded-full">
                            <X size={20} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                            {editingDept ? 'Edit Cost Center' : 'New Cost Center'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                            Define organizational units and their financial constraints.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label className="budget-card-stat-label">Entity Name</label>
                                <input
                                    type="text"
                                    className="mt-1"
                                    placeholder="e.g. IT Department or SkyRise Project"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="budget-card-stat-label">Type</label>
                                    <select
                                        className="mt-1"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    >
                                        <option value="department">Department (OPEX)</option>
                                        <option value="project">Project (CAPEX)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="budget-card-stat-label">Entity Code</label>
                                    <input
                                        type="text"
                                        className="mt-1"
                                        placeholder="e.g. OPS-01"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="budget-card-stat-label">Budget Limit (₱)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="mt-1"
                                    placeholder="0.00"
                                    value={formData.budget_limit}
                                    onChange={(e) => setFormData({ ...formData, budget_limit: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="budget-card-stat-label">Parent Entity (Optional)</label>
                                <select
                                    className="mt-1"
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                >
                                    <option value="">None (Top Level)</option>
                                    {departments.filter(d => d.id !== editingDept?.id).map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', borderRadius: '12px', padding: '1rem' }}>
                                <Save size={18} /> {editingDept ? 'UPDATE ENTITY' : 'CREATE ENTITY'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostCentersPage;
