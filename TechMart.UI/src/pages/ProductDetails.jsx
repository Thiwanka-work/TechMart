import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError('Product details could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      const guestCartStr = localStorage.getItem('guestCart') || '[]';
      const guestCart = JSON.parse(guestCartStr);
      const existingItem = guestCart.find(item => item.productId === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        guestCart.push({ productId: product.id, quantity: 1 });
      }
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      setSuccess('Item successfully added to your guest cart!');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }

    try {
      setSuccess('');
      await api.post('/cart/items', { productId: product.id, quantity: 1 });
      setSuccess('Item successfully added to cart!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to add item to cart.');
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-600 font-medium">Loading gadget details...</div>;
  if (error || !product) return <div className="text-center py-16 text-rose-600 font-medium">{error || 'Product not found.'}</div>;

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <img 
            src={product.imageUrl || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'} 
            alt={product.name} 
            className="w-full h-96 object-cover rounded-xl border border-slate-100"
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-between">
          <div>
            <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              {product.category}
            </span>
            <h2 className="text-3xl font-black text-slate-800 mt-3 mb-2">{product.name}</h2>
            <p className="text-slate-600 leading-relaxed mb-6">{product.description || 'No description provided.'}</p>
            
            <div className="flex items-center justify-between py-4 border-y border-slate-100 mb-6">
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Price</p>
                <p className="text-3xl font-black text-indigo-600">Rs. {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Stock Status</p>
                <p className={`text-sm font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {product.stock > 0 ? `${product.stock} Units Available` : 'Out of Stock'}
                </p>
              </div>
            </div>
          </div>

          <div>
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg p-3 text-sm mb-4 font-medium">
                {success}
              </div>
            )}
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {product.stock > 0 ? 'Add to Shopping Cart' : 'Temporarily Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
