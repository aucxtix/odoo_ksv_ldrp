#Run live here
https://vendorbridge-erp-567448632348.asia-southeast1.run.app/

# VendorBridge ERP

VendorBridge ERP is a complete Procurement & Vendor Management System designed to streamline vendor registration, request for quotations (RFQs), bidding, purchase order generation, and analytics.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Then navigate to `http://localhost:3000` in your browser!

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

## Project Setup

1. **Clone the repository** (if you haven't already):

   ```bash
   git clone https://github.com/aucxtix/Vendor-erp
   cd Vendor-erp
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:
   Copy the example environment variables file and fill in any necessary secrets (e.g., Gemini API key if using AI features).
   ```bash
   cp .env.example .env
   ```
   _Note: Open `.env` and configure your `GEMINI_API_KEY` or other variables as required by the application._

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

The application will start the Express backend which also serves the Vite frontend.

- Open your browser and navigate to: `http://localhost:3000`

_In development mode, changes to your files will automatically reflect in the application._

### Production Build

To build the application for production deployment:

1. **Build the project**:

   ```bash
   npm run build
   ```

   _This compiles the React frontend into static assets in the `dist` folder and transpiles the Express backend into `dist/server.cjs`._

2. **Start the production server**:
   ```bash
   npm start
   ```

The application will be served at `http://localhost:3000`.

## Troubleshooting

### Port 3000 Already in Use (EADDRINUSE)

If you see an error like `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000` when starting the server, it means another process (like an old session of the app) is still running in the background.

To fix this on Linux/macOS:

1. Find the process using the port:
   ```bash
   lsof -i :3000
   ```
2. Identify the `PID` (Process ID) from the output and kill it:
   ```bash
   kill -9 <PID>
   ```
3. Restart the server:
   ```bash
   npm run dev
   ```

## Features

- **Supplier Registry**: Manage vendors, track their risk levels, and rate their performance.
- **RFQ Management**: Create and track Requests for Quotation and seamlessly collaborate with vendors.
- **Quotations Bid Manager**: Compare comprehensive bids from multiple vendors to make calculated procurement decisions.
- **Approvals & Purchase Orders**: Flow integrated with procurement officers, financial managers, and unit heads for secure allocations.
- **Reports & Analytics**: High-level data visualization of spending, open orders, and supplier KPIs.

## Technology Stack

- **Frontend**: React, Tailwind CSS, Lucide React (Icons), Framer Motion (Animations)
- **Backend**: Node.js, Express
- **Build Tool**: Vite
- **Database**: In-memory JSON based fallback (for initial local setup) / Firestore capabilities (based on environment).
