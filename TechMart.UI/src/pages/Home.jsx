import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      
      try {
        const catResponse = await api.get('/products/categories');
        if (catResponse.data && catResponse.data.length > 0) {
          setCategories(catResponse.data);
        } else {
          const uniqueCats = [...new Set(response.data.map((p) => p.category))];
          setCategories(uniqueCats.map(name => ({ name, imageUrl: '' })));
        }
      } catch (catErr) {
        console.error('Failed to fetch categories, using fallbacks');
        const uniqueCats = [...new Set(response.data.map((p) => p.category))];
        setCategories(uniqueCats.map(name => ({ name, imageUrl: '' })));
      }
    } catch (err) {
      console.error('Failed to load home page products.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
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
      alert(`"${product.name}" added to guest cart!`);
      return;
    }

    try {
      await api.post('/cart/items', { productId: product.id, quantity: 1 });
      alert(`"${product.name}" added to cart!`);
    } catch (err) {
      alert('Failed to add item to cart.');
    }
  };

  // Setup visual categories lists (famous categories fallback if database is empty)
  const defaultCategories = [
    { name: 'Laptops', imageUrl: '' },
    { name: 'Phones', imageUrl: '' },
    { name: 'Accessories', imageUrl: '' },
    { name: 'Audio', imageUrl: '' }
  ];
  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  // Split products into top products (first 4) and best sellers (next 4)
  const topProducts = products.slice(0, 4);
  const bestSellers = products.slice(4, 8);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Banner */}
      <section className="bg-white border-b border-slate-200 py-16 px-6 text-center shadow-sm">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-sm border border-blue-100">
            Professional Tech Gadget Store
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Elevate Your Setup with <span className="bg-gradient-to-r from-blue-600 to-purple-650 bg-clip-text text-transparent tracking-wide font-black">TECHMART</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Discover a curated marketplace of professional-grade developer hardware, smart gadgets, and elite desk accessories designed to maximize your productivity.
          </p>
          <div className="pt-2">
            <Link 
              to="/products" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition duration-250 inline-block cursor-pointer"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Famous Device Categories */}
      <section className="container mx-auto py-12 px-6">
        <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Famous Device Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {displayCategories.map((cat, idx) => (
            <Link 
              key={idx}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-lg rounded-2xl p-6 text-center transition duration-200 cursor-pointer group flex flex-col items-center justify-center min-h-[190px]"
            >
              {cat.imageUrl ? (
                <img 
                  src={cat.imageUrl} 
                  alt={cat.name} 
                  className="w-20 h-20 object-cover rounded-xl mb-4 border border-slate-100 group-hover:scale-110 transition duration-200 shadow-sm" 
                />
              ) : (
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <h3 className="font-black text-slate-800 text-sm tracking-wide uppercase">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="text-center py-16 text-slate-500 font-medium">Loading catalog showcases...</div>
      ) : (
        <>
          {products.length === 0 ? (
            <section className="container mx-auto py-12 px-6 text-center">
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-12 max-w-2xl mx-auto px-4 shadow-sm">
                <p className="text-slate-500 font-semibold text-lg">No gadgets registered in database yet.</p>
                <p className="text-slate-400 text-sm mt-1 mb-4">Please log in as an administrator to publish products.</p>
              </div>
            </section>
          ) : (
            <>
              {/* Top Products Showcase */}
              <section className="container mx-auto py-12 px-6 border-t border-slate-200">
                <h2 className="text-2xl font-black text-slate-850 mb-8">Top Featured Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {topProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={() => handleAddToCart(product)} 
                    />
                  ))}
                </div>
              </section>

              {/* Best Selling Products Showcase */}
              {bestSellers.length > 0 && (
                <section className="container mx-auto py-12 px-6 border-t border-slate-200">
                  <h2 className="text-2xl font-black text-slate-850 mb-8">Best Selling Products</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {bestSellers.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={() => handleAddToCart(product)} 
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
