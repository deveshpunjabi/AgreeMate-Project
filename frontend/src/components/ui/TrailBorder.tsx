'use client';

import React from 'react';

interface TrailBorderProps {
  children?: React.ReactNode;
  className?: string;
  /** The color of the orbiting trail comet */
  accentColor?: string;
  /** Border radius in px */
  borderRadius?: number;
  /** Border width in px */
  borderWidth?: number;
  /** Trail size in container-query-inline units */
  trailSize?: number;
  /** Full-orbit duration in seconds */
  speed?: number;
  /** Fallback border color behind the trail */
  borderColor?: string;
  /** Background color of the content area */
  contentBg?: string;
}

const TrailBorder: React.FC<TrailBorderProps> = ({
  children,
  className = '',
  accentColor = '#0ea5e9',
  borderRadius = 9999,
  borderWidth = 1.5,
  trailSize = 20,
  speed = 3,
  borderColor = 'rgba(255,255,255,0.12)',
  contentBg = 'rgba(255,255,255,0.08)',
}) => {
  return (
    <div
      className={`trail-border ${className}`}
      style={
        {
          '--tb-accent': accentColor,
          '--tb-radius': `${borderRadius}px`,
          '--tb-border-width': `${borderWidth}`,
          '--tb-trail-size': `${trailSize}`,
          '--tb-speed': `${speed}s`,
          '--tb-border-color': borderColor,
          '--tb-content-bg': contentBg,
        } as React.CSSProperties
      }
    >
      <div className="trail-border__edge">
        <div className="trail-border__trail" />
      </div>
      <div className="trail-border__content">{children}</div>
    </div>
  );
};

export default TrailBorder;
