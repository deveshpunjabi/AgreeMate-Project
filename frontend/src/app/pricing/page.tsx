'use client';

import Navbar from '@/components/sections/Navbar';
import Pricing from '@/components/sections/Pricing';
import Footer from '@/components/sections/Footer';
import MeshBackground from '@/components/ui/MeshBackground';

export default function PricingPage() {
  return (
    <>
      <MeshBackground />
      <Navbar />
      
      <main className="flex-1 bg-transparent pt-28 pb-16 min-h-screen">
        <Pricing />
      </main>
      
      <Footer />
    </>
  );
}
