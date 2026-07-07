import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 mt-auto border-t border-slate-800">
      <div className="container mx-auto text-center text-sm">
        <p className="font-semibold text-slate-300">TechMart - Tech Gadget Store</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} TechMart. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
