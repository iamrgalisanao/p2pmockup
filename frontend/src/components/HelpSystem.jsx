import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { helpData, getContextualSection } from '../config/helpData';
import {
    X,
    BookOpen,
    ChevronRight,
    Search,
    FileText,
    Inbox,
    Package,
    CreditCard,
    Truck,
    Info
} from 'lucide-react';

const iconMap = {
    BookOpen: BookOpen,
    FileText: FileText,
    Inbox: Inbox,
    Package: Package,
    CreditCard: CreditCard,
    Truck: Truck,
    Info: Info
};

const HelpSystem = ({ isOpen, onClose }) => {
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            const contextual = getContextualSection(location.pathname);
            setActiveSection(contextual);
        }
    }, [isOpen, location.pathname]);

    if (!isOpen) return null;

    const filteredSections = Object.entries(helpData).filter(([key, data]) =>
        data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeData = helpData[activeSection];
    const ActiveIcon = iconMap[activeData.icon] || Info;

    return (
        <div className="help-drawer-overlay animate-fade-in" onClick={onClose}>
            <div className="help-drawer animate-slide-in-right" onClick={e => e.stopPropagation()}>
                <div className="help-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="help-icon-wrapper">
                            <BookOpen size={20} color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>User Manual</h2>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="help-search">
                    <div style={{ position: 'relative' }}>
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search guide..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="help-container">
                    {/* Navigation Sidebar */}
                    <aside className="help-nav">
                        {Object.keys(helpData).map(key => {
                            const data = helpData[key];
                            const NavIcon = iconMap[data.icon] || Info;
                            return (
                                <button
                                    key={key}
                                    className={`help-nav-item ${activeSection === key ? 'active' : ''}`}
                                    onClick={() => setActiveSection(key)}
                                >
                                    <NavIcon size={18} />
                                    <span>{data.title.split('(')[0].trim()}</span>
                                    {activeSection === key && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                                </button>
                            );
                        })}
                    </aside>

                    {/* Content Area */}
                    <article className="help-content">
                        <div className="content-inner">
                            <div className="section-title">
                                <ActiveIcon size={24} color="var(--primary)" />
                                <h3>{activeData.title}</h3>
                            </div>

                            <div className="markdown-body">
                                {activeData.content.split('\n').map((line, idx) => {
                                    if (line.startsWith('# ')) return <h1 key={idx}>{line.substring(2)}</h1>;
                                    if (line.startsWith('### ')) return <h3 key={idx}>{line.substring(4)}</h3>;
                                    if (line.startsWith('- ')) return <li key={idx} style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>{line.substring(2)}</li>;
                                    if (line.trim() === '') return <br key={idx} />;
                                    return <p key={idx}>{line}</p>;
                                })}
                            </div>
                        </div>
                    </article>
                </div>

                <div className="help-footer">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Need more help? Contact IT Support at **help@pitx.com.ph**
                    </div>
                </div>
            </div>

            <style>{`
                .help-drawer-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    justify-content: flex-end;
                }
                .help-drawer {
                    width: 800px;
                    max-width: 90%;
                    height: 100%;
                    background: var(--bg-card);
                    display: flex;
                    flex-direction: column;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.1);
                }
                .help-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .help-icon-wrapper {
                    background: var(--primary);
                    padding: 8px;
                    border-radius: 8px;
                    display: flex;
                }
                .help-search {
                    padding: 1rem 1.5rem;
                    background: var(--bg-body);
                }
                .help-search input {
                    width: 100%;
                    padding: 10px 10px 10px 40px;
                    border-radius: 10px;
                    border: 1px solid var(--border);
                    background: var(--bg-card);
                }
                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                }
                .help-container {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }
                .help-nav {
                    width: 240px;
                    border-right: 1px solid var(--border);
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .help-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                .help-nav-item:hover {
                    background: var(--bg-body);
                    color: var(--primary);
                }
                .help-nav-item.active {
                    background: var(--primary-light);
                    color: var(--primary);
                }
                .help-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2rem;
                    background: var(--bg-card);
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid var(--primary-light);
                }
                .section-title h3 {
                    font-size: 1.5rem;
                    font-weight: 800;
                }
                .markdown-body h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 1rem; }
                .markdown-body h3 { font-size: 1.1rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--primary); }
                .markdown-body p { line-height: 1.6; color: var(--text-dark); margin-bottom: 1rem; }
                .help-footer {
                    padding: 1.5rem;
                    border-top: 1px solid var(--border);
                    background: var(--bg-body);
                }
            `}</style>
        </div>
    );
};

export default HelpSystem;
