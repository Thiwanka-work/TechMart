# ?? TechMart - Premium Full-Stack E-Commerce Platform

TechMart is a responsive, feature-rich full-stack e-commerce web application designed for selling high-end tech gadgets, developer gear, and smart office accessories.

It features a robust C# ASP.NET Core API backend, a premium React (Vite) frontend styled with Tailwind CSS, and a comprehensive Admin Console for complete store management.

---

## ?? Key Features

### ?? Storefront & Shopping Experience
- **Interactive Product Catalog**: Search, filter by category division, and view detailed gadget specifications.
- **Hybrid Cart System**:
  - **Registered Users**: Database-persisted shopping carts synced across devices.
  - **Guest Users**: Session-cached local storage shopping carts allowing users to shop without creating an account.
- **Flexible Guest Checkout**: Complete guest orders by providing delivery coordinates (Name, Email, Phone, Shipping Address).
- **Cash on Delivery (COD)**: Quick order placement with " Delivery on Pay\ confirmation.
- **LKR Currency Integration**: All prices, subtotals, and invoice charges are automatically formatted in Sri Lankan Rupees (Rs. / LKR).

### ??? Admin Dashboard (Management Console)
- **Business Performance Analytics**: High-impact metrics cards tracking Total Revenue, Orders, Customers, Products, Categories, and Low Stock Alerts.
- **Product Management**: Create, delete, and perform inline price/stock edits directly inside tabular lists.
- **Visual Category Manager**: Add and update product tags, including custom Category Image headers rendered on the storefront.
- **Order Processing Center**: Track and manage order parameters. View complete recipient details (delivery addresses, contact numbers, and invoice items) and dynamically update order statuses (Pending, Processing, Shipped, Completed, Cancelled).
- **Customer Analyzer**: Track customer registration history, total order counts, and overall spending metrics.

---

## ??? Technology Stack

- **Backend API**: 
 - ASP.NET Core Web API (C# .NET 8)
 - Entity Framework (EF) Core (ORM)
 - SQLite Database
 - JWT (JSON Web Tokens) Authentication
- **Frontend UI**:
 - React (Vite environment)
 - Tailwind CSS for modern responsive aesthetics
 - Axios for async API communication
 - React Router DOM for routing

---

## ?? Getting Started Locally

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (v18 or higher)
- Powershell or Git Bash

### 1. Database Setup & Migration
Navigate to the backend directory and apply migrations to build the SQLite database schema:
\\\ash
cd TechMart.API
dotnet ef database update
\\\`n
### 2. Start the Backend Server
Run the C# API locally (running at \http://localhost:5019\):
\\\ash
dotnet run
\\\`n
### 3. Start the Frontend Client
Open a new terminal tab, navigate to the React UI directory, install dependencies, and run the developer server (running at \http://localhost:5173\):
\\\ash
cd TechMart.UI
npm install
npm run dev
\\\`n
---

## ?? Project Architecture

\\\ ext
+-- TechMart.API # C# Backend Web API project
¦ +-- Controllers # API endpoint definitions (Admin, Products, Carts, Orders)
¦ +-- Data # DB context and migrations configuration
¦ +-- DTOs # Data Transfer Objects & request payloads
¦ +-- Models # SQLite Database Entities (User, Product, Category, Order, Cart)
¦ +-- Services # Business logic implementations
¦
+-- TechMart.UI # React Frontend Client (Vite)
 +-- src
 ¦ +-- api # Axios instance configs
 ¦ +-- components # Reusable components (Navbar, Footer, ProductCard)
 ¦ +-- context # AuthContext state configurations
 ¦ +-- pages # Pages (Home, Products, ProductDetails, Cart, AdminDashboard)
\\\
