/**
 * News & Updates LiveOps Editor Tab
 * Allows Dean to easily create, edit, reorder, and publish in-game announcements.
 */

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Shield,
  Swords,
  Zap,
  Gift,
  Flame,
  Calendar,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { NewsItem, NewsCategory, NewsSection } from '../../types';
import { getNewsApi, saveNewsApi, deleteNewsApi, resetNewsApi } from '../../services/apiClient';

interface NewsEditorTabProps {
  onNewsModified?: () => void;
}

const CATEGORY_COLORS: Record<NewsCategory, { bg: string; text: string; border: string }> = {
  MAJOR: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  EVENT: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  BANNER: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
  UPDATE: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  MAINTENANCE: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
};

export const NewsEditorTab: React.FC<NewsEditorTabProps> = ({ onNewsModified }) => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Safe Inline Confirmation States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Form State
  const [formId, setFormId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formTagline, setFormTagline] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formCategory, setFormCategory] = useState<NewsCategory>('UPDATE');
  const [formBadgeText, setFormBadgeText] = useState<string>('UPDATE');
  const [formIcon, setFormIcon] = useState<string>('Megaphone');
  const [formHeadlineTitle, setFormHeadlineTitle] = useState<string>('');
  const [formHeadlineContent, setFormHeadlineContent] = useState<string>('');
  const [formHeadlineBadge, setFormHeadlineBadge] = useState<string>('');
  const [formSections, setFormSections] = useState<NewsSection[]>([]);
  const [formActionLabel, setFormActionLabel] = useState<string>('');
  const [formActionTab, setFormActionTab] = useState<string>('');
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await getNewsApi();
      if (res?.news) {
        setNewsList(res.news);
        if (!selectedNewsId && res.news.length > 0) {
          selectNewsItem(res.news[0]);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch news' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const selectNewsItem = (item: NewsItem) => {
    setSelectedNewsId(item.id);
    setFormId(item.id);
    setFormTitle(item.title);
    setFormTagline(item.tagline || '');
    setFormDate(item.date);
    setFormCategory(item.category);
    setFormBadgeText(item.badgeText);
    setFormIcon(item.icon || 'Megaphone');
    setFormHeadlineTitle(item.headline?.title || '');
    setFormHeadlineContent(item.headline?.content || '');
    setFormHeadlineBadge(item.headline?.badge || '');
    setFormSections(item.sections ? JSON.parse(JSON.stringify(item.sections)) : []);
    setFormActionLabel(item.actionButton?.label || '');
    setFormActionTab(item.actionButton?.targetTab || '');
    setFormIsPublished(item.isPublished !== false);
  };

  const handleCreateNew = () => {
    setSelectedNewsId(null);
    setFormId('');
    setFormTitle('New Realm Announcement');
    setFormTagline('Version 1.1 • Community Event');
    setFormDate('Updated today');
    setFormCategory('EVENT');
    setFormBadgeText('EVENT LIVE');
    setFormIcon('Sparkles');
    setFormHeadlineTitle('EXCITING NEW EVENT ARRIVES IN MONSTER REALMS!');
    setFormHeadlineContent('Participate in our limited-time festival with boosted summon rates, bonus energy, and exclusive dungeon drops.');
    setFormHeadlineBadge('SPECIAL EVENT');
    setFormSections([
      {
        title: 'Event Highlights & Perks',
        icon: 'Flame',
        content: 'Clear daily campaign stages and arena challenges to claim festival tokens and mystical rewards.',
        bulletPoints: [
          'Earn double gold in all elemental dungeons.',
          'Special summoning banner with boosted 4★ and 5★ rates.',
          'Claim event gifts directly in your mailbox.',
        ],
      },
    ]);
    setFormActionLabel('SUMMON NOW');
    setFormActionTab('SUMMON');
    setFormIsPublished(true);
  };

  const handleAddSection = () => {
    setFormSections((prev) => [
      ...prev,
      {
        title: 'New Section Title',
        icon: 'Shield',
        content: 'Describe the update details, balance adjustments, or patch highlights here.',
        bulletPoints: ['Feature point 1', 'Feature point 2'],
      },
    ]);
  };

  const handleUpdateSection = (index: number, field: keyof NewsSection, value: any) => {
    setFormSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveSection = (index: number) => {
    setFormSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBulletPoint = (sectionIndex: number) => {
    setFormSections((prev) => {
      const copy = [...prev];
      const sec = copy[sectionIndex];
      sec.bulletPoints = [...(sec.bulletPoints || []), 'New detail note'];
      return copy;
    });
  };

  const handleUpdateBulletPoint = (sectionIndex: number, bpIndex: number, text: string) => {
    setFormSections((prev) => {
      const copy = [...prev];
      const sec = copy[sectionIndex];
      const bps = [...(sec.bulletPoints || [])];
      bps[bpIndex] = text;
      sec.bulletPoints = bps;
      return copy;
    });
  };

  const handleRemoveBulletPoint = (sectionIndex: number, bpIndex: number) => {
    setFormSections((prev) => {
      const copy = [...prev];
      const sec = copy[sectionIndex];
      sec.bulletPoints = (sec.bulletPoints || []).filter((_, i) => i !== bpIndex);
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedback({ type: 'error', message: 'Title is required' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const payload: Partial<NewsItem> = {
        id: formId || undefined,
        title: formTitle.trim(),
        tagline: formTagline.trim(),
        date: formDate.trim() || 'Updated today',
        category: formCategory,
        badgeText: formBadgeText.trim() || formCategory,
        icon: formIcon,
        headline: formHeadlineTitle ? {
          title: formHeadlineTitle.trim(),
          content: formHeadlineContent.trim(),
          badge: formHeadlineBadge.trim() || undefined,
        } : undefined,
        sections: formSections,
        actionButton: formActionLabel ? {
          label: formActionLabel.trim(),
          targetTab: formActionTab.trim() || undefined,
        } : undefined,
        isPublished: formIsPublished,
      };

      const res = await saveNewsApi(payload);
      if (res?.allNews) {
        setNewsList(res.allNews);
        if (res.news) {
          selectNewsItem(res.news);
        }
      }
      setFeedback({ type: 'success', message: '✓ Announcement published & saved successfully!' });
      onNewsModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save news' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      const res = await deleteNewsApi(id);
      if (res?.allNews) {
        setNewsList(res.allNews);
        if (res.allNews.length > 0) {
          selectNewsItem(res.allNews[0]);
        } else {
          handleCreateNew();
        }
      }
      setFeedback({ type: 'success', message: '✓ Announcement deleted.' });
      setConfirmDeleteId(null);
      onNewsModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const res = await resetNewsApi();
      if (res?.allNews) {
        setNewsList(res.allNews);
        if (res.allNews.length > 0) selectNewsItem(res.allNews[0]);
      }
      setFeedback({ type: 'success', message: '✓ Restored default game announcements.' });
      setConfirmReset(false);
      onNewsModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reset' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-[#2E1F0F] text-sm">News & Updates LiveOps Editor</h3>
            <p className="text-[11px] text-[#7A6348]">
              Publish announcements, patch notes, and event bulletins for all players in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Announcement</span>
          </button>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="Reset announcements to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-rose-100 p-1 rounded-xl border border-rose-300">
              <span className="text-[10px] text-rose-900 font-bold px-1">Reset all?</span>
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black hover:bg-rose-700 cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 bg-white text-stone-700 rounded-lg text-[10px] font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Split: Announcements List (Left) + Live Editor (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Announcements List */}
        <div className="md:col-span-4 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          <div className="text-[11px] font-black uppercase text-[#7A6348] tracking-wider px-1">
            Active Bulletins ({newsList.length})
          </div>

          {newsList.map((item) => {
            const isSelected = item.id === selectedNewsId;
            const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.UPDATE;

            return (
              <div
                key={item.id}
                onClick={() => selectNewsItem(item)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'bg-amber-100/90 border-amber-400 shadow-sm ring-1 ring-amber-400'
                    : 'bg-white hover:bg-[#FFFDF9] border-[#EADBBE] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                  >
                    {item.badgeText || item.category}
                  </span>
                  <span className="text-[10px] text-[#8C765C] truncate max-w-[120px]">
                    {item.date}
                  </span>
                </div>

                <h4 className="text-xs font-black text-[#2E1F0F] line-clamp-1 font-serif">
                  {item.title}
                </h4>

                {item.tagline && (
                  <p className="text-[10px] text-[#7A6348] truncate mt-0.5">
                    {item.tagline}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#EADBBE]/50 text-[10px] text-[#8C765C]">
                  <span>{item.sections?.length || 0} sections</span>
                  {item.isPublished !== false ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Published
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">Draft</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Editor Form */}
        <div className="md:col-span-8 bg-white border border-[#EADBBE] rounded-2xl p-4 shadow-sm space-y-4 max-h-[600px] overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EADBBE] pb-2">
              <span className="text-xs font-black font-serif text-[#2E1F0F]">
                {formId ? `Editing: ${formId}` : 'Creating New Announcement'}
              </span>

              <div className="flex items-center gap-2">
                {formId && (
                  !confirmDeleteId ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(formId)}
                      disabled={saving}
                      className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-300">
                      <span className="text-[10px] text-rose-800 font-bold">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(formId)}
                        disabled={saving}
                        className="text-rose-600 hover:text-rose-800 font-black text-xs cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-stone-500 hover:text-stone-700 text-xs cursor-pointer ml-1"
                      >
                        No
                      </button>
                    </div>
                  )
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
                </button>
              </div>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Major Release: 3-Wave Dungeons!"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:outline-none text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="e.g. Version 1.0 • Major Update"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:outline-none text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Category & Badge
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as NewsCategory;
                      setFormCategory(cat);
                      if (!formBadgeText || formBadgeText === formCategory) {
                        setFormBadgeText(cat);
                      }
                    }}
                    className="px-2 py-1.5 rounded-xl border border-stone-300 text-xs font-bold bg-white"
                  >
                    <option value="MAJOR">MAJOR</option>
                    <option value="EVENT">EVENT</option>
                    <option value="BANNER">BANNER</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>

                  <input
                    type="text"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                    placeholder="Badge Text"
                    className="px-2 py-1.5 rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Date / Time Tagline
                </label>
                <input
                  type="text"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  placeholder="e.g. Version 1.0 • Updated today"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:outline-none text-xs font-medium"
                />
              </div>
            </div>

            {/* Headline Banner Customizer */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Featured Headline Card (Top Banner)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <input
                    type="text"
                    value={formHeadlineTitle}
                    onChange={(e) => setFormHeadlineTitle(e.target.value)}
                    placeholder="Headline Title (e.g. NEW UNITS ADDED!)"
                    className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formHeadlineBadge}
                    onChange={(e) => setFormHeadlineBadge(e.target.value)}
                    placeholder="Headline Badge (e.g. MAJOR RELEASE)"
                    className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                  />
                </div>
              </div>

              <textarea
                value={formHeadlineContent}
                onChange={(e) => setFormHeadlineContent(e.target.value)}
                placeholder="Headline description summary..."
                rows={2}
                className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs bg-white focus:outline-none"
              />
            </div>

            {/* Subsections Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black font-serif text-[#2E1F0F]">
                  Announcement Details & Sections ({formSections.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Section</span>
                </button>
              </div>

              {formSections.map((section, sIdx) => (
                <div key={sIdx} className="p-3 rounded-xl border border-[#EADBBE] bg-[#FFFDF9] space-y-2 relative">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-[#7A6348] tracking-wider">
                      Section #{sIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIdx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Delete section"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleUpdateSection(sIdx, 'title', e.target.value)}
                      placeholder="Section Title"
                      className="w-full px-3 py-1 rounded-lg border border-stone-300 text-xs font-bold"
                    />
                    <select
                      value={section.icon || 'Shield'}
                      onChange={(e) => handleUpdateSection(sIdx, 'icon', e.target.value)}
                      className="px-2 py-1 rounded-lg border border-stone-300 text-xs font-medium bg-white"
                    >
                      <option value="Shield">Shield Icon (Defense/Dungeon)</option>
                      <option value="Swords">Swords Icon (PvP/Combat)</option>
                      <option value="Sparkles">Sparkles Icon (Summon/Special)</option>
                      <option value="Megaphone">Megaphone Icon (Announcement)</option>
                      <option value="Zap">Zap Icon (Power/Awakening)</option>
                      <option value="Flame">Flame Icon (Event/Fiery)</option>
                      <option value="Gift">Gift Icon (Rewards)</option>
                    </select>
                  </div>

                  <textarea
                    value={section.content}
                    onChange={(e) => handleUpdateSection(sIdx, 'content', e.target.value)}
                    placeholder="Section description text..."
                    rows={2}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:outline-none"
                  />

                  {/* Bullet points */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#7A6348]">Bullet Points:</span>
                      <button
                        type="button"
                        onClick={() => handleAddBulletPoint(sIdx)}
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                      >
                        + Add Bullet Point
                      </button>
                    </div>

                    {(section.bulletPoints || []).map((bp, bpIdx) => (
                      <div key={bpIdx} className="flex items-center gap-1.5">
                        <span className="text-[#8C765C]">•</span>
                        <input
                          type="text"
                          value={bp}
                          onChange={(e) => handleUpdateBulletPoint(sIdx, bpIdx, e.target.value)}
                          className="flex-1 px-2 py-1 rounded-md border border-stone-200 text-xs"
                          placeholder="Feature or balance detail"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBulletPoint(sIdx, bpIdx)}
                          className="text-stone-300 hover:text-rose-600 px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Navigation Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  In-Game CTA Button Label
                </label>
                <input
                  type="text"
                  value={formActionLabel}
                  onChange={(e) => setFormActionLabel(e.target.value)}
                  placeholder="e.g. SUMMON NOW"
                  className="w-full px-3 py-1 rounded-lg border border-stone-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Navigate To Screen
                </label>
                <select
                  value={formActionTab}
                  onChange={(e) => setFormActionTab(e.target.value)}
                  className="w-full px-3 py-1 rounded-lg border border-stone-300 text-xs font-bold bg-white"
                >
                  <option value="">No Button</option>
                  <option value="SUMMON">Summon Astral Portal</option>
                  <option value="PVE">Campaign & Equipment Dungeons</option>
                  <option value="MONSTERS">Monsters & Team Box</option>
                  <option value="ARENA">PvP Arena</option>
                  <option value="SYNTHESIS">Synthesis Chamber</option>
                  <option value="CODEX">Monster Codex</option>
                </select>
              </div>
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#EADBBE]">
              <input
                type="checkbox"
                id="isPublishedCheck"
                checked={formIsPublished}
                onChange={(e) => setFormIsPublished(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <label htmlFor="isPublishedCheck" className="text-xs font-bold text-[#2E1F0F] cursor-pointer">
                Publish this announcement (visible to all players in News & Updates)
              </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
