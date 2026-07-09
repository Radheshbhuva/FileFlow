import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, CloudLightning, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Security', href: '#security' },
    { name: 'Difference', href: '#difference' },
    { name: 'Future', href: '#future' }
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 py-3 shadow-lg shadow-slate-950/20'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <CloudLightning className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
              FileFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200 px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-white rounded-lg group bg-gradient-to-br from-blue-600 via-indigo-500 to-sky-400 group-hover:from-blue-600 group-hover:via-indigo-500 group-hover:to-sky-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-800"
              style={{ marginBottom: 0, marginRight: 0 }}
            >
              <span className="relative px-5 py-2 transition-all ease-in duration-75 bg-slate-950 rounded-md group-hover:bg-opacity-0">
                Get Started
              </span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-lg"
          >
            <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-lg text-base font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 border-t border-slate-800 flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full text-center py-3 text-base font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold text-center flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
