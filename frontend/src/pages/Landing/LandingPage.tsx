import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';
import HeroSection from '../../components/landing/HeroSection';
import CallToAction from '../../components/landing/CallToAction';
import SocialProofMetrics from '../../components/landing/SocialProofMetrics';
import HowItWorksTimeline from '../../components/landing/HowItWorksTimeline';
import SecurityBenefits from '../../components/landing/SecurityBenefits';
import DashboardMockup from '../../components/landing/DashboardMockup';
import PricingPreview from '../../components/landing/PricingPreview';
import FAQAccordion from '../../components/landing/FAQAccordion';

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <HeroSection />

        <SocialProofMetrics />
        <HowItWorksTimeline />
        <SecurityBenefits />
        <DashboardMockup />
        <PricingPreview />
        <FAQAccordion />

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;
