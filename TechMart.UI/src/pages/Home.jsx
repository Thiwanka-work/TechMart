import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    
    // Auto-slide every 5 seconds
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 4 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(slideTimer);
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
      {/* Hero Banner Carousel */}
      <section className="relative w-full h-[500px] overflow-hidden bg-slate-900 border-b border-slate-200">
        {/* Slides */}
        <div 
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ width: '500%', transform: `translateX(-${currentSlide * 20}%)` }}
        >
          {/* Slide 1 */}
          <div className="w-1/5 relative h-full">
            <img src="/images/banners/hero_banner_1.png" alt="Developer Setup" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col items-center justify-center text-center px-6">
              <span className="inline-block bg-blue-500/20 text-blue-300 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border border-blue-400/30 mb-4 backdrop-blur-sm">
                Professional Tech Gadgets
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-4 shadow-sm">
                Elevate Your Workspace
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium mb-6 shadow-sm">
                Discover a curated marketplace of professional-grade developer hardware and elite desk accessories.
              </p>
              <Link to="/products" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition duration-250">
                Browse Catalog
              </Link>
            </div>
          </div>
          
          {/* Slide 2 */}
          <div className="w-1/5 relative h-full">
            <img src="/images/banners/hero_banner_2.png" alt="Smart Devices" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col items-center justify-center text-center px-6">
              <span className="inline-block bg-purple-500/20 text-purple-300 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border border-purple-400/30 mb-4 backdrop-blur-sm">
                Latest Innovations
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-4 shadow-sm">
                Next-Gen Smart Devices
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium mb-6 shadow-sm">
                Stay connected and ahead of the curve with our premium selection of smartphones and wearables.
              </p>
              <Link to="/products?category=Phones" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition duration-250">
                Shop Phones
              </Link>
            </div>
          </div>

          {/* Slide 3 */}
          <div className="w-1/5 relative h-full">
            <img src="/images/banners/hero_banner_3.png" alt="Audio Equipment" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col items-center justify-center text-center px-6">
              <span className="inline-block bg-amber-500/20 text-amber-300 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border border-amber-400/30 mb-4 backdrop-blur-sm">
                Premium Audio
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-4 shadow-sm">
                Immersive Soundscapes
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium mb-6 shadow-sm">
                Experience unparalleled audio clarity with our top-tier noise-canceling headphones and speakers.
              </p>
              <Link to="/products?category=Audio" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition duration-250">
                Explore Audio
              </Link>
            </div>
          </div>
          
          {/* Slide 4 */}
          <div className="w-1/5 relative h-full">
            <img src="/images/banners/hero_banner_4.png" alt="Gaming Setup" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col items-center justify-center text-center px-6">
              <span className="inline-block bg-red-500/20 text-red-300 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border border-red-400/30 mb-4 backdrop-blur-sm">
                Pro Gaming Gear
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-4 shadow-sm">
                Unleash Your Potential
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium mb-6 shadow-sm">
                Dominate the competition with our top-tier gaming laptops, monitors, and precision peripherals.
              </p>
              <Link to="/products?category=Accessories" className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition duration-250">
                Level Up Now
              </Link>
            </div>
          </div>

          {/* Slide 5 */}
          <div className="w-1/5 relative h-full">
            <img src="/images/banners/hero_banner_5.png" alt="Photography & Drones" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col items-center justify-center text-center px-6">
              <span className="inline-block bg-teal-500/20 text-teal-300 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border border-teal-400/30 mb-4 backdrop-blur-sm">
                Smart Photography
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-4 shadow-sm">
                Capture the Future
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium mb-6 shadow-sm">
                Explore the world from a new perspective with cutting-edge smart cameras, drones, and accessories.
              </p>
              <Link to="/products" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition duration-250">
                Discover Gear
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-10">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 shadow-md ${currentSlide === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        
        {/* Navigation Arrows */}
        <button 
          onClick={() => setCurrentSlide(prev => (prev === 0 ? 4 : prev - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/60 transition backdrop-blur-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button 
          onClick={() => setCurrentSlide(prev => (prev === 4 ? 0 : prev + 1))}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/60 transition backdrop-blur-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
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
