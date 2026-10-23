'use client';

import Navbar from '../components/sections/Navbar';
import Hero from '../components/sections/Hero';
import TrustMarquee from '../components/sections/TrustMarquee';
import ProblemSection from '../components/sections/ProblemSection';
import HowItWorks from '../components/sections/HowItWorks';
import FeaturesGrid from '../components/sections/FeaturesGrid';
import TargetAudience from '../components/sections/TargetAudience';
import Testimonials from '../components/sections/Testimonials';
import FAQ from '../components/sections/FAQ';
import FinalCTA from '../components/sections/FinalCTA';
import Footer from '../components/sections/Footer';
import MeshBackground from '../components/ui/MeshBackground';
import ScrollReveal from '../components/ui/ScrollReveal';

export default function Home() {
  return (
    <>
      <MeshBackground />
      <ScrollReveal />
      <Navbar />
      
      {/* Fullscreen Hero Section */}
      <Hero />

      {/* Scrollable Sections */}
      <main className="flex-1 bg-transparent">
        <TrustMarquee />
        <ProblemSection />
        <HowItWorks />
        <FeaturesGrid />
        <TargetAudience />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>

      
      <Footer />
    </>
  );
}
