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
3. **Payment Request (RFP)**: Invoicing and final payment processing.

### Global Search & Navigation:
Use the **Global Search** at the top of list views to find records by Reference Number, Title, Particulars, Requester, or Vendor. Use the **Filters** button to access Date Range and Status-specific filters.
        `
    },
    requisitions: {
        title: "Purchasing Requisitions (PR)",
        icon: "FileText",
        content: `
# Requisition Guide (PR / MRF / JRF)
Requisitions are the first step in the procurement process.

### Steps to Create a PR:
- **Details**: Provide a clear title, department, and cost center.
- **Particulars**: Use the **Particulars / Scope of Work** field to provide detailed technical specifications or project scopes.
- **Line Items**: Itemize your request. Ensure you select the correct **GL Account** for SAP synchronization.
- **Priority**: Use 'Urgent' only for critical business needs.

### 🧬 Hierarchical Approvals:
If you have an assigned supervisor, the system automatically injects a **Direct Supervisor Approval** as the first step in the workflow.

### ⟳ Reactivations:
Cancelled or rejected requisitions can be **Reactivated**. This creates a new linked version with updated series (e.g., -R1) while maintaining a link to the original audit trail.

### CRIS Financial Standards:
- Total amounts exceeding **PHP 1.0M** require additional President approval.
- All totals are system-calculated and cannot be manually overridden.
        `
    },
    inbox: {
        title: "My Inbox & Approvals",
        icon: "Inbox",
        content: `
# Approval Inbox
Your inbox displays all items requiring your action in a sequential chain.

### 📧 Actionable Emails:
Approvers receive email notifications with **Signed URL Buttons**. You can Approve or Reject requests directly from your email without logging into the portal.

### Action Types:
- **Approve**: Move the request to the next sequential step.
- **Return**: Send back to the requester for corrections.
- **Reject / Hold**: Permanently cancel or pause the request. **Comments are mandatory** for these actions.

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
1. **From Requisition View**: For approved and issued POs, click the **RECEIVE GOODS** button in the Requisition Detail view.
2. **Review Quantities**: Review the ordered quantity vs. what arrived.
3. **Partial Deliveries**: The system supports multiple GRNs per PO. Input the **Received Quantity** for this specific delivery.
4. **Auto-Completion**: Once all items are fully received, the system automatically marks the PO and Requisition as **Completed**.
        `
    },
    payments: {
        title: "Payment Requests (Invoicing)",
        icon: "CreditCard",
        content: `
# Payment Request Guide (RFP)
This module handles the invoicing and final payout to vendors after goods/services are received.

### Workflow:
1. **Creation**: Create an RFP directly from a completed Requisition/PO. Quantities and vendors are auto-mapped.
2. **Accounting Gate**: All RFPs must be **Validated by Accounting** before the approval chain begins.
3. **Approvals**: Follows the same sequential approval pattern as requisitions.

### Financial Details:
- **Tax Details**: Ensure the correct VAT (12%) and WHT are applied.
- **Disbursement**: Statuses transition to **Paid** once the Finance department completes the transaction.
        `
    },
    vendors: {
        title: "Vendor Management",
        icon: "Truck",
        content: `
# Vendor Guide
Maintain a database of accredited suppliers.

### Management:
- **Accreditation**: Only 'Active' vendors can be awarded quotes.
- **Audit Trace**: Awards that override the 'Lowest Responsive Bid' require mandatory justification text and auditor approval.
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
