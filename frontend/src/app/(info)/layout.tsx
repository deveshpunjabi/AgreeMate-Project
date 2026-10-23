'use client';

import Navbar from '../../components/sections/Navbar';
import Footer from '../../components/sections/Footer';

export default function InfoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-transparent pt-28">
        {children}
      </main>
      <Footer />
    </>
  );
}
