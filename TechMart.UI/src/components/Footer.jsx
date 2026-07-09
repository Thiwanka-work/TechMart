import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 mt-auto">
      {/* Main footer grid */}
      <div className="container mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand Column */}
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 mb-4 group">
            <img
              src="/logo.png"
              alt="TechMart Logo"
              className="h-9 w-9 object-contain rounded-xl border border-slate-700 bg-white p-0.5 shadow group-hover:scale-105 transition duration-200"
            />
            <span className="text-lg font-black tracking-widest bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              TECHMART
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-slate-500 mb-5">
            Sri Lanka's premium online destination for the latest tech gadgets, developer gear, and smart accessories.
          </p>
          {/* Social Icons */}
          <div className="flex gap-3">
            {[
              { label: 'Facebook', href: '#', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
              { label: 'Instagram', href: '#', path: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z' },
              { label: 'Twitter/X', href: '#', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-9 h-9 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Shop Links */}
        <div>
          <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'All Products', to: '/products' },
              { label: 'Laptops & Computers', to: '/products?category=Laptops' },
              { label: 'Smartphones', to: '/products?category=Smartphones' },
              { label: 'Accessories', to: '/products?category=Accessories' },
              { label: 'Smart Wearables', to: '/products?category=Wearables' },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-slate-500 hover:text-white transition duration-150 flex items-center gap-1.5 group"
                >
                  <span className="w-1 h-1 bg-slate-700 group-hover:bg-indigo-500 rounded-full transition duration-150"></span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account Links */}
        <div>
          <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-4">Account</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'Login', to: '/login' },
              { label: 'Register', to: '/register' },
              { label: 'My Orders', to: '/orders' },
              { label: 'Shopping Cart', to: '/cart' },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-slate-500 hover:text-white transition duration-150 flex items-center gap-1.5 group"
                >
                  <span className="w-1 h-1 bg-slate-700 group-hover:bg-indigo-500 rounded-full transition duration-150"></span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <svg className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-slate-500 leading-snug">Colombo 07, Western Province, Sri Lanka</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:support@techmart.lk" className="text-slate-500 hover:text-indigo-400 transition">
                support@techmart.lk
              </a>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href="tel:+94112345678" className="text-slate-500 hover:text-indigo-400 transition">
                +94 11 234 5678
              </a>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-500">Mon – Sat: 9AM – 6PM</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p>© {year} <span className="text-slate-400 font-semibold">TechMart</span>. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-700">Made with ❤️ in Sri Lanka 🇱🇰</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-slate-600">All systems operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
