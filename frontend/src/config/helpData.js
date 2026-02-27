export const helpData = {
    overview: {
        title: "PITX P2P Procurement Overview",
        icon: "BookOpen",
        content: `
# Welcome to PITX P2P Procurement
This system automates the end-to-end procurement lifecycle, ensuring financial compliance and transparency across all departments.

### Key Workflows:
1. **Requisition (PR)**: Initiating a request for goods or services.
2. **Receiving (GRN)**: Confirming delivery and receipt.
3. **Payment Request**: Invoicing and final payment processing.
        `
    },
    requisitions: {
        title: "Purchasing Requisitions (PR)",
        icon: "FileText",
        content: `
# Requisition Guide (PR)
Requisitions are the first step in the procurement process.

### Steps to Create a PR:
- **Details**: Provide a clear title, department, and cost center.
- **Line Items**: Itemize your request. Ensure you select the correct **GL Account** for SAP synchronization.
- **Priority**: Use 'Urgent' only for critical business needs.

### CRIS Financial Standards:
- All line items must have a **Description**, **Unit**, and **Price**.
- Total amounts exceeding **PHP 1.0M** require additional President approval.
        `
    },
    inbox: {
        title: "My Inbox & Approvals",
        icon: "Inbox",
        content: `
# Approval Inbox
Your inbox displays all items requiring your action.

### Action Types:
- **Approve**: Move the request to the next step.
- **Return**: Send back to the requester for corrections.
- **Reject**: Permanently cancel the request.

### SLA Tracking:
- Keep an eye on the **Priority** and **SLA Deadline**. Green badges mean you are within time; red means the request is overdue.
        `
    },
    receiving: {
        title: "Goods Received Note (GRN)",
        icon: "Package",
        content: `
# Receiving (GRN) Guide
Confirming receipt ensures that we only pay for what we actually receive.

### How to Receive:
1. Select the **Purchase Order (PO)** being delivered.
2. Review the **Ordered Quantity**.
3. Input the **Received Quantity** (supporting partial deliveries).
4. Add **Remarks** if there are damages or discrepancies.
        `
    },
    payments: {
        title: "Payment Requests (Invoicing)",
        icon: "CreditCard",
        content: `
# Payment Request Guide
This module handles the invoicing and final payout to vendors.

### Key Fields:
- **APV Number**: Accounting Voucher number for tracking.
- **CV/Check Number**: Tracking codes for the actual payout.
- **Tax Details**: Ensure the correct VAT (12%) and WHT (1%, 2%, etc.) are applied as per CRIS standards.
        `
    },
    vendors: {
        title: "Vendor Management",
        icon: "Truck",
        content: `
# Vendor Guide
Maintain a database of accredited suppliers and service providers.

### Management:
- Keep vendor contact details updated.
- Use the **Accreditation Status** to ensure we only procure from authorized partners.
        `
    }
};

export const getContextualSection = (pathname) => {
    if (pathname === '/') return 'overview';
    if (pathname.includes('/requisitions')) return 'requisitions';
    if (pathname.includes('/inbox')) return 'inbox';
    if (pathname.includes('/grns')) return 'receiving';
    if (pathname.includes('/payment-requests')) return 'payments';
    if (pathname.includes('/vendors')) return 'vendors';
    return 'overview';
};
