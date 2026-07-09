import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PayOnDelivery'); // 'PayOnDelivery', 'Card'

  // Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    fetchCart();
  }, [user]);

  // Set default details if user logs in
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
    } else {
      setFullName('');
      setEmail('');
    }
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      if (user) {
        // Authenticated cart from backend
        const response = await api.get('/cart');
        setCart(response.data);
      } else {
        // Guest cart from localStorage
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length === 0) {
          setCart({ items: [] });
        } else {
          // Fetch public products catalog to cross-reference prices and details
          const response = await api.get('/products');
          const allProducts = response.data;

          const guestItems = guestCart.map(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if (!product) return null;
            return {
              id: `${item.productId}-${item.variant || ''}`,
              productId: product.id,
              productName: product.name,
              productPrice: product.price,
              productImageUrl: product.imageUrl,
              variant: item.variant,
              quantity: item.quantity
            };
          }).filter(Boolean);

          setCart({ items: guestItems });
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load shopping cart contents.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, currentQty, offset) => {
    const nextQty = currentQty + offset;
    if (nextQty < 1) return;

    try {
      if (user) {
        await api.put(`/cart/items/${itemId}`, { quantity: nextQty });
        fetchCart();
      } else {
        // Guest LocalStorage update
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const target = guestCart.find(item => `${item.productId}-${item.variant || ''}` === itemId.toString());
        if (target) {
          target.quantity = nextQty;
          localStorage.setItem('guestCart', JSON.stringify(guestCart));
          fetchCart();
        }
      }
    } catch (err) {
      alert('Failed to update cart quantity.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      if (user) {
        await api.delete(`/cart/items/${itemId}`);
        fetchCart();
      } else {
        // Guest LocalStorage delete
        let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        guestCart = guestCart.filter(item => `${item.productId}-${item.variant || ''}` !== itemId.toString());
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        fetchCart();
      }
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (err) {
      alert('Failed to remove item from cart.');
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setError('Please fill in all shipping details.');
      return;
    }

    if (paymentMethod === 'Card') {
      if (!cardNumber || !cardExpiry || !cardCvc) {
        setError('Please enter credit card specifications.');
        return;
      }
      alert('Credit/Debit Card payments are currently not integrated. Please select "Delivery on Pay" to place your order.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const itemsPayload = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const payload = {
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod: paymentMethod, // 'PayOnDelivery'
        items: itemsPayload
      };

      const response = await api.post('/orders', payload);
      setOrderSuccess(response.data);
      
      // Clean guest cart on success
      if (!user) {
        localStorage.removeItem('guestCart');
      }
      setCart({ items: [] });
      setIsCheckingOut(false);
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Checkout failed. Please inspect gadget stock levels.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cart) return <div className="text-center py-16 text-slate-655 font-medium">Loading your shopping cart...</div>;

  if (orderSuccess) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-xl text-center">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Order Confirmed!</h2>
          <p className="text-slate-500 text-sm mb-6">Your order was successfully placed. Our dispatch riders will coordinate your delivery.</p>
          
          <div className="bg-slate-50 rounded-xl p-4.5 mb-6 text-left border border-slate-100">
            <p className="text-slate-550 text-[10px] font-bold uppercase tracking-wider">Invoice ID</p>
            <p className="font-mono text-slate-800 font-extrabold text-sm mb-3">#{orderSuccess.id}</p>
            <p className="text-slate-555 text-[10px] font-bold uppercase tracking-wider">Recipient Name</p>
            <p className="text-slate-800 font-extrabold text-sm mb-3">{orderSuccess.customerName}</p>
            <p className="text-slate-550 text-[10px] font-bold uppercase tracking-wider">Payment Method</p>
            <p className="text-slate-850 font-extrabold text-xs mb-3">
              {orderSuccess.paymentMethod === 'PayOnDelivery' ? 'Pay on Delivery (Cash on Delivery)' : orderSuccess.paymentMethod}
            </p>
            <p className="text-slate-550 text-[10px] font-bold uppercase tracking-wider">Total Invoice Charge</p>
            <p className="text-xl font-black text-indigo-600">Rs. {orderSuccess.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          <Link to="/products" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow cursor-pointer text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-black text-slate-800">Your Shopping Cart</h2>
          {!user && (
            <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm">
              Guest Mode
            </span>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 text-xs font-semibold mb-6 max-w-xl">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
            <p className="text-slate-550 text-base font-semibold mb-4">Your shopping cart is currently empty.</p>
            <Link to="/products" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl transition text-xs font-black inline-block shadow cursor-pointer">
              Browse Tech Catalog
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left Side: Cart Items or Shipping Form */}
            <div className="w-full lg:w-2/3 space-y-4">
              {!isCheckingOut ? (
                // Cart Items List
                items.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow transition duration-200">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img 
                        src={item.productImageUrl || 'https://via.placeholder.com/150'} 
                        alt={item.productName} 
                        className="w-16 h-16 object-cover rounded-xl border border-slate-100 shadow-sm"
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.productName}</h4>
                        {item.variant && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.variant}</p>}
                        <p className="text-xs text-indigo-600 font-extrabold mt-0.5">Rs. {item.productPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 font-bold border-r border-slate-200 transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3.5 font-bold text-slate-800 text-xs">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 font-bold border-l border-slate-200 transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <p className="font-black text-slate-800 w-20 text-right text-sm">
                        Rs. {(item.productPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>

                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                // Checkout Delivery Form
                <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Billing & Delivery details</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Please provide delivery address coordinates</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-705">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider">Recipient Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        <input 
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 outline-none font-semibold text-slate-800"
                          placeholder="e.g. Ruwan Perera"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-455 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <input 
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 outline-none font-semibold text-slate-800"
                          placeholder="e.g. ruwan@gmail.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </span>
                        <input 
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 outline-none font-semibold text-slate-800"
                          placeholder="e.g. +94 77 123 4567"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider">Shipping Address</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </span>
                        <input 
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 outline-none font-semibold text-slate-800"
                          placeholder="Street No, City, Province"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <label className="block text-[10px] text-slate-450 uppercase tracking-wider font-bold">Select Payment Option</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Cash on Delivery */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('PayOnDelivery')}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition duration-200 cursor-pointer w-full
                          ${paymentMethod === 'PayOnDelivery' 
                            ? 'bg-indigo-50/50 border-indigo-500 text-indigo-900 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition shrink-0
                            ${paymentMethod === 'PayOnDelivery' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-extrabold text-xs">Delivery on Pay (COD)</p>
                            <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">Settle with cash upon package receipt</p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                          ${paymentMethod === 'PayOnDelivery' ? 'border-indigo-500' : 'border-slate-300'}`}
                        >
                          {paymentMethod === 'PayOnDelivery' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                        </div>
                      </button>

                      {/* Card Payment */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Card')}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition duration-200 cursor-pointer w-full
                          ${paymentMethod === 'Card' 
                            ? 'bg-indigo-50/50 border-indigo-500 text-indigo-900 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition shrink-0
                            ${paymentMethod === 'Card' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-extrabold text-xs">Credit or Debit Card</p>
                            <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">Settle instantly online (Visa / Mastercard)</p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                          ${paymentMethod === 'Card' ? 'border-indigo-500' : 'border-slate-300'}`}
                        >
                          {paymentMethod === 'Card' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* Optional Card details mockup */}
                  {paymentMethod === 'Card' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4 animate-fade-in text-xs font-bold text-slate-700">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-450 uppercase tracking-wider">Card Number</label>
                        <input 
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 outline-none font-semibold text-slate-800"
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-450 uppercase tracking-wider">Expiration Date</label>
                          <input 
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 outline-none font-semibold text-slate-800"
                            placeholder="MM / YY"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-450 uppercase tracking-wider">CVC Code</label>
                          <input 
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 outline-none font-semibold text-slate-800"
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setIsCheckingOut(false)}
                      className="text-xs font-bold text-slate-505 hover:text-slate-800 transition cursor-pointer flex items-center gap-1.5 py-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Shopping Cart
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Side: Order Summary Card */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-850 border-b border-slate-100 pb-4 mb-4">Order Summary</h3>
                <div className="flex justify-between items-center text-slate-550 mb-3.5 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Subtotal</span>
                  </div>
                  <span className="font-extrabold text-slate-800">Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-550 mb-6 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span>Shipping</span>
                  </div>
                  <span className="text-emerald-650 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 text-[10px]">Free Delivery</span>
                </div>
                <div className="flex justify-between items-center text-base font-black text-slate-800 border-t border-slate-100 pt-4 mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-4.5 h-4.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Total Due</span>
                  </div>
                  <span className="text-lg text-indigo-600 font-black">Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {!isCheckingOut ? (
                  <button 
                    onClick={() => {
                      setIsCheckingOut(true);
                      setError('');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl transition duration-200 shadow cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <button 
                    type="submit"
                    form="checkout-form"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl transition duration-200 shadow cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {paymentMethod === 'PayOnDelivery' ? 'Place Order (Pay on Delivery)' : 'Place Order via Card'}
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
