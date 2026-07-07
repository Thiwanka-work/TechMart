import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition duration-200 bg-white flex flex-col justify-between h-full">
      <div>
        <Link to={`/products/${product.id}`} className="block group">
          <img 
            src={product?.imageUrl || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80'} 
            alt={product?.name || 'Gadget'} 
            className="w-full h-48 object-cover rounded-lg mb-4 group-hover:scale-[1.02] transition duration-200" 
          />
          <h3 className="font-semibold text-lg text-slate-800 group-hover:text-indigo-600 transition duration-150">
            {product?.name || 'Gadget'}
          </h3>
          <p className="text-slate-500 text-sm mt-1 mb-2 line-clamp-2">{product?.description || 'A smart tech gadget.'}</p>
        </Link>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
        <span className="text-lg font-bold text-indigo-600">Rs. {product?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart();
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-sm hover:shadow cursor-pointer"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
