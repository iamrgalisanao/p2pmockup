import { BarChart2, Download, FileText, TrendingUp } from 'lucide-react';

const ReportsPage = () => {
    const reports = [
        { title: 'Monthly Procurement Summary', description: 'Overview of all requisitions and payments by month.', icon: BarChart2 },
        { title: 'Vendor Performance', description: 'Analysis of vendor delivery times and cost variance.', icon: TrendingUp },
        { title: 'Tax & Compliance', description: 'VAT and WHT summaries for accounting transmittal.', icon: FileText },
        { title: 'SLA Breach Report', description: 'Detailed list of approval steps that exceeded cycle time.', icon: Clock }
    ];

    const handleDownload = (reportTitle) => {
        // Placeholder for report generation
        alert(`Generating ${reportTitle}... This feature is being implemented.`);
    };

    return (
        <div className="view animate-fade-in">
            <div className="header-top">
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Management Reports</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Generate and download procurement data for analysis.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                {reports.map((report, index) => (
                    <div key={index} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)',
                            color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <report.icon size={24} />
                        </div>
                        <h3 style={{ marginBottom: '0.75rem' }}>{report.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', flex: 1, marginBottom: '2rem' }}>{report.description}</p>

                        <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => handleDownload(report.title)}>
                            <Download size={18} />
                            <span>Download Report</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Simple Clock icon since lucide-react might not have it in the scope I used
const Clock = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

export default ReportsPage;
