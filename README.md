<div align="center">
  


  <h1>🚀 VendorBridge ERP</h1>
  <p><strong>Transforming Enterprise Procurement Through Smart AI Insights & Unified Supplier Workflows.</strong></p>
</div>

---
## 🚀Run the live demo website:
(https://vendorbridge-erp-567448632348.asia-southeast1.run.app/)   
## 🌟 The Vision

VendorBridge ERP solves one of the biggest bottlenecks in modern enterprise operations: fractured, opaque, and slow supplier procurement cycles.

We built VendorBridge to unify **Vendor Registrations, Requests for Quotations (RFQs), Multi-Level Bidding, Purchase Orders (POs), and Approvals** into a seamless, high-performance gateway augmented by **Generative AI Copilot Recommendations**. 

With advanced **Role-Based Access Control (RBAC)**, we ensure data privacy is strictly enforced, scaling from a single Vendor up to the highest corporate Administrative level.

---

## 📸 Glimpse Into the Platform

*(Note: Replace with actual image paths or links during deployment)*

### 🔐 Secure Multi-Profile Authentication 
> Distinct portals for Supply Vendors and Internal Corporate Roles.
![Login Portal Screenshot](#) 
<img width="562" height="966" alt="image" src="https://github.com/user-attachments/assets/44924982-8f05-4f6e-9d14-75a0e15ca7c5" />

### 📊 AI-Powered Admin Dashboard
> Real-time KPI metrics, Vendor Compliance Scores (D3.js), and AI Copilot cost-saving recommendations. Features intuitive **CSV Export capabilities**.
![Dashboard Analytics Screenshot](#)
> <img width="1919" height="968" alt="image" src="https://github.com/user-attachments/assets/e67f6c65-c36f-4c6d-979d-3f274bd7c785" />


### ✅ Strategic Workflow Approvals
> Cross-departmental authorization board for managers and unit heads to greenlight the best supply bids easily.
![Manager Authorization Board](#)
<img width="1906" height="968" alt="image" src="https://github.com/user-attachments/assets/88abe597-3143-4a81-a188-9e2820fa5351" />

### 💳 Restricted Payment Settlement
> Secure financial settlement views strictly restricted to Admins and Finance teams to avoid data leaks.
![Payments View Screenshot](#)
> <img width="1919" height="978" alt="image" src="https://github.com/user-attachments/assets/078483a7-0204-40d7-8b58-8375eae1ac19" />


---

## 🏆 Key Hackathon Features

1. **🤖 Copilot AI Procurement Recommendations**
   Detect budget anomalies, predict risks based on delivery delays, and generate cost-saving insights using predictive modeling—giving the procurement team a true intelligent copilot.

2. **🛡️ granular Role-Based Access Control (RBAC)**
   - **Admin:** God-mode over Settings, User Management, Activity Logs, and overriding configurations.
   - **Finance Manager:** Full visibility into Budget Utilizations, Spend Categories, and clearance of Purchase Orders.
   - **Manager / Unit Head:** Approval gates for accepting Quotations and checking department limits.
   - **Vendor Client Portal:** Strictly siloed view. Vendors **only** see their own paid/cleared Invoices and active Contracts, ensuring zero cross-contamination of competitor bids.

3. **📃 Robust Audit Trails & CSV Exports**
   Automated system tracking for every RFQ initiated, Bid received, and Contract renewed. Click **"Export CSV"** directly from the dashboard to port the compliance reports for external auditing.

4. **📈 Real-time D3.js Data Visualizations**
   Interactive and smooth SVG graphs rendering **Vendor Compliance Scores** and **Contract Expiration Windows**, moving away from boring standard tables.

---

## ⚙️ Quick Start Setup

### Prerequisites
- **Node.js** (v18 or higher recommended)

### 1. Installation
Clone the repository and install the initial dependencies:
```bash
git clone <repository_url>
cd vendorbridge-erp
npm install
```

### 2. Configure Environment
Copy the example environment variables file and fill in any necessary secrets.
```bash
cp .env.example .env
```

### 3. Ignition! (Development Mode)
Run the application with hot-reloading for both the Express backend and Vite frontend:
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🛠️ Technology Stack
- **Frontend Architecture:** React 18, Vite, Tailwind CSS (Utility-First styling), Framer Motion (Transitions)
- **Data Visualizations:** D3.js engine
- **Backend & State:** Node.js, Express, in-memory runtime JSON (scalable to GCP/Firestore)
- **Authentication:** Custom JWT-mocked secure role sessions with Bcrypt hashing algorithms

<div align="center">
  <p>Built with ❤️ and extreme caffeine for the Hackathon</p>
</div>
