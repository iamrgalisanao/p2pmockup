import React from 'react';
import { SearchX, Box } from 'lucide-react';

const EmptyState = ({ title = "No records found", message = "Try adjusting your filters or search terms.", icon: Icon = Box }) => {
    return (
        <div className="glass-card" style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            border: '1px dashed var(--border)',
            background: 'rgba(255, 255, 255, 0.05)',
            marginTop: '1rem'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem'
            }}>
                <Icon size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: 0, fontSize: '0.875rem' }}>{message}</p>
        </div>
    );
};

export default EmptyState;
