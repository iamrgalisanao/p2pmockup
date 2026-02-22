import {
    Bell,
    Shield,
    Globe,
    Monitor,
    CreditCard
} from 'lucide-react';

const SettingsPage = () => {
    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>System Settings</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Configure your workspace and personal preferences.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', marginTop: '1rem' }}>
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                        { id: 'profile', label: 'Profile Settings', icon: Globe },
                        { id: 'notifications', label: 'Email Notifications', icon: Bell },
                        { id: 'security', label: 'Password & Security', icon: Shield },
                        { id: 'appearance', label: 'App Appearance', icon: Monitor },
                        { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
                    ].map(item => (
                        <button
                            key={item.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: 'none',
                                background: item.id === 'profile' ? '#f1f5f9' : 'transparent',
                                color: item.id === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: item.id === 'profile' ? 600 : 500,
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </aside>

                <div className="tab-content">
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Personal Information</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Full Name</label>
                                <input type="text" defaultValue="James Requester" />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Email Address</label>
                                <input type="email" defaultValue="james@p2p.com" disabled />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Department</label>
                                <input type="text" defaultValue="Operations & Logistics" disabled />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Phone Number</label>
                                <input type="text" placeholder="+63 900 000 0000" />
                            </div>
                        </div>

                        <div style={{ marginTop: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
