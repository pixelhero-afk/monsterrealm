/**
 * Monster Realms - News & Patch Notes Modal
 * LiveOps connected: renders published game announcements, patch notes,
 * and event updates directly from the in-game news database.
 */

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  X,
  Sparkles,
  Swords,
  Shield,
  Zap,
  Flame,
  ExternalLink,
  Calendar,
  Gift,
  AlertCircle,
  FileText,
  Edit3,
} from 'lucide-react';
import { ActiveTab } from '../Navbar';
import { NewsItem, NewsCategory } from '../../types';
import { getNewsApi } from '../../services/apiClient';

interface NewsAndUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: ActiveTab) => void;
  onOpenNewsEditor?: () => void;
  isDev?: boolean;
}

const CATEGORY_STYLES: Record<NewsCategory, { bg: string; text: string; border: string }> = {
  MAJOR: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-400' },
  EVENT: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-400' },
  BANNER: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-400' },
  UPDATE: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-400' },
  MAINTENANCE: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-400' },
};

export const NewsAndUpdatesModal: React.FC<NewsAndUpdatesModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenNewsEditor,
  isDev = false,
}) => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getNewsApi()
        .then((res) => {
          if (res?.news && res.news.length > 0) {
            const published = res.news.filter((n) => n.isPublished !== false);
            setNewsList(published.length > 0 ? published : res.news);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch news announcements:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentItem: NewsItem | undefined = newsList[selectedIndex] || newsList[0];
  const catStyle = currentItem
    ? CATEGORY_STYLES[currentItem.category] || CATEGORY_STYLES.UPDATE
    : CATEGORY_STYLES.MAJOR;

  const renderSectionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-4 h-4 text-sky-600" />;
      case 'Swords':
        return <Swords className="w-4 h-4 text-amber-700" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-600" />;
      case 'Gift':
        return <Gift className="w-4 h-4 text-emerald-600" />;
      default:
        return <Zap className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#2E1F0F] bg-[#FAF3E3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FBBF24] border-2 border-[#2E1F0F] flex items-center justify-center shadow-xs">
              <Megaphone className="w-5 h-5 text-[#2E1F0F]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-serif text-[#2E1F0F] tracking-wide">
                NEWS & UPDATES
              </h2>
              <p className="text-xs text-[#78654E] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B45309]" />
                <span>{currentItem?.date || 'Version 1.0 • Updated today'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDev && onOpenNewsEditor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNewsEditor();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Open LiveOps News Editor"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                <span className="hidden sm:inline">Edit News</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#FFFDF9] border-2 border-[#2E1F0F] flex items-center justify-center text-[#2E1F0F] hover:bg-[#FAF6ED] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-bulletin Selector Tabs (if multiple announcements) */}
        {newsList.length > 1 && (
          <div className="px-4 py-2 border-b border-[#EADBBE] bg-[#FAF6ED]/70 flex items-center gap-1.5 overflow-x-auto">
            {newsList.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.UPDATE;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#2E1F0F] text-white shadow-xs'
                      : 'bg-white hover:bg-stone-100 text-[#5C4A34] border border-[#D5C29E]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.category === 'MAJOR'
                        ? 'bg-amber-400'
                        : item.category === 'EVENT'
                        ? 'bg-emerald-400'
                        : 'bg-blue-400'
                    }`}
                  />
                  <span>{item.title.split(':')[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-500 font-bold">
              Loading latest realm bulletins...
            </div>
          ) : currentItem ? (
            <>
              {/* Main Headline Banner */}
              {currentItem.headline ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-50 border-2 border-[#2E1F0F] shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#2E1F0F] text-amber-200 font-mono">
                      {currentItem.headline.badge || currentItem.badgeText || 'ANNOUNCEMENT'}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                      {currentItem.category}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black font-serif text-[#2E1F0F] mt-2">
                    {currentItem.headline.title}
                  </h3>
                  <p className="text-xs text-[#5C4A34] mt-1 leading-relaxed">
                    {currentItem.headline.content}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-100 to-yellow-50 border-2 border-[#2E1F0F]">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                    {currentItem.badgeText || currentItem.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-black font-serif text-[#2E1F0F] mt-2">
                    {currentItem.title}
                  </h3>
                  {currentItem.tagline && (
                    <p className="text-xs text-[#5C4A34] mt-1">{currentItem.tagline}</p>
                  )}
                </div>
              )}

              {/* Dynamic Sections */}
              {currentItem.sections && currentItem.sections.length > 0 ? (
                currentItem.sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-2">
                    <h4 className="text-sm font-black font-serif text-[#2E1F0F] flex items-center gap-2">
                      {renderSectionIcon(section.icon)}
                      <span>{section.title}</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-white border border-[#D5C29E] text-xs text-[#5C4A34] space-y-1.5 leading-relaxed">
                      <p>{section.content}</p>
                      {section.bulletPoints && section.bulletPoints.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-[#4A3722] pt-1">
                          {section.bulletPoints.map((bp, bpIdx) => (
                            <li key={bpIdx}>{bp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback Section */
                <div className="p-4 rounded-xl bg-white border border-[#D5C29E] text-xs text-[#5C4A34]">
                  Welcome to Monster Realms! Keep an eye on this board for patch notes, balance changes, and limited-time realm events.
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-xs text-stone-500">
              No announcements found. Check back later!
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t-2 border-[#2E1F0F] bg-[#FAF3E3] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#78654E]">Monster Realms Turn-Meter Tactical RPG</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigateToTab('PVE');
              }}
              className="px-4 py-2 rounded-xl bg-[#FFFDF9] border-2 border-[#2E1F0F] text-xs font-bold text-[#2E1F0F] hover:bg-[#FAF6ED] cursor-pointer"
            >
              Explore Dungeons
            </button>

            {currentItem?.actionButton ? (
              <button
                onClick={() => {
                  onClose();
                  if (currentItem.actionButton?.targetTab) {
                    onNavigateToTab(currentItem.actionButton.targetTab as ActiveTab);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] border-2 border-[#2E1F0F] text-xs font-black text-[#2E1F0F] cursor-pointer shadow-xs"
              >
                {currentItem.actionButton.label}
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('SUMMON');
                }}
                className="px-4 py-2 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] border-2 border-[#2E1F0F] text-xs font-black text-[#2E1F0F] cursor-pointer shadow-xs"
              >
                Summon Portal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
