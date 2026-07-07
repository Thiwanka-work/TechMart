import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartSuccess, setCartSuccess] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const categoryQuery = searchParams.get('category');
    if (categoryQuery !== null) {
      setSelectedCategory(categoryQuery);
    }
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
          const uniqueCats = [...new Set(response.data.map((p) => p.category))];
          setCategories(uniqueCats);
        }
      } catch (catErr) {
        console.error('Failed to load categories, using fallback');
        const uniqueCats = [...new Set(response.data.map((p) => p.category))];
        setCategories(uniqueCats);
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
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        guestCart.push({ productId: product.id, quantity: 1 });
      }
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      setCartSuccess(`"${product.name}" added to guest cart!`);
      setTimeout(() => setCartSuccess(''), 3000);
      return;
    }

    try {
      setCartSuccess('');
      // Match C# backend parameters (ProductId, Quantity)
      await api.post('/cart/items', { productId: product.id, quantity: 1 });
      setCartSuccess(`"${product.name}" added to cart!`);
      setTimeout(() => setCartSuccess(''), 3000);
    } catch (err) {
      alert('Failed to add item to cart.');
    }
  };

  // Filter based on selected category and text search
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="text-center py-16 text-slate-600 font-medium">Loading gadgets catalog...</div>;

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Explore Gadgets</h2>
          <p className="text-slate-500 mt-1">Browse our professional hardware and devices.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 bg-white"
          />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700 font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {cartSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg p-3 text-sm mb-6 max-w-sm ml-auto text-right font-medium">
          {cartSuccess}
        </div>
      )}

      {error && <div className="text-rose-600 text-center font-medium mb-6">{error}</div>}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-medium">No gadgets match your filters.</div>
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
  );
};

export default Products;
