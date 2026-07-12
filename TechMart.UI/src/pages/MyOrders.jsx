import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  Pending:    { color: 'bg-amber-100 text-amber-700 border-amber-200',    dot: 'bg-amber-500',   icon: '🕐' },
  Processing: { color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500',    icon: '⚙️' },
  Shipped:    { color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500',  icon: '🚚' },
  Completed:  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: '✅' },
  Cancelled:  { color: 'bg-rose-100 text-rose-700 border-rose-200',       dot: 'bg-rose-500',    icon: '❌' },
};

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load your order history.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-20 px-6 text-center">
        <div className="inline-block w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">My Orders</h1>
          <p className="text-slate-500 mt-1 text-sm">Track all your TechMart purchases</p>
        </div>
        <Link
          to="/products"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm shadow"
        >
          Continue Shopping
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">No Orders Yet</h3>
          <p className="text-slate-500 mb-6 text-sm">Looks like you haven't placed any orders. Start shopping!</p>
          <Link to="/products" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition shadow text-sm">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const cfg = statusConfig[order.status] || statusConfig.Pending;
            const isExpanded = expandedOrder === order.id;
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            });

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Order Summary Row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">
                        Order <span className="font-mono text-indigo-600">#{order.id}</span>
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">{orderDate}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}
                        {' · '}
                        {order.paymentMethod === 'PayOnDelivery' ? 'Cash on Delivery' : order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                      <p className="text-lg font-black text-indigo-600">
                        Rs. {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                      {order.status}
                    </span>

                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5">
                    {/* Status Timeline */}
                    <div className="mb-5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Order Status</p>
                      <div className="flex items-center gap-0">
                        {['Pending', 'Processing', 'Shipped', 'Completed'].map((step, i) => {
                          const statuses = ['Pending', 'Processing', 'Shipped', 'Completed'];
                          const currentIdx = statuses.indexOf(order.status);
                          const stepIdx = statuses.indexOf(step);
                          const isCancelled = order.status === 'Cancelled';
                          const isDone = !isCancelled && stepIdx <= currentIdx;
                          const isActive = !isCancelled && stepIdx === currentIdx;

                          return (
                            <React.Fragment key={step}>
                              <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all
                                  ${isCancelled ? 'bg-slate-100 border-slate-300 text-slate-400'
                                    : isDone ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-400'}`}>
                                  {isDone && !isActive ? '✓' : stepIdx + 1}
                                </div>
                                <p className={`text-[9px] font-bold mt-1 whitespace-nowrap ${isActive ? 'text-indigo-600' : isDone ? 'text-slate-600' : 'text-slate-400'}`}>
                                  {step}
                                </p>
                              </div>
                              {i < 3 && (
                                <div className={`h-0.5 flex-1 mx-1 mb-4 ${!isCancelled && stepIdx < currentIdx ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                        {order.status === 'Cancelled' && (
                          <div className="ml-3 flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 rounded-full">
                            <span className="text-rose-600 text-xs font-bold">❌ Cancelled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div className="bg-white rounded-xl p-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Delivery Address</p>
                        <p className="text-sm font-semibold text-slate-700">{order.customerName}</p>
                        <p className="text-xs text-slate-500 mt-1">{order.customerAddress}</p>
                        <p className="text-xs text-slate-500">{order.customerPhone}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {order.paymentMethod === 'PayOnDelivery' ? '💵 Cash on Delivery' : order.paymentMethod}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Amount due on delivery</p>
                        <p className="text-base font-black text-indigo-600 mt-1">
                          Rs. {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.orderItems && order.orderItems.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Items Ordered</p>
                        <div className="space-y-2">
                          {order.orderItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black">
                                  {item.quantity}x
                                </div>
                                <Link
                                  to={`/products/${item.productId}`}
                                  className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {item.productName}
                                </Link>
                              </div>
                              <span className="text-sm font-bold text-slate-800">
                                Rs. {(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
