'use client';

export default function TrustMarquee() {
  const stats = [
    '2,500+ Agreements',
    '₹1.2Cr Items Protected',
    '4.9★ App Store Rating',
    '500+ Active Students',
    '200+ Registered Businesses',
    'Zero Disputes Lost'
  ];

  // Double the array for seamless scrolling
  const marqueeItems = [...stats, ...stats];

  return (
    <div className="w-full bg-white border-y border-hairline py-4 overflow-hidden relative select-none">
      <div className="flex w-max items-center animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
        {marqueeItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 px-4">
            <span className="font-body font-medium text-sm text-muted whitespace-nowrap tracking-wide uppercase">
              {item}
            </span>
            <span className="text-primary/40 font-serif text-sm">◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}
