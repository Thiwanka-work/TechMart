import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation states
  const [activeMenu, setActiveMenu] = useState('dashboard'); // 'dashboard', 'products', 'categories', 'orders', 'customers', 'settings', 'profile'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    recentOrders: []
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({
    storeName: 'TechMart',
    contactEmail: 'support@techmart.com',
    phoneNumber: '+1 (555) 019-2834',
    address: '123 Tech Boulevard, Silicon Valley, CA',
    logoUrl: ''
  });

  // UI / UX states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals & Target states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryImageUrlInput, setCategoryImageUrlInput] = useState('');

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState({ orderId: null, newStatus: '' });

  const [showCustomerHistoryModal, setShowCustomerHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrderHistory, setCustomerOrderHistory] = useState([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null, name: '' });

  // Pagination states
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const itemsPerPage = 8;

  // Inline quick editing states for product price/stock
  const [inlineEdits, setInlineEdits] = useState({}); // { [productId]: { price, stock } }

  const profileDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- API SERVICE FETCHES ---
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeMenu === 'dashboard') {
        const statsRes = await api.get('/admin/dashboard-stats');
        setDashboardStats(statsRes.data);
      } else if (activeMenu === 'products') {
        const prodRes = await api.get('/products');
        setProducts(prodRes.data);
        const catRes = await api.get('/admin/categories');
        setCategories(catRes.data);
      } else if (activeMenu === 'categories') {
        const catRes = await api.get('/admin/categories');
        setCategories(catRes.data);
      } else if (activeMenu === 'orders') {
        const orderRes = await api.get('/admin/orders');
        setOrders(orderRes.data);
      } else if (activeMenu === 'customers') {
        const custRes = await api.get('/admin/customers');
        setCustomers(custRes.data);
      } else if (activeMenu === 'settings') {
        const settingsRes = await api.get('/admin/settings');
        setSettings(settingsRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Make sure you are authorized.');
      showToast('API Synchronization Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadDashboardData();
    }
  }, [user, activeMenu]);

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Access check
  if (!user || user.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 text-center">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-100">Access Denied</h2>
            <p className="text-slate-400 text-sm">
              You do not have administrative privileges to access this area.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 cursor-pointer"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIONS ---

  // Image Upload helper
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);

    try {
      const response = await api.post('/admin/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProductForm(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Settings Logo upload helper
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);

    try {
      const response = await api.post('/admin/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettings(prev => ({ ...prev, logoUrl: response.data.imageUrl }));
      showToast('Store logo uploaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload logo.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);

    try {
      const response = await api.post('/admin/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCategoryImageUrlInput(response.data.imageUrl);
      showToast('Category image uploaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload category image.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Settings
  const saveStoreSettings = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/settings', settings);
      showToast('Store settings saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save store settings.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Product Create/Edit
  const openProductFormModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
        imageUrl: product.imageUrl
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: categories[0]?.name || '',
        imageUrl: ''
      });
    }
    setShowProductModal(true);
  };

  const submitProductForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      category: productForm.category,
      imageUrl: productForm.imageUrl
    };

    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload);
        showToast('Product specifications updated!', 'success');
      } else {
        await api.post('/admin/products', payload);
        showToast('New product published successfully!', 'success');
      }
      setShowProductModal(false);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save product details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Inline Quick Edits
  const handleInlineChange = (productId, field, value) => {
    setInlineEdits(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {
          price: products.find(p => p.id === productId).price.toString(),
          stock: products.find(p => p.id === productId).stock.toString()
        }),
        [field]: value
      }
    }));
  };

  const saveInlineEdits = async (productId) => {
    const edit = inlineEdits[productId];
    if (!edit) return;

    const original = products.find(p => p.id === productId);
    const payload = {
      name: original.name,
      description: original.description,
      price: parseFloat(edit.price),
      stock: parseInt(edit.stock),
      category: original.category,
      imageUrl: original.imageUrl
    };

    try {
      await api.put(`/admin/products/${productId}`, payload);
      showToast('Quick edits saved!', 'success');
      // Clean inline edit state
      setInlineEdits(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to quick-save edits.', 'error');
    }
  };

  // Delete Action Setup
  const confirmDelete = (type, id, name) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    setShowDeleteConfirm(false);
    const { type, id } = deleteTarget;
    try {
      if (type === 'product') {
        await api.delete(`/admin/products/${id}`);
        showToast('Product removed from catalog.', 'success');
      } else if (type === 'category') {
        await api.delete(`/admin/categories/${id}`);
        showToast('Category deleted successfully.', 'success');
      }
      loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast(`Failed to delete this ${type}.`, 'error');
    }
  };

  // Category Add/Edit
  const openCategoryModalForm = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryNameInput(category.name);
      setCategoryImageUrlInput(category.imageUrl || '');
    } else {
      setEditingCategory(null);
      setCategoryNameInput('');
      setCategoryImageUrlInput('');
    }
    setShowCategoryModal(true);
  };

  const submitCategoryForm = async (e) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;
    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, { 
          name: categoryNameInput,
          imageUrl: categoryImageUrlInput 
        });
        showToast('Category renamed successfully!', 'success');
      } else {
        await api.post('/admin/categories', { 
          name: categoryNameInput,
          imageUrl: categoryImageUrlInput 
        });
        showToast('New category added!', 'success');
      }
      setShowCategoryModal(false);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save category.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Customer History
  const openCustomerHistory = async (customer) => {
    setSelectedCustomer(customer);
    setLoading(true);
    try {
      const orderRes = await api.get('/admin/orders');
      const filteredOrders = orderRes.data.filter(o => o.userId === customer.id);
      setCustomerOrderHistory(filteredOrders);
      setShowCustomerHistoryModal(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to load purchase history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Order status confirmation
  const confirmOrderStatusChange = (orderId, newStatus) => {
    setStatusToUpdate({ orderId, newStatus });
    setShowStatusConfirm(true);
  };

  const saveOrderStatus = async () => {
    const { orderId, newStatus } = statusToUpdate;
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order status updated to ${newStatus}.`, 'success');
      setShowStatusConfirm(false);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.', 'error');
    }
  };

  // Status mapping colors helpers
  const getOrderStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Processing':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Shipped':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Pending':
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  const getProductStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-rose-500 bg-rose-500/10 border border-rose-500/20' };
    if (stock <= 5) return { label: 'Low Stock', color: 'text-amber-500 bg-amber-500/10 border border-amber-500/20' };
    return { label: 'In Stock', color: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' };
  };

  // Sidebar Menu list
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    )},
    { id: 'products', name: 'Products', icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )},
    { id: 'categories', name: 'Categories', icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )},
    { id: 'orders', name: 'Orders', icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { id: 'customers', name: 'Customers', icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: 'settings', name: 'Settings', icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: 'profile', name: 'Profile', icon: (active) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )}
  ];

  return (
    <div className="flex h-screen bg-slate-955 text-slate-100 font-sans overflow-hidden">
      
      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-3.5 rounded-xl shadow-2xl animate-fade-in animate-slide-in">
          <span className={`w-2.5 h-2.5 rounded-full ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span className="text-sm font-medium text-slate-205">{toast.message}</span>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 transform 
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:relative 
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-650 to-indigo-400 flex items-center justify-center font-black text-white shadow-md shadow-indigo-650/20">
              TM
            </div>
            {!isSidebarCollapsed && (
              <span className="font-black text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350">
                {settings.storeName.toUpperCase()}
              </span>
            )}
          </div>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-205 transition cursor-pointer"
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  setSearchQuery('');
                  setCategoryFilter('');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full group flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer
                  ${isActive 
                    ? 'bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 font-bold' 
                    : 'text-slate-400 border border-transparent hover:bg-slate-800/60 hover:text-slate-205'}`}
              >
                <div className="flex-shrink-0">
                  {item.icon(isActive)}
                </div>
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                {isActive && !isSidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-505 shadow-sm shadow-indigo-550/50" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 font-semibold text-sm border border-transparent hover:border-rose-500/20 transition duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* --- CONTENT AREA --- */}
      <div className="flex-grow flex flex-col overflow-hidden">
        
        {/* --- TOP NAV BAR --- */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 flex-shrink-0">
          <div className="flex items-center gap-4 flex-grow md:flex-grow-0">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-205 transition cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Top Search Bar (Applies searches across lists) */}
            <div className="relative max-w-xs w-64 hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setProductPage(1);
                  setOrderPage(1);
                  setCustomerPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-350 text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition placeholder-slate-650"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => showToast('No new warnings logged.', 'success')}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-205 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-505 rounded-full ring-2 ring-slate-900" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-850 transition cursor-pointer outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs shadow-sm">
                  {user.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase() : 'AD'}
                </div>
                <div className="hidden md:block text-left pr-1.5">
                  <p className="text-xs font-bold text-slate-205 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{user.role}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-500 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-30 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-slate-205">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => { setActiveMenu('profile'); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-205 font-medium transition cursor-pointer"
                  >
                    My Profile
                  </button>
                  <button 
                    onClick={() => { setActiveMenu('settings'); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-205 font-medium transition cursor-pointer"
                  >
                    Store Settings
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 font-bold transition cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- DYNAMIC VIEWS SCROLL VIEW --- */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 bg-slate-950">
          
          {loading && (
            <div className="h-full flex flex-col justify-center items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Syncing Administration Databases...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl font-medium max-w-2xl mx-auto shadow-lg">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">

              {/* ==================== 1. DASHBOARD HOME ==================== */}
              {activeMenu === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight">Console Control Center</h2>
                    <p className="text-xs text-slate-505 mt-1 font-semibold uppercase tracking-wider">Telemetry overview and recent purchases</p>
                  </div>

                  {/* Stats cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        title: 'Total Products',
                        value: dashboardStats.totalProducts,
                        theme: 'from-blue-600/20 to-blue-800/10 border-blue-500/30 text-blue-400',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      },
                      {
                        title: 'Total Categories',
                        value: dashboardStats.totalCategories,
                        theme: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/30 text-emerald-400',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      },
                      {
                        title: 'Total Customers',
                        value: dashboardStats.totalCustomers,
                        theme: 'from-violet-600/20 to-violet-800/10 border-violet-500/30 text-violet-400',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" />
                      },
                      {
                        title: 'Total Orders',
                        value: dashboardStats.totalOrders,
                        theme: 'from-amber-600/20 to-amber-800/10 border-amber-500/30 text-amber-400',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      },
                      {
                        title: 'Total Revenue',
                        value: `Rs. ${dashboardStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        theme: 'from-teal-600/20 to-teal-800/10 border-teal-500/30 text-teal-400',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      },
                      {
                        title: 'Low Stock Products',
                        value: dashboardStats.lowStockProducts,
                        theme: 'from-rose-600/20 to-rose-800/10 border-rose-500/30 text-rose-400',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3" />
                      }
                    ].map((card, idx) => (
                      <div
                        key={idx}
                        className={`bg-slate-900 border p-6 rounded-2xl shadow-lg flex items-center justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02] cursor-default bg-gradient-to-br ${card.theme}`}
                      >
                        <div className="space-y-2">
                          <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">{card.title}</p>
                          <h3 className="text-3xl font-black text-slate-100 tracking-tight">{card.value}</h3>
                        </div>
                        <div className="w-12 h-12 bg-slate-950/40 rounded-xl flex items-center justify-center shadow-inner">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {card.icon}
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Orders table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">Recent Purchase Placements</h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Summary telemetry on current store checkouts</p>
                      </div>
                      <button 
                        onClick={() => setActiveMenu('orders')}
                        className="bg-indigo-650/10 hover:bg-indigo-650/20 text-indigo-400 border border-indigo-500/20 px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer"
                      >
                        All Orders
                      </button>
                    </div>

                    {dashboardStats.recentOrders.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 font-medium">No order placements found in records.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                              <th className="py-4 px-6">Order ID</th>
                              <th className="py-4 px-6">Customer Name</th>
                              <th className="py-4 px-6">Date Placed</th>
                              <th className="py-4 px-6">Charge Total</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-semibold text-slate-350">
                            {dashboardStats.recentOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-4 px-6 font-mono text-[11px] text-slate-500">#{order.id}</td>
                                <td className="py-4 px-6 text-slate-205">
                                  <div className="font-bold">{order.customerName}</div>
                                  <div className="text-[10px] text-slate-500 font-medium">{order.customerEmail}</div>
                                </td>
                                <td className="py-4 px-6 text-slate-400">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-6 text-indigo-400 font-black">Rs. {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${getOrderStatusStyle(order.status)}`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right flex gap-2 justify-end items-center h-[62px]">
                                  <button 
                                    onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-1.5 rounded-lg transition text-[11px] cursor-pointer font-bold"
                                  >
                                    View
                                  </button>
                                  <select
                                    value={order.status}
                                    onChange={(e) => confirmOrderStatusChange(order.id, e.target.value)}
                                    className="bg-slate-955 border border-slate-800 text-slate-350 text-[11px] px-2 py-1.5 rounded-lg outline-none cursor-pointer font-bold"
                                  >
                                    <option className="bg-slate-900 text-slate-100" value="Pending">Pending</option>
                                    <option className="bg-slate-900 text-slate-100" value="Processing">Processing</option>
                                    <option className="bg-slate-900 text-slate-100" value="Completed">Completed</option>
                                    <option className="bg-slate-900 text-slate-100" value="Cancelled">Cancelled</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== 2. PRODUCT MANAGEMENT ==================== */}
              {activeMenu === 'products' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-100 tracking-tight">Product Catalog</h2>
                      <p className="text-xs text-slate-505 mt-1 font-semibold uppercase tracking-wider">Publish and configure store hardware inventory</p>
                    </div>
                    <button
                      onClick={() => openProductFormModal(null)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4.5 rounded-xl shadow-lg shadow-indigo-650/20 transition cursor-pointer"
                    >
                      + Add New Product
                    </button>
                  </div>

                  {/* Filters Bar */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-grow max-w-sm w-full">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Search products by name, description..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setProductPage(1); }}
                        className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-350 text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition placeholder-slate-650"
                      />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => { setCategoryFilter(e.target.value); setProductPage(1); }}
                      className="bg-slate-955 border border-slate-800 text-slate-350 text-xs rounded-xl px-4 py-2 cursor-pointer outline-none focus:border-indigo-500 font-bold"
                    >
                      <option className="bg-slate-900 text-slate-100 font-bold" value="">All Categories</option>
                      {categories.map(cat => (
                        <option className="bg-slate-900 text-slate-100" key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Products list table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    {products.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 font-medium">No products found. Add a gadget first!</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                              <th className="py-4 px-6 w-16">Image</th>
                              <th className="py-4 px-6">Product Details</th>
                              <th className="py-4 px-6">Category</th>
                              <th className="py-4 px-6 w-28">Price (LKR)</th>
                              <th className="py-4 px-6 w-28">Stock (Units)</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                            {products
                              .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                              .filter(p => !categoryFilter || p.category === categoryFilter)
                              .slice((productPage - 1) * itemsPerPage, productPage * itemsPerPage)
                              .map((prod) => {
                                const stockStatus = getProductStockStatus(prod.stock);
                                const hasInlineEdits = !!inlineEdits[prod.id];
                                const currentPrice = hasInlineEdits ? inlineEdits[prod.id].price : prod.price;
                                const currentStock = hasInlineEdits ? inlineEdits[prod.id].stock : prod.stock;

                                return (
                                  <tr key={prod.id} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-6">
                                      <img 
                                        src={prod.imageUrl || 'https://via.placeholder.com/60'} 
                                        alt={prod.name} 
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-800" 
                                      />
                                    </td>
                                    <td className="py-3 px-6 text-slate-205">
                                      <div className="font-bold text-slate-200">{prod.name}</div>
                                      <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5 font-medium">{prod.description}</div>
                                    </td>
                                    <td className="py-3 px-6">
                                      <span className="bg-slate-950 text-slate-400 px-2.5 py-0.5 rounded-full text-[10px] border border-slate-800 font-bold">
                                        {prod.category}
                                      </span>
                                    </td>
                                    {/* Inline Price Edit */}
                                    <td className="py-3 px-6">
                                      <input 
                                        type="number"
                                        step="0.01"
                                        value={currentPrice}
                                        onChange={(e) => handleInlineChange(prod.id, 'price', e.target.value)}
                                        className="w-20 bg-slate-955 border border-slate-800 text-indigo-400 text-xs px-2 py-1 rounded font-bold focus:border-indigo-500 outline-none text-center"
                                      />
                                    </td>
                                    {/* Inline Stock Edit */}
                                    <td className="py-3 px-6">
                                      <input 
                                        type="number"
                                        value={currentStock}
                                        onChange={(e) => handleInlineChange(prod.id, 'stock', e.target.value)}
                                        className="w-16 bg-slate-955 border border-slate-800 text-slate-205 text-xs px-2 py-1 rounded focus:border-indigo-500 outline-none text-center"
                                      />
                                    </td>
                                    <td className="py-3 px-6">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${stockStatus.color}`}>
                                        {stockStatus.label}
                                      </span>
                                    </td>
                                    <td className="py-3 px-6 text-right flex gap-2 justify-end items-center h-16">
                                      {hasInlineEdits && (
                                        <button 
                                          onClick={() => saveInlineEdits(prod.id)}
                                          title="Save Quick Edits"
                                          className="bg-emerald-650/20 hover:bg-emerald-650/30 text-emerald-400 border border-emerald-500/20 p-1.5 rounded-lg transition cursor-pointer"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                          </svg>
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => openProductFormModal(prod)}
                                        className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg transition text-[11px] cursor-pointer font-bold"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={() => confirmDelete('product', prod.id, prod.name)}
                                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2.5 py-1.5 rounded-lg transition text-[11px] cursor-pointer font-bold"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {products.length > itemsPerPage && (
                      <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50 text-[11px] font-semibold text-slate-400">
                        <button
                          disabled={productPage === 1}
                          onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          Previous
                        </button>
                        <span>
                          Page {productPage} of {Math.ceil(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage)}
                        </span>
                        <button
                          disabled={productPage >= Math.ceil(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage)}
                          onClick={() => setProductPage(prev => prev + 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* ==================== 3. CATEGORY MANAGEMENT ==================== */}
              {activeMenu === 'categories' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black text-slate-100 tracking-tight">Store Categories</h2>
                      <p className="text-xs text-slate-505 mt-1 font-semibold uppercase tracking-wider">Group and partition store offerings</p>
                    </div>
                    <button
                      onClick={() => openCategoryModalForm(null)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4.5 rounded-xl shadow-lg transition cursor-pointer"
                    >
                      + Add Category
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    {categories.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 font-medium">No category models configured.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                              <th className="py-4 px-6 w-16">Image</th>
                              <th className="py-4 px-6">Category Name</th>
                              <th className="py-4 px-6">Number of Products</th>
                              <th className="py-4 px-6">Created Date</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                            {categories.map((cat) => (
                              <tr key={cat.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3 px-6">
                                  <img 
                                    src={cat.imageUrl || 'https://via.placeholder.com/60'} 
                                    alt={cat.name} 
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-800 bg-slate-950" 
                                  />
                                </td>
                                <td className="py-4 px-6 text-slate-205 font-bold text-sm">{cat.name}</td>
                                <td className="py-4 px-6">
                                  <span className="bg-indigo-650/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold">
                                    {cat.productCount} Products
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-slate-550">July 1, 2026</td>
                                <td className="py-4 px-6 text-right flex gap-2 justify-end items-center h-[53px]">
                                  <button 
                                    onClick={() => openCategoryModalForm(cat)}
                                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition text-[11px] font-bold cursor-pointer"
                                  >
                                    Rename
                                  </button>
                                  <button 
                                    onClick={() => confirmDelete('category', cat.id, cat.name)}
                                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg transition text-[11px] font-bold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== 4. ORDER MANAGEMENT ==================== */}
              {activeMenu === 'orders' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight">Order Fulfilment Console</h2>
                    <p className="text-xs text-slate-505 mt-1 font-semibold uppercase tracking-wider">Track and update customer order statuses</p>
                  </div>

                  {/* Search orders */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-grow max-w-sm w-full">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Search orders by customer or ID..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setOrderPage(1); }}
                        className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-350 text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition placeholder-slate-650"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    {orders.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 font-medium">No order placements recorded.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                              <th className="py-4 px-6">Order Number</th>
                              <th className="py-4 px-6">Customer</th>
                              <th className="py-4 px-6">Order Date</th>
                              <th className="py-4 px-6">Invoice Total</th>
                              <th className="py-4 px-6">Payment</th>
                              <th className="py-4 px-6">Order Status</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                            {orders
                              .filter(o => o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.toString().includes(searchQuery))
                              .slice((orderPage - 1) * itemsPerPage, orderPage * itemsPerPage)
                              .map((order) => {
                                const isPaid = order.status === 'Completed' || order.status === 'Processing' || order.status === 'Shipped';
                                return (
                                  <tr key={order.id} className="hover:bg-slate-800/40 transition">
                                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500">#{order.id}</td>
                                    <td className="py-4 px-6 text-slate-205">
                                      <div className="font-bold">{order.customerName}</div>
                                      <div className="text-[10px] text-slate-500 font-medium">{order.customerEmail}</div>
                                    </td>
                                    <td className="py-4 px-6 text-slate-400">
                                      {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                     <td className="py-4 px-6 text-indigo-405 font-black">Rs. {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="py-4 px-6">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                        {isPaid ? 'Paid' : 'Pending'}
                                      </span>
                                    </td>
                                    <td className="py-4 px-6">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${getOrderStatusStyle(order.status)}`}>
                                        {order.status}
                                      </span>
                                    </td>
                                    <td className="py-4 px-6 text-right flex gap-2 justify-end items-center h-[62px]">
                                      <button 
                                        onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                                        className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-1.5 rounded-lg transition text-[11px] font-bold cursor-pointer"
                                      >
                                        View Details
                                      </button>
                                      <select
                                        value={order.status}
                                        onChange={(e) => confirmOrderStatusChange(order.id, e.target.value)}
                                        className="bg-slate-955 border border-slate-800 text-slate-350 text-[11px] px-2.5 py-1.5 rounded-lg outline-none cursor-pointer font-bold"
                                      >
                                        <option className="bg-slate-900 text-slate-100" value="Pending">Pending</option>
                                        <option className="bg-slate-900 text-slate-100" value="Processing">Processing</option>
                                        <option className="bg-slate-900 text-slate-100" value="Shipped">Shipped</option>
                                        <option className="bg-slate-900 text-slate-100" value="Completed">Completed</option>
                                        <option className="bg-slate-900 text-slate-100" value="Cancelled">Cancelled</option>
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {orders.length > itemsPerPage && (
                      <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50 text-[11px] font-semibold text-slate-400">
                        <button
                          disabled={orderPage === 1}
                          onClick={() => setOrderPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          Previous
                        </button>
                        <span>
                          Page {orderPage} of {Math.ceil(orders.filter(o => o.customerName.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage)}
                        </span>
                        <button
                          disabled={orderPage >= Math.ceil(orders.filter(o => o.customerName.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage)}
                          onClick={() => setOrderPage(prev => prev + 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* ==================== 5. CUSTOMER DIRECTORY ==================== */}
              {activeMenu === 'customers' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight">Customer Database</h2>
                    <p className="text-xs text-slate-505 mt-1 font-semibold uppercase tracking-wider">Inspect registration profiles and histories</p>
                  </div>

                  {/* Search customers */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-grow max-w-sm w-full">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Search customers by name or email..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCustomerPage(1); }}
                        className="w-full bg-slate-955 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-350 text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition placeholder-slate-650"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    {customers.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 font-medium">No registered customers.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                              <th className="py-4 px-6">Customer Name</th>
                              <th className="py-4 px-6">Email Address</th>
                              <th className="py-4 px-6">Phone Number</th>
                              <th className="py-4 px-6">Registration Date</th>
                              <th className="py-4 px-6">Total Spent</th>
                              <th className="py-4 px-6">Orders Count</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-semibold text-slate-305">
                            {customers
                              .filter(c => c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()))
                              .slice((customerPage - 1) * itemsPerPage, customerPage * itemsPerPage)
                              .map((cust) => (
                                <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                                  <td className="py-4 px-6 text-slate-205 font-bold">{cust.fullName}</td>
                                  <td className="py-4 px-6 text-slate-400">{cust.email}</td>
                                  <td className="py-4 px-6 text-slate-500">Not Provided</td>
                                  <td className="py-4 px-6 text-slate-400">
                                    {new Date(cust.createdAt).toLocaleDateString()}
                                  </td>
                                   <td className="py-4 px-6 text-indigo-400 font-black">Rs. {cust.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="py-4 px-6">
                                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                                      {cust.totalOrders} Orders
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Active
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <button 
                                      onClick={() => openCustomerHistory(cust)}
                                      className="bg-indigo-650/10 hover:bg-indigo-650/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition text-[11px] font-bold cursor-pointer"
                                    >
                                      Order History
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {customers.length > itemsPerPage && (
                      <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50 text-[11px] font-semibold text-slate-400">
                        <button
                          disabled={customerPage === 1}
                          onClick={() => setCustomerPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          Previous
                        </button>
                        <span>
                          Page {customerPage} of {Math.ceil(customers.filter(c => c.fullName.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage)}
                        </span>
                        <button
                          disabled={customerPage >= Math.ceil(customers.filter(c => c.fullName.toLowerCase().includes(searchQuery.toLowerCase())).length / itemsPerPage)}
                          onClick={() => setCustomerPage(prev => prev + 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* ==================== 6. STORE SETTINGS ==================== */}
              {activeMenu === 'settings' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight">Store Configurations</h2>
                    <p className="text-xs text-slate-505 mt-1 font-semibold uppercase tracking-wider">Configure store values and branding assets</p>
                  </div>

                  <form onSubmit={saveStoreSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                      
                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Store Branding Name</label>
                        <input
                          type="text"
                          required
                          value={settings.storeName}
                          onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                          className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4 py-2.5 rounded-xl outline-none transition"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Contact Email Address</label>
                        <input
                          type="email"
                          required
                          value={settings.contactEmail}
                          onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                          className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4 py-2.5 rounded-xl outline-none transition"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Customer Service Phone</label>
                        <input
                          type="text"
                          required
                          value={settings.phoneNumber}
                          onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4 py-2.5 rounded-xl outline-none transition"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Store Operations Address</label>
                        <input
                          type="text"
                          required
                          value={settings.address}
                          onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4 py-2.5 rounded-xl outline-none transition"
                        />
                      </div>

                    </div>

                    {/* Logo upload field */}
                    <div className="space-y-2 text-xs font-semibold">
                      <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Store Branding Logo Image</label>
                      <div className="flex items-center gap-4 border border-dashed border-slate-800 p-4.5 rounded-xl bg-slate-955">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:bg-indigo-650/10 file:text-indigo-400 hover:file:bg-indigo-650/20 file:cursor-pointer outline-none"
                        />
                        {uploadingImage && <span className="text-[11px] text-indigo-400 animate-pulse font-bold">Uploading...</span>}
                      </div>
                      {settings.logoUrl && (
                        <div className="pt-2">
                          <p className="text-[10px] text-slate-500 font-bold mb-1">Logo Preview:</p>
                          <img src={settings.logoUrl} alt="Store logo" className="h-12 w-36 object-contain rounded border border-slate-800 p-1.5 bg-slate-950" />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-800 pt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition text-xs disabled:opacity-40 cursor-pointer"
                      >
                        {submitting ? 'Saving Configuration...' : 'Save Config Options'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ==================== 7. PROFILE PAGE ==================== */}
              {activeMenu === 'profile' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl space-y-6 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center text-xl shadow-lg">
                      {user.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase() : 'AD'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-105">{user.name}</h3>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{user.role}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-6 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">User Email Address</label>
                      <input 
                        type="text" 
                        value={user.email} 
                        readOnly 
                        className="bg-slate-955 border border-slate-800 text-slate-400 text-xs rounded-xl px-4 py-2.5 w-full max-w-md outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-widest mb-1.5">Security Level</label>
                      <span className="inline-block bg-indigo-650/20 text-indigo-400 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-indigo-500/20 shadow-sm">
                        Full Admin Operations Enabled
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* ==================== PRODUCT DIALOG MODAL ==================== */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={submitProductForm}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in animate-scale-in"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-slate-100">{editingProduct ? 'Edit Gadget Specs' : 'Publish New Gadget'}</h3>
                <p className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider mt-0.5">Catalog Item Configuration</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-350 transition flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Gadget Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4.5 py-2 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Category Division</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-350 px-4.5 py-2 rounded-xl outline-none cursor-pointer font-bold"
                  >
                    <option className="bg-slate-900 text-slate-500" value="">Select a Category Division</option>
                    {categories.map(cat => (
                      <option className="bg-slate-900 text-slate-100" key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Specs Description</label>
                <textarea
                  required
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4.5 py-2 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">MSRP Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4.5 py-2 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Inventory Stock Units</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4.5 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Gadget Display Image</label>
                <div className="flex items-center gap-4 border border-dashed border-slate-800 p-4.5 rounded-xl bg-slate-955">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:bg-indigo-650/10 file:text-indigo-400 hover:file:bg-indigo-650/20 file:cursor-pointer outline-none"
                  />
                  {uploadingImage && <span className="text-[11px] text-indigo-400 animate-pulse font-bold">Uploading...</span>}
                </div>
                {productForm.imageUrl && (
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-500 font-bold mb-1">Image Preview:</p>
                    <img src={productForm.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-800 bg-slate-950" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-2.5">
              <button 
                type="button"
                onClick={() => setShowProductModal(false)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-355 border border-slate-700 px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4.5 py-2 rounded-xl shadow-md transition disabled:opacity-40 cursor-pointer"
              >
                {submitting ? 'Saving specs...' : editingProduct ? 'Save Specifications' : 'Publish Gadget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== CATEGORY DIALOG MODAL ==================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={submitCategoryForm}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in animate-scale-in"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-slate-100">{editingCategory ? 'Rename Category' : 'Create Category'}</h3>
                <p className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider mt-0.5">Category configurations</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-350 transition flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Category Label Name</label>
                <input
                  type="text"
                  required
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-slate-205 px-4.5 py-2.5 rounded-xl outline-none"
                  placeholder="e.g., Desk Hardware, Audio Gear"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Category Display Image</label>
                <div className="flex items-center gap-4 border border-dashed border-slate-800 p-4 rounded-xl bg-slate-955">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryImageUpload}
                    className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:bg-indigo-650/10 file:text-indigo-400 hover:file:bg-indigo-650/20 file:cursor-pointer outline-none"
                  />
                  {uploadingImage && <span className="text-[11px] text-indigo-400 animate-pulse font-bold">Uploading...</span>}
                </div>
                {categoryImageUrlInput && (
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-500 font-bold mb-1">Image Preview:</p>
                    <img src={categoryImageUrlInput} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-800 bg-slate-950" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-2.5">
              <button 
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-355 border border-slate-700 px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-md transition disabled:opacity-40 cursor-pointer"
              >
                {submitting ? 'Saving Category...' : editingCategory ? 'Save Edits' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== ORDER DETAILS MODAL ==================== */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-fade-in animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-slate-100">Order Purchase Details</h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Order ID #{selectedOrder.id}</p>
              </div>
              <button 
                onClick={() => { setSelectedOrder(null); setShowOrderModal(false); }}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-350 transition flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4.5 rounded-xl border border-slate-800 text-xs">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer Profile Details</h4>
                  <div>
                    <p className="text-slate-200 font-bold text-sm">{selectedOrder.customerName}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{selectedOrder.customerEmail}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Phone: <span className="text-slate-300 font-semibold">{selectedOrder.customerPhone || 'Not Provided'}</span></p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Delivery Address</p>
                    <p className="text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
                      {selectedOrder.customerAddress || 'Not Provided'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Metadata Logs</h4>
                    <p className="text-slate-300">
                      <span className="text-slate-500 font-semibold">Date Placed: </span> 
                      {new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="text-slate-300">
                      <span className="text-slate-500 font-semibold">Payment Option: </span>
                      <span className="text-indigo-400 font-bold">
                        {selectedOrder.paymentMethod === 'PayOnDelivery' ? 'Pay on Delivery (COD)' : selectedOrder.paymentMethod || 'Pay on Delivery'}
                      </span>
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex gap-3 items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Status:</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getOrderStatusStyle(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Purchased Gadget Specs</h4>
                <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
                  {selectedOrder.orderItems && selectedOrder.orderItems.map((item, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center text-xs">
                      <div>
                        <p className="text-slate-205 font-bold text-slate-200">{item.productName}</p>
                        <p className="text-slate-500 font-semibold mt-0.5">Rs. {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-205 font-bold">Qty {item.quantity}</p>
                        <p className="text-indigo-400 font-black mt-0.5">Rs. {(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center bg-indigo-650/5 border border-indigo-500/20 p-5 rounded-xl">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Invoice Charge</span>
                 <span className="text-xl font-black text-indigo-400">Rs. {selectedOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-2.5">
              <button 
                onClick={() => { setSelectedOrder(null); setShowOrderModal(false); }}
                className="bg-slate-855 hover:bg-slate-800 text-slate-355 border border-slate-700 px-4.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CUSTOMER HISTORY MODAL ==================== */}
      {showCustomerHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-fade-in animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-slate-100">Customer Purchase Ledger</h3>
                <p className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider mt-0.5">History details for {selectedCustomer.fullName}</p>
              </div>
              <button 
                onClick={() => { setSelectedCustomer(null); setShowCustomerHistoryModal(false); }}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-350 transition flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              <div className="bg-slate-955 border border-slate-800 p-4 rounded-xl text-xs space-y-1">
                <p className="text-slate-400"><span className="text-slate-500 font-bold">Email: </span> {selectedCustomer.email}</p>
                <p className="text-slate-400"><span className="text-slate-500 font-bold">Joined: </span> {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                 <p className="text-slate-450"><span className="text-slate-500 font-bold">Spend Metrics: </span> {selectedCustomer.totalOrders} total placements, <span className="text-indigo-400 font-bold">Rs. {selectedCustomer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> spent</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Placements Records</h4>
                {customerOrderHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-550 font-bold">No past orders on record.</div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                    {customerOrderHistory.map(o => (
                      <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs">
                        <div className="space-y-1">
                          <p className="text-slate-205 font-bold">Order ID #{o.id}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Placed: {new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-4 items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${getOrderStatusStyle(o.status)}`}>
                            {o.status}
                          </span>
                           <span className="text-indigo-400 font-black">Rs. {o.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <button 
                            onClick={() => { setSelectedOrder(o); setShowOrderModal(true); }}
                            className="bg-slate-850 hover:bg-slate-800 border border-slate-700 px-3 py-1 rounded text-[11px] font-bold cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-2.5">
              <button 
                onClick={() => { setSelectedCustomer(null); setShowCustomerHistoryModal(false); }}
                className="bg-slate-855 hover:bg-slate-800 text-slate-355 border border-slate-700 px-4.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION DIALOG ==================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-6 animate-fade-in animate-scale-in">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100">Delete {deleteTarget.type === 'product' ? 'Product' : 'Category'}?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you absolutely sure you want to delete <span className="text-rose-400 font-bold">"{deleteTarget.name}"</span>? 
                {deleteTarget.type === 'category' && (
                  <span className="block mt-2 text-rose-500 font-bold text-[11px]">
                    WARNING: Deleting this category will reclassify all associated gadgets to "Uncategorized"!
                  </span>
                )}
                This action is permanent and cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end gap-2.5">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-355 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="bg-rose-650 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STATUS CONFIRMATION DIALOG ==================== */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-slate-955/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-6 animate-fade-in animate-scale-in">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100">Update Order Status?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirm updating order <span className="font-mono text-slate-300 font-bold">#{statusToUpdate.orderId}</span> to <span className="text-indigo-400 font-bold">"{statusToUpdate.newStatus}"</span>?
              </p>
            </div>
            
            <div className="flex justify-end gap-2.5">
              <button 
                onClick={() => { setShowStatusConfirm(false); loadDashboardData(); }}
                className="bg-slate-855 hover:bg-slate-800 text-slate-355 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={saveOrderStatus}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
