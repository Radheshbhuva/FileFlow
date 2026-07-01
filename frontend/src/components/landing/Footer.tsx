import React from 'react';
import { Link } from 'react-router-dom';
import { CloudLightning, Heart } from 'lucide-react';

export default function Footer() {
  const footerLinks = [
    {
      title: 'Product',
      items: [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Security Center', href: '#security' },
        { name: 'Pricing Plans', href: '#pricing' }
      ]
    },
    {
      title: 'Resources',
      items: [
        { name: 'Documentation', href: '#' },
        { name: 'API Reference', href: '#' },
        { name: 'System Status', href: '#' },
        { name: 'Developer Guide', href: '#' }
      ]
    },
    {
      title: 'Security',
      items: [
        { name: 'Compliance Info', href: '#' },
        { name: 'GDPR Data Processing', href: '#' },
        { name: 'Zero-Knowledge FAQ', href: '#' },
        { name: 'Report Vulnerability', href: '#' }
      ]
    },
    {
      title: 'Company',
      items: [
        { name: 'About Us', href: '#' },
        { name: 'Engineering Blog', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Press Kit', href: '#' }
      ]
    },
    {
      title: 'Legal',
      items: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Cookie Policy', href: '#' },
        { name: 'Service Level Agreement', href: '#' }
      ]
    }
  ];

  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Sitemap */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          {/* Logo & Tagline */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
                <CloudLightning className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">FileFlow</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 max-w-xs">
              A Nest for File Securing &amp; Sharing Across Teams and Various Platforms. Built for high-speed, high-durability enterprise workloads.
            </p>
            {/* Social Links */}
            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-450 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-450 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Map lists */}
          {footerLinks.map((section, idx) => (
            <div key={idx} className="space-y-4 col-span-1">
              <h3 className="text-[11px] font-bold text-slate-450 uppercase tracking-widest">{section.title}</h3>
              <ul className="space-y-2 text-xs">
                {section.items.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a
                      href={link.href}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-600 gap-4">
          <p>© {new Date().getFullYear()} FileFlow Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-indigo-500 fill-current" /> for security compliance.
          </p>
        </div>

      </div>
    </footer>
  );
}
