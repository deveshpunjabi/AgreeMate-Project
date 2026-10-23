'use client';

export default function ProblemSection() {
  const cards = [
    {
      quote: "“Lent my ₹80K DSLR. Came back cracked. He says it was already broken.”",
      author: "Photographer, Mumbai"
    },
    {
      quote: "“Customer left city with my compressor. Zero proof he ever took it.”",
      author: "Hardware Shop Owner, Pune"
    },
    {
      quote: "“Roommate has my laptop for 3 weeks. Can't even ask.”",
      author: "Engineering Student, Bangalore"
    }
  ];

  return (
    <section id="problem" className="bg-transparent relative py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-t from-white/10 via-transparent to-transparent" />
      <div className="container max-w-6xl relative z-10">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 reveal-on-scroll">
          <h2 className="font-display font-normal text-4xl sm:text-5xl md:text-6xl text-[#003a5e] tracking-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
            Every lending story <br className="hidden sm:block" />
            <span className="text-[#0ea5e9]">ends the same way.</span>
          </h2>
          <p className="font-body text-[#1e2c3a]/80 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Without written terms or evidence, lending relies on memory and hope. That's where trust breaks down.
          </p>
        </div>

        {/* Pain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {cards.map((card, idx) => (
            <div 
              key={idx}
              className={`rounded-2xl p-8 border border-hairline bg-white shadow-card hover:shadow-raised hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group reveal-on-scroll reveal-delay-${(idx + 1) * 100}`}
            >
              <div className="text-4xl text-[#0ea5e9]/20 font-serif mb-2 leading-none">"</div>
              <p className="font-body text-[15px] text-[#1e2c3a]/90 font-medium leading-relaxed mb-8">
                {card.quote.replace(/“|”/g, '')}
              </p>
              <div className="font-body text-[10px] font-bold text-[#005080] tracking-widest uppercase">
                — {card.author}
              </div>
            </div>
          ))}
        </div>

        {/* Closing Statements */}
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3 reveal-on-scroll reveal-delay-400">
          <h3 className="font-display font-bold text-xl sm:text-2xl text-[#1e2c3a]/60 tracking-wider uppercase">
            No proof. No record. No recourse.
          </h3>
          <div className="font-display font-normal text-5xl sm:text-6xl text-[#003a5e] tracking-tighter" style={{ letterSpacing: '-0.04em' }}>
            Until now.
          </div>
        </div>

      </div>
    </section>
  );
}
