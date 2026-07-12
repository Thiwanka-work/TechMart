import React from 'react';
import { Link } from 'react-router-dom';

// Parse first line of description for display (handles JSON or plain text)
function getShortDescription(raw) {
  if (!raw) return 'A premium tech gadget.';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.overview) return parsed.overview;
    if (parsed && Array.isArray(parsed.features) && parsed.features.length > 0) {
      return parsed.features.slice(0, 2).join(' · ');
    }
  } catch (_) {}
  return raw;
}

const ProductCard = ({ product, onAddToCart }) => {
  const shortDesc = getShortDescription(product?.description);

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">

      {/* Image area */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden bg-slate-50" style={{ aspectRatio: '4/3' }}>
        <img
          src={product?.imageUrl || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80'}
          alt={product?.name || 'Gadget'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Category badge */}
        {product?.category && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
            {product.category}
          </span>
        )}
        {/* Out of stock overlay */}
        {product?.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-slate-800 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content area */}
      <div className="flex flex-col flex-1 p-4">
        <Link to={`/products/${product.id}`} className="block flex-1">
          <h3 className="font-black text-slate-800 text-sm leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {product?.name || 'Gadget'}
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {shortDesc}
          </p>
        </Link>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Price</p>
            <span className="text-lg font-black text-indigo-600">
              Rs. {product?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (product?.stock === 0) return;
              onAddToCart();
              window.dispatchEvent(new CustomEvent('martbuddy:excite'));
              window.dispatchEvent(new CustomEvent('cart:updated'));
            }}
            disabled={product?.stock === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ${
              product?.stock === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md cursor-pointer active:scale-95'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            {product?.stock === 0 ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
