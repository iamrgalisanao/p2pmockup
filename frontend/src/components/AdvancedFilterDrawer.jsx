import React, { useState } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';

const AdvancedFilterDrawer = ({ isOpen, onClose, onApply, filters, setFilters, config }) => {
    if (!isOpen) return null;

    const handleClear = () => {
        const cleared = {};
        Object.keys(filters).forEach(key => cleared[key] = '');
        setFilters(cleared);
    };

    return (
        <div className="drawer-overlay animate-fade-in" onClick={onClose} style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
        }}>
            <div className="drawer-content animate-slide-in-right" onClick={e => e.stopPropagation()} style={{
                width: '100%',
                maxWIdth: '400px',
                height: '100%',
                background: 'var(--bg-card)',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Filter size={20} className="text-primary" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Advanced Filters</h2>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {config.map((item) => (
                        <div key={item.key} className="filter-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</label>
                            {item.type === 'select' ? (
                                <select
                                    value={filters[item.key] || ''}
                                    onChange={(e) => setFilters({ ...filters, [item.key]: e.target.value })}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">All {item.label}s</option>
                                    {item.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={item.type || 'text'}
                                    value={filters[item.key] || ''}
                                    onChange={(e) => setFilters({ ...filters, [item.key]: e.target.value })}
                                    style={{ width: '100%' }}
                                    placeholder={item.placeholder}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleClear}>
                        <RotateCcw size={18} />
                        <span>Reset</span>
                    </button>
                    <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { onApply(); onClose(); }}>
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilterDrawer;
