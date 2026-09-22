/**
 * Battle Map Background & Atmospheric FX Layer
 * Renders data-driven illustrated map backdrops, parallax depth,
 * and ambient elemental particles (embers, spores, bubbles, celestial stars).
 */

import React, { useState, useEffect } from 'react';
import { MapDefinition } from '../../data/maps';
import { mapRegistry } from '../../services/map/mapRegistry';
import { AnimeArenaScenery } from './AnimeArenaScenery';

interface BattleMapBackgroundProps {
  mapDef: MapDefinition;
}

export const BattleMapBackground: React.FC<BattleMapBackgroundProps> = ({ mapDef }) => {
  const [bgUrl, setBgUrl] = useState<string>(mapRegistry.getMapBackgroundUrl(mapDef.id));
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const url = mapRegistry.getMapBackgroundUrl(mapDef.id);
    setBgUrl(url);

    // Test custom image loading
    if (url && (url.startsWith('data:') || url.startsWith('blob:'))) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (active) setImageLoaded(true);
      };
      img.onerror = () => {
        if (active) setImageLoaded(false);
      };
    } else {
      setImageLoaded(false);
    }

    const unsubscribe = mapRegistry.subscribe(() => {
      if (!active) return;
      const updatedUrl = mapRegistry.getMapBackgroundUrl(mapDef.id);
      setBgUrl(updatedUrl);
      if (updatedUrl && (updatedUrl.startsWith('data:') || updatedUrl.startsWith('blob:'))) {
        const testImg = new Image();
        testImg.src = updatedUrl;
        testImg.onload = () => {
          if (active) setImageLoaded(true);
        };
        testImg.onerror = () => {
          if (active) setImageLoaded(false);
        };
      } else {
        setImageLoaded(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [mapDef.id]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Rich Anime Stylized Arena Scenery for each campaign map */}
      <AnimeArenaScenery mapDef={mapDef} />

      {/* 2. Custom User-Uploaded Map Artwork (if configured via Map Manager) */}
      {imageLoaded && bgUrl && (
        <img
          src={bgUrl}
          alt={mapDef.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85 filter contrast-105 brightness-95 transition-opacity duration-700"
        />
      )}

      {/* 3. Subtle Vignette Shadow around edges for combat framing */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/55 pointer-events-none" />
    </div>
  );
};
