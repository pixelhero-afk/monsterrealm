/**
 * Google AdSense Responsive Banner Component
 * Client ID: ca-pub-4830085697771892
 * Renders a responsive high-fantasy ad container with Google AdSense unit.
 */

import React, { useEffect, useRef } from 'react';

interface GoogleAdSenseBannerProps {
  slotId?: string;
  className?: string;
}

export const GoogleAdSenseBanner: React.FC<GoogleAdSenseBannerProps> = ({
  slotId,
  className = '',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushedRef = useRef<boolean>(false);

  useEffect(() => {
    // Only attempt to push the ad once per mount to prevent AdSense duplicate push warnings
    if (isPushedRef.current) return;

    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        isPushedRef.current = true;
      }
    } catch (err) {
      // Benign catch for ad-blockers or sandbox environments where Google AdSense script might be blocked
      console.log('[AdSense Notice] Ad init skipped or blocked:', err);
    }
  }, []);

  return (
    <div
      className={`bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-xs overflow-hidden ${className}`}
    >
      {/* Banner Label Header */}
      <div className="flex flex-wrap items-center justify-between w-full gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="bg-[#1E1F24] text-white px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-black uppercase tracking-wider font-mono shadow-2xs">
            GOOGLE ADSENSE
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-[#5C4A34]">
            Sponsored Banner / Google Adsense Placement (Responsive 970×90 Slot)
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#8C765C] uppercase tracking-widest hidden sm:inline">
          ca-pub-4830085697771892
        </span>
      </div>

      {/* Ad Unit Container */}
      <div className="w-full min-h-[90px] flex items-center justify-center overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: '90px' }}
          data-ad-client="ca-pub-4830085697771892"
          {...(slotId ? { 'data-ad-slot': slotId } : {})}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
