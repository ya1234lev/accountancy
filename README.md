# 📊 Accountancy Management System

Full-stack bookkeeping application for managing business finances, expenses, and income with automated PDF processing.

## 🏗️ Project Structure

```
accountancy/
├── frontend/          # Angular 20.2 application
├── backend/           # Node.js/Express/MongoDB server
└── README.md
```

## ✨ Key Features

- **💰 Financial Management**: Income/expense tracking with tax calculations
- **📄 PDF Processing**: Automated invoice parsing and data extraction  
- **👥 Contact Management**: Clients and suppliers database
- **📊 Reports**: Excel export and financial analytics
- **🔔 Smart Notifications**: Real-time user feedback system

## 🖥️ Frontend (Angular 20.2)

Modern Angular app with standalone components and TypeScript.

**Main Pages:**
- Dashboard (`/`) - Financial overview
- Income (`/income`) - Receipt management  
- Expenses (`/expense`) - PDF upload and processing

**Technologies:** Angular 20.2, TypeScript, RxJS, CSS Grid

## 🖧 Backend (Node.js/Express)

REST API with MongoDB Atlas and automated file processing.

**Key APIs:**
```
/api/incomes     # Income CRUD
/api/expenses    # Expense CRUD + PDF upload
/api/customers   # Customer management
/api/suppliers   # Supplier management
```

**Technologies:** Node.js 22.x, Express 5.1, MongoDB Atlas, Multer

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account

### Installation & Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd accountancy

# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

2. **Create `.env` file in backend directory:**
```env
MONGODB_URI=your_mongodb_connection_string_here
PORT=3000
NODE_ENV=development
```

3. **Run the application:**
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend  
cd frontend && npm start
```

4. **Open browser:** `http://localhost:4200`

## � Project Structure

```
src/app/
├── components/           # UI components (expense, income, notifications)
├── services/            # Data services and state management
└── bookkeeping/         # Main application module

backend/src/
├── api/                 # Controllers and routes
├── models/              # Database schemas
└── config/              # Database configuration
```

## 🔧 Development

- **Hot reload** enabled for both frontend and backend
- **TypeScript** throughout the entire stack
- **RxJS** for reactive state management
- **Automatic file cleanup** for uploaded PDFs

---

**Built with Angular 20.2 + Node.js + MongoDB Atlas**
