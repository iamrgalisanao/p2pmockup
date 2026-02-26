import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            setAuth(response.data.user, response.data.token);
            toast.success('Welcome back!');
            navigate('/');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--primary)', // Solid PITX Blue
            backgroundImage: 'radial-gradient(at 0% 0%, rgba(255,255,255,0.1) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(235,52,46,0.1) 0, transparent 50%)',
            padding: '1.5rem'
        }}>
            <div className="login-card glass-card" style={{
                width: '100%',
                maxWidth: '440px',
                padding: '3rem',
                borderRadius: '12px',
                background: 'white',
                animation: 'fadeIn 0.6s ease-out',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div className="login-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '2rem'
                    }}>
                        <div style={{
                            background: '#EB342E',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontWeight: 900,
                            fontSize: '1.5rem'
                        }}>PITX</div>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1D439B' }}>P2P Procurement</span>
                    </div>
                    <div style={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        color: 'white',
                        background: '#1D439B',
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: '4px',
                        marginBottom: '1rem'
                    }}>SECURE ACCESS</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enterprise Procure-to-Pay System</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email / Username</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                placeholder="alex.carter@pitx.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '44px', borderRadius: '4px', background: '#f8fafc' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Security Password</label>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '44px', borderRadius: '4px', background: '#f8fafc' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ background: '#EB342E', border: 'none', borderRadius: '4px', width: '100%', height: '48px', marginTop: '1rem', fontWeight: 800, letterSpacing: '0.05em' }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>SIGN IN</>}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <a href="#" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>Forgot Credentials?</a>
                    </div>
                </form>

                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    New to the platform? <span style={{ color: '#1D439B', fontWeight: 700 }}>Request Access</span>
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600 }}>
                <Lock size={14} /> PROTECTED BY PITX SECURITY PROTOCOLS
            </div>
        </div>
    );
};

export default LoginPage;
