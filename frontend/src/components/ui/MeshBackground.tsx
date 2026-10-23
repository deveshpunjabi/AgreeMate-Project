'use client';

import React from 'react';

export default function MeshBackground() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-canvas">
      {/* Slow-moving gradient blobs — transform-only animation (GPU composited, no blur/repaint) */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-[#0068a3]/[0.045] animate-[meshFloat1_20s_infinite_ease-in-out]"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute top-[30%] right-[-8%] w-[40vw] h-[40vw] rounded-full bg-[#0ea5e9]/[0.035] animate-[meshFloat2_25s_infinite_ease-in-out]"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute bottom-[-8%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-[#6366f1]/[0.03] animate-[meshFloat3_22s_infinite_ease-in-out]"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
