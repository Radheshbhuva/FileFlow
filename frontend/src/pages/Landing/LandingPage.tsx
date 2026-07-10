import React, { useEffect } from 'react';
import Navbar from '../../components/landing/Navbar';
import HeroSection from '../../components/landing/HeroSection';
import ProblemSection from '../../components/landing/ProblemSection';
import HowItWorksSection from '../../components/landing/HowItWorksSection';
import FeaturesSection from '../../components/landing/FeaturesSection';
import ProductShowcase from '../../components/landing/ProductShowcase';
import SecuritySection from '../../components/landing/SecuritySection';
import WorkspaceSyncSection from '../../components/landing/WorkspaceSyncSection';
import ComparisonSection from '../../components/landing/ComparisonSection';
import FutureVisionSection from '../../components/landing/FutureVisionSection';
import CTASection from '../../components/landing/CTASection';
import Footer from '../../components/landing/Footer';

export default function LandingPage() {
  // Update document title for SEO on mount
  useEffect(() => {
    document.title = 'FileFlow — Secure File Securing & Sharing Workspace';
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden antialiased">
      {/* 1. Navigation Bar */}
      <Navbar />

      {/* Main page content sections */}
      <main>
        {/* 2. Hero Section & Interactive Visual */}
        <HeroSection />

        {/* 3. The Problem Section */}
        <ProblemSection />

        {/* 4. How FileFlow Works (Timeline & Steps) */}
        <HowItWorksSection />

        {/* 5. Bento Grid Core Features Card */}
        <FeaturesSection />

        {/* 6. Product Showcase Live Mockup */}
        <ProductShowcase />

        {/* 8. Security & Trust Section (Interaction Shield) */}
        {/* Note: Section 7 "Why Teams Choose FileFlow" is integrated directly inside Security & Trust features list for maximum conversions. */}
        <SecuritySection />

        {/* 9. Real-Time Workspace Synchronization Preview */}
        <WorkspaceSyncSection />

        {/* 10. Comparison Details Grid */}
        <ComparisonSection />

        {/* 11. Futuristic Product Roadmap */}
        <FutureVisionSection />

        {/* 12. Final CTA Conversions Module */}
        <CTASection />
      </main>

      {/* 13. Professional Multi-Column Sitemap Footer */}
      <Footer />
    </div>
  );
}
