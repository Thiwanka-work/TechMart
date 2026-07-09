import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const categoryQuery = searchParams.get('category');
    if (categoryQuery !== null) setSelectedCategory(categoryQuery);
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      try {
        const catRes = await api.get('/products/categories');
        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data.map(c => c.name));
        } else {
          setCategories([...new Set(response.data.map(p => p.category))]);
        }
      } catch {
        setCategories([...new Set(response.data.map(p => p.category))]);
      }
    } catch (err) {
      setError('Failed to fetch the products catalog.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      const guestCartStr = localStorage.getItem('guestCart') || '[]';
      const guestCart = JSON.parse(guestCartStr);
      const existingItem = guestCart.find(item => item.productId === product.id);
      if (existingItem) existingItem.quantity += 1;
      else guestCart.push({ productId: product.id, quantity: 1 });
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      toast.success(`"${product.name}" added to guest cart!`);
      return;
    }
    try {
      await api.post('/cart/items', { productId: product.id, quantity: 1 });
      toast.success(`"${product.name}" added to cart!`);
    } catch (err) {
      toast.error('Failed to add item to cart.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  /* ── Loading */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-semibold text-sm">Loading gadgets catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── Page header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-800">Explore Gadgets</h1>
              <p className="text-slate-500 text-sm mt-1">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                {selectedCategory && <span className="text-indigo-600 font-semibold"> in {selectedCategory}</span>}
                {search && <span className="text-indigo-600 font-semibold"> for "{search}"</span>}
              </p>
            </div>

            {/* Search bar */}
            <div className="relative w-full md:w-72">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category pill filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedCategory === ''
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                All
              </button>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Product grid */}
      <div className="container mx-auto px-6 py-10">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 text-sm font-semibold mb-6">
            {error}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-slate-700 font-black text-xl mb-2">No products found</h3>
            <p className="text-slate-400 text-sm mb-6">Try adjusting your search or category filter.</p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory(''); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
