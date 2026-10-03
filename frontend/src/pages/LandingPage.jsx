import LandingNavbar    from '../components/landing/LandingNavbar';
import HeroSection      from '../components/landing/HeroSection';
import FeaturesSection  from '../components/landing/FeaturesSection';
import HowItWorks       from '../components/landing/HowItWorks';
import WhyUs            from '../components/landing/WhyUs';
import CTASection       from '../components/landing/CTASection';
import LandingFooter    from '../components/landing/LandingFooter';
import '../components/landing/landing.css';

export default function LandingPage() {
  return (
    <div className="landing">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <WhyUs />
      <CTASection />
      <LandingFooter />
    </div>
  );
}