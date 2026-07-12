import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

/* ─── Description parser ─────────────────────────────────────── */
function parseDescription(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        overview: parsed.overview || '',
        features: Array.isArray(parsed.features) ? parsed.features : [],
        specs: parsed.specs && typeof parsed.specs === 'object'
          ? Object.entries(parsed.specs)
          : [],
        inBox: Array.isArray(parsed.inBox) ? parsed.inBox : [],
        isStructured: true,
      };
    }
  } catch (_) {}
  return { overview: raw, features: [], specs: [], inBox: [], isStructured: false };
}

/* ── Tab definitions ──────────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',  label: 'Overview',       icon: '📝' },
  { id: 'features',  label: 'Features',        icon: '⚡' },
  { id: 'specs',     label: 'Specifications',  icon: '📋' },
  { id: 'inBox',     label: "In the Box",      icon: '📦' },
  { id: 'reviews',   label: "Reviews",         icon: '⭐' },
];

/* ─── Main Component ─────────────────────────────────────────── */
const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Reviews States
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/${id}`);
      setReviews(response.data);
    } catch (err) {
      console.error("Failed to load reviews", err);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      const data = response.data;
      setProduct(data);
      setActiveImage(data.imageUrl);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    } catch (err) {
      setError('Product details could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }
    try {
      setReviewsLoading(true);
      await api.post('/reviews', { 
        productId: parseInt(id), 
        rating, 
        comment,
        reviewerName: user ? undefined : reviewerName 
      });
      toast.success("Review submitted successfully!");
      setComment('');
      setReviewerName('');
      fetchReviews();
      window.dispatchEvent(new CustomEvent('reviews:updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    if (!user) {
      const guestCartStr = localStorage.getItem('guestCart') || '[]';
      const guestCart = JSON.parse(guestCartStr);
      const existingItem = guestCart.find(
        item => item.productId === product.id && item.variant === selectedVariant
      );
      if (existingItem) existingItem.quantity += 1;
      else guestCart.push({ productId: product.id, quantity: 1, variant: selectedVariant });
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      toast.success('Added to guest cart!');
      window.dispatchEvent(new CustomEvent('martbuddy:excite'));
      window.dispatchEvent(new CustomEvent('cart:updated'));
      setAddingToCart(false);
      return;
    }
    try {
      await api.post('/cart/items', { productId: product.id, quantity: 1, variant: selectedVariant });
      toast.success(`"${product.name}" added to cart!`);
      window.dispatchEvent(new CustomEvent('martbuddy:excite'));
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (err) {
      toast.error('Failed to add item to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleImageSelect = (img, idx) => {
    setActiveImage(img);
    setActiveImageIndex(idx);
  };

  /* ── Loading state */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-semibold text-sm">Loading product details...</p>
        </div>
      </div>
    );
  }

  /* ── Error state */
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p className="text-slate-700 font-bold text-lg">{error || 'Product not found.'}</p>
          <Link to="/products" className="mt-4 inline-block text-indigo-600 font-semibold text-sm hover:underline">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  /* ── Data prep */
  const allImages = [
    product.imageUrl,
    ...(Array.isArray(product.additionalImages) ? product.additionalImages : [])
  ].filter(Boolean);

  const desc = parseDescription(product.description);
  const inStock = product.stock > 0;

  // Only show tabs that have content
  const visibleTabs = TABS.filter(t => {
    if (t.id === 'reviews') return true;
    if (!desc.isStructured) return t.id === 'overview';
    if (t.id === 'overview')  return !!desc.overview;
    if (t.id === 'features')  return desc.features.length > 0;
    if (t.id === 'specs')     return desc.specs.length > 0;
    if (t.id === 'inBox')     return desc.inBox.length > 0;
    return false;
  });

  // Auto-select first valid tab
  const safeTab = visibleTabs.find(t => t.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id || 'overview');

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4">

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto mb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          <Link to="/products" className="hover:text-indigo-600 transition">Products</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          <span className="text-slate-600 font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ═══════════════════════════════════════════════════════════
            TOP CARD — Image + Core Info
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">

            {/* ─── LEFT: Image Gallery ─── */}
            <div className="lg:w-[50%] bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8 flex flex-col gap-4">

              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm group"
                   style={{ aspectRatio: '1/1' }}>
                <img
                  key={activeImage}
                  src={activeImage || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  style={{ animation: 'imgFadeIn 0.3s ease' }}
                />

                {!inStock && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-rose-500 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
                      Out of Stock
                    </span>
                  </div>
                )}

                {/* Arrow nav */}
                {allImages.length > 1 && (
                  <>
                    <button onClick={() => { const p = (activeImageIndex - 1 + allImages.length) % allImages.length; handleImageSelect(allImages[p], p); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button onClick={() => { const n = (activeImageIndex + 1) % allImages.length; handleImageSelect(allImages[n], n); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    <div className="absolute bottom-3 right-3 bg-slate-900/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {activeImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail grid — fixed 5-per-row, square aspect */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleImageSelect(img, idx)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-indigo-500 shadow-md shadow-indigo-100 scale-95'
                          : 'border-transparent opacity-55 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ─── RIGHT: Product Info ─── */}
            <div className="lg:w-[50%] p-6 lg:p-8 flex flex-col justify-between">
              <div>
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-indigo-100">
                    {product.category}
                  </span>
                  {inStock ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-emerald-100">
                      ✓ In Stock
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-600 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-rose-100">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Product name */}
                <h1 className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight mb-4">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-3xl font-black text-indigo-600">
                    Rs. {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="h-px bg-slate-100 mb-5" />

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2.5">Select Variant</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                            selectedVariant === v
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {selectedVariant && (
                      <p className="text-[11px] text-slate-400 mt-2 font-semibold">
                        Selected: <span className="text-indigo-600 font-bold">{selectedVariant}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Stock indicator */}
                {inStock && (
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-xs text-slate-500 font-semibold">
                      <span className="text-emerald-600 font-black">{product.stock}</span> units available
                    </p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || addingToCart}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 ${
                    inStock && !addingToCart
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {addingToCart ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : inStock ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                      Add to Shopping Cart
                    </>
                  ) : 'Temporarily Out of Stock'}
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                  </svg>
                  Free delivery island-wide
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            BOTTOM CARD — Tabbed Description
        ════════════════════════════════════════════════════════════ */}
        {desc && visibleTabs.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {visibleTabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-black whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                    safeTab === t.id
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6 lg:p-8">

              {/* Overview */}
              {safeTab === 'overview' && (
                <div className="max-w-3xl">
                  <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                    {desc.overview || 'No description available.'}
                  </p>
                </div>
              )}

              {/* Features */}
              {safeTab === 'features' && desc.features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
                  {desc.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3">
                      <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <span className="text-slate-700 text-sm font-medium leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Specifications */}
              {safeTab === 'specs' && desc.specs.length > 0 && (
                <div className="max-w-2xl border border-slate-100 rounded-2xl overflow-hidden">
                  {desc.specs.map(([key, val], i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 px-5 py-3.5 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                    >
                      <span className="text-slate-400 text-xs font-black uppercase tracking-wider w-36 flex-shrink-0">
                        {key}
                      </span>
                      <span className="text-slate-800 text-sm font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* In the Box */}
              {safeTab === 'inBox' && desc.inBox.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
                  {desc.inBox.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                      <span className="text-xl">📦</span>
                      <span className="text-slate-700 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {safeTab === 'reviews' && (
                <div className="space-y-8">
                  {/* Reviews Summary Header */}
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <div className="text-center md:text-left flex-shrink-0">
                      <p className="text-xs text-slate-450 uppercase tracking-wider font-bold mb-1">Average Rating</p>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="text-4xl font-black text-slate-800">
                          {reviews.length > 0 
                            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                            : '0.0'}
                        </span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const avg = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
                            return (
                              <svg key={i} className={`w-6 h-6 ${i < Math.round(avg) ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">Based on {reviews.length} product reviews</p>
                    </div>

                    <div className="hidden md:block w-px h-16 bg-slate-200" />

                    <div className="flex-1 w-full space-y-1.5 text-xs text-slate-600 font-semibold">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const stars = 5 - idx;
                        const count = reviews.filter(r => r.rating === stars).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-3 w-full">
                            <span className="w-10 text-right">{stars} star</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-slate-400 font-bold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Customer Reviews ({reviews.length})</h4>
                    {reviews.length === 0 ? (
                      <p className="text-slate-500 text-sm italic py-4">No reviews yet for this product. Be the first to share your experience!</p>
                    ) : (
                      <div className="divide-y divide-slate-100 space-y-4">
                        {reviews.map((r) => (
                          <div key={r.id} className="pt-4 first:pt-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-extrabold text-slate-800 text-sm block">{r.reviewerName}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{new Date(r.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <svg key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-600 text-xs leading-normal whitespace-pre-wrap">{r.comment || "No comment provided."}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Review Form */}
                  <div className="border-t border-slate-100 pt-6">
                    <form onSubmit={handleSubmitReview} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 max-w-xl">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                        {user && reviews.some(r => r.reviewerName === user.fullName || r.reviewerName === user.name) 
                          ? 'Update Your Review' 
                          : 'Write a Customer Review'}
                      </h4>
                      
                      {/* Name Input (For Guests Only) */}
                      {!user && (
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-455 uppercase tracking-wider font-bold">Your Name</label>
                          <input
                            type="text"
                            required
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 outline-none font-semibold text-slate-800 text-xs"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                      )}

                      {/* Rating Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Your Rating</label>
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const starVal = i + 1;
                            return (
                              <button
                                type="button"
                                key={i}
                                onClick={() => setRating(starVal)}
                                className="text-amber-400 hover:scale-110 transition cursor-pointer"
                              >
                                <svg className={`w-8 h-8 ${starVal <= rating ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comment Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Feedback Details</label>
                        <textarea
                          required
                          rows={4}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 outline-none font-semibold text-slate-800 text-xs"
                          placeholder="Share your experience using this gadget..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={reviewsLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase px-6 py-2.5 rounded-xl shadow transition duration-200 cursor-pointer disabled:opacity-50"
                      >
                        {reviewsLoading ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes imgFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;
