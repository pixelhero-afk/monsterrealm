/**
 * Unit Creator Interface for Developer Sandbox
 * Allows configuring, registering, and dynamically creating new monster units & families.
 * Automatically provisions canonical asset directories under public/assets/characters/<unit>/<element>/
 * and registers them directly into the live game engine and player roster.
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Droplets,
  Leaf,
  Sun,
  Moon,
  Shield,
  Sword,
  Zap,
  Heart,
  Folder,
  Copy,
  Check,
  Plus,
  AlertCircle,
  Award,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  ElementType,
  MonsterFamily,
  MonsterRole,
  MonsterVariant,
  Rarity,
  SkillDefinition,
} from '../../types';
import { MONSTER_FAMILIES } from '../../data/monsters';
import { SKILLS_DATABASE } from '../../data/skills';
import { customUnitsService } from '../../services/customUnitsService';

interface UnitCreatorTabProps {
  onUnitCreated: () => void;
  onNavigateToParty?: () => void;
}

// Preset archetypes for quick stat calibration
const STAT_PRESETS: Record<
  string,
  {
    name: string;
    description: string;
    icon: string;
    role: MonsterRole;
    stats: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
      critRate: number;
      critDamage: number;
      accuracy: number;
      resistance: number;
    };
    growth: {
      hp: number;
      attack: number;
      defense: number;
    };
  }
> = {
  STRIKER: {
    name: 'Striker / DPS',
    description: 'High burst damage, attack and critical stats.',
    icon: 'Sword',
    role: 'DAMAGE',
    stats: {
      hp: 780,
      attack: 235,
      defense: 95,
      speed: 108,
      critRate: 0.25,
      critDamage: 1.6,
      accuracy: 0.2,
      resistance: 0.15,
    },
    growth: { hp: 42, attack: 14, defense: 6 },
  },
  GUARDIAN: {
    name: 'Guardian / Tank',
    description: 'Massive hit points and armor to absorb incoming blows.',
    icon: 'Shield',
    role: 'TANK',
    stats: {
      hp: 1250,
      attack: 110,
      defense: 210,
      speed: 94,
      critRate: 0.15,
      critDamage: 1.5,
      accuracy: 0.15,
      resistance: 0.35,
    },
    growth: { hp: 68, attack: 7, defense: 13 },
  },
  ASSASSIN: {
    name: 'Swift Assassin',
    description: 'Blistering speed and lethality before the enemy reacts.',
    icon: 'Zap',
    role: 'ASSASSIN',
    stats: {
      hp: 720,
      attack: 215,
      defense: 88,
      speed: 124,
      critRate: 0.3,
      critDamage: 1.75,
      accuracy: 0.25,
      resistance: 0.15,
    },
    growth: { hp: 38, attack: 13, defense: 5 },
  },
  SUPPORT: {
    name: 'Arcane Support',
    description: 'Empowers allies, controls flow, high resistance.',
    icon: 'Heart',
    role: 'SUPPORT',
    stats: {
      hp: 980,
      attack: 135,
      defense: 140,
      speed: 104,
      critRate: 0.15,
      critDamage: 1.5,
      accuracy: 0.35,
      resistance: 0.4,
    },
    growth: { hp: 52, attack: 8, defense: 9 },
  },
  BRUISER: {
    name: 'Battle Bruiser',
    description: 'Sturdy hybrid capable of both dishing and taking punishment.',
    icon: 'Sword',
    role: 'BRUISER',
    stats: {
      hp: 1020,
      attack: 185,
      defense: 155,
      speed: 100,
      critRate: 0.2,
      critDamage: 1.55,
      accuracy: 0.2,
      resistance: 0.2,
    },
    growth: { hp: 55, attack: 11, defense: 9 },
  },
};

const ELEMENT_CONFIG: Record<
  ElementType,
  { label: string; icon: any; color: string; border: string; bg: string; defaultSkills: string[] }
> = {
  FIRE: {
    label: 'Fire',
    icon: Flame,
    color: '#EF4444',
    border: 'border-red-500/40',
    bg: 'bg-red-500/10 text-red-700',
    defaultSkills: ['skill_flame_claw', 'skill_volcanic_burst', 'skill_infernal_cataclysm'],
  },
  WATER: {
    label: 'Water',
    icon: Droplets,
    color: '#3B82F6',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10 text-blue-700',
    defaultSkills: ['skill_tidal_strike', 'skill_aqueous_barrier', 'skill_tsunami_deluge'],
  },
  GRASS: {
    label: 'Grass',
    icon: Leaf,
    color: '#10B981',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10 text-emerald-700',
    defaultSkills: ['skill_thorn_lash', 'skill_verdant_bloom', 'skill_photosynthesis_burst'],
  },
  LIGHT: {
    label: 'Light',
    icon: Sun,
    color: '#F59E0B',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10 text-amber-700',
    defaultSkills: ['skill_solar_flare', 'skill_radiant_sanctuary', 'skill_judgment_lance'],
  },
  DARK: {
    label: 'Dark',
    icon: Moon,
    color: '#8B5CF6',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10 text-purple-700',
    defaultSkills: ['skill_shadow_strike', 'skill_abyssal_shroud', 'skill_void_oblivion'],
  },
};

export const UnitCreatorTab: React.FC<UnitCreatorTabProps> = ({
  onUnitCreated,
  onNavigateToParty,
}) => {
  // Family configuration
  const [familyMode, setFamilyMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('fam_pyrosaur');
  const [newFamilyName, setNewFamilyName] = useState<string>('');
  const [newFamilyId, setNewFamilyId] = useState<string>('');
  const [newFamilyLore, setNewFamilyLore] = useState<string>(
    'An ancient creature reawakened across the elemental continents.'
  );

  // Variant core identity
  const [unitName, setUnitName] = useState<string>('');
  const [element, setElement] = useState<ElementType>('FIRE');
  const [rarity, setRarity] = useState<Rarity>('EPIC');
  const [stars, setStars] = useState<number>(4);
  const [primaryRole, setPrimaryRole] = useState<MonsterRole>('DAMAGE');
  const [secondaryRole, setSecondaryRole] = useState<MonsterRole | ''>('');
  const [lore, setLore] = useState<string>(
    'Forged by elemental energies, this formidable unit channels raw power onto the battlefield.'
  );

  // Stats
  const [hp, setHp] = useState<number>(850);
  const [attack, setAttack] = useState<number>(185);
  const [defense, setDefense] = useState<number>(120);
  const [speed, setSpeed] = useState<number>(105);
  const [critRate, setCritRate] = useState<number>(15);
  const [critDamage, setCritDamage] = useState<number>(150);
  const [accuracy, setAccuracy] = useState<number>(20);
  const [resistance, setResistance] = useState<number>(15);
  const [growthHp, setGrowthHp] = useState<number>(45);
  const [growthAtk, setGrowthAtk] = useState<number>(10);
  const [growthDef, setGrowthDef] = useState<number>(7);

  // Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'skill_flame_claw',
    'skill_volcanic_burst',
  ]);
  const [skillSearch, setSkillSearch] = useState<string>('');

  // Awakening
  const [awakenedTitle, setAwakenedTitle] = useState<string>('');
  const [awakenedBonus, setAwakenedBonus] = useState<string>(
    '+15% Attack, +10 Speed, unlocks enhanced skill'
  );

  // Roster delivery options
  const [autoGrant, setAutoGrant] = useState<boolean>(true);
  const [startingLevel, setStartingLevel] = useState<number>(15);

  // State management
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    name: string;
    element: string;
    directory: string;
  } | null>(null);
  const [copiedFolder, setCopiedFolder] = useState<boolean>(false);

  // Existing families list
  const existingFamilies = useMemo(() => {
    return Object.values(MONSTER_FAMILIES);
  }, []);

  // Compute canonical unit folder name
  const unitFolderSlug = useMemo(() => {
    if (familyMode === 'NEW') {
      const slug = (newFamilyId || newFamilyName || 'new_unit')
        .toLowerCase()
        .replace(/^fam_/, '')
        .replace(/[^a-z0-9_-]/g, '_');
      return slug || 'custom_unit';
    }
    return selectedFamilyId.replace(/^fam_/, '').toLowerCase();
  }, [familyMode, newFamilyId, newFamilyName, selectedFamilyId]);

  const canonicalDirectory = `public/assets/characters/${unitFolderSlug}/${element.toLowerCase()}/`;

  // Auto-fill family ID when typing new family name
  const handleFamilyNameChange = (val: string) => {
    setNewFamilyName(val);
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    setNewFamilyId(`fam_${slug}`);
  };

  // Apply stat preset
  const handleApplyPreset = (presetKey: string) => {
    const p = STAT_PRESETS[presetKey];
    if (!p) return;
    setPrimaryRole(p.role);
    setHp(p.stats.hp);
    setAttack(p.stats.attack);
    setDefense(p.stats.defense);
    setSpeed(p.stats.speed);
    setCritRate(Math.round(p.stats.critRate * 100));
    setCritDamage(Math.round(p.stats.critDamage * 100));
    setAccuracy(Math.round(p.stats.accuracy * 100));
    setResistance(Math.round(p.stats.resistance * 100));
    setGrowthHp(p.growth.hp);
    setGrowthAtk(p.growth.attack);
    setGrowthDef(p.growth.defense);
  };

  // Handle element change and update default skills
  const handleElementChange = (newElem: ElementType) => {
    setElement(newElem);
    const defaults = ELEMENT_CONFIG[newElem].defaultSkills;
    setSelectedSkills(defaults.slice(0, 2));
  };

  // Handle Rarity change
  const handleRarityChange = (r: Rarity) => {
    setRarity(r);
    const starMap: Record<Rarity, number> = {
      COMMON: 1,
      UNCOMMON: 2,
      RARE: 3,
      EPIC: 4,
      LEGENDARY: 5,
    };
    setStars(starMap[r] || 3);
  };

  // Copy directory path
  const handleCopyDirectory = () => {
    navigator.clipboard.writeText(canonicalDirectory);
    setCopiedFolder(true);
    setTimeout(() => setCopiedFolder(false), 2000);
  };

  // Filter skills for picker
  const filteredSkills = useMemo(() => {
    const query = skillSearch.toLowerCase().trim();
    return Object.values(SKILLS_DATABASE)
      .filter((s: SkillDefinition) => {
        if (!query) return true;
        return (
          s.name.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
        );
      })
      .slice(0, 15);
  }, [skillSearch]);

  // Submit Unit Creation
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessInfo(null);

    const trimmedName = unitName.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a Unit Name.');
      return;
    }

    if (familyMode === 'NEW' && (!newFamilyName.trim() || !newFamilyId.trim())) {
      setErrorMsg('Please enter a Name and ID for the new Family.');
      return;
    }

    const effectiveFamilyId =
      familyMode === 'NEW' ? newFamilyId.trim() : selectedFamilyId;
    const variantSlug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const variantId = `var_${unitFolderSlug}_${element.toLowerCase()}_${variantSlug}`;

    // Construct MonsterFamily if new
    let familyData: MonsterFamily | { familyId: string };
    if (familyMode === 'NEW') {
      familyData = {
        familyId: effectiveFamilyId,
        familyName: newFamilyName.trim(),
        lore: newFamilyLore.trim(),
        rarity,
        stars,
        availableElements: [element],
        silhouetteTheme: newFamilyName.trim().toLowerCase(),
      };
    } else {
      familyData = { familyId: effectiveFamilyId };
    }

    // Construct MonsterVariant
    const variantData: MonsterVariant = {
      variantId,
      familyId: effectiveFamilyId,
      name: trimmedName,
      element,
      rarity,
      stars,
      primaryRole,
      secondaryRole: secondaryRole || undefined,
      lore: lore.trim(),
      baseStats: {
        hp: Number(hp),
        attack: Number(attack),
        defense: Number(defense),
        speed: Number(speed),
        critRate: Number(critRate) / 100,
        critDamage: Number(critDamage) / 100,
        accuracy: Number(accuracy) / 100,
        resistance: Number(resistance) / 100,
      },
      growthPerLevel: {
        hp: Number(growthHp),
        attack: Number(growthAtk),
        defense: Number(growthDef),
      },
      skills: selectedSkills.length > 0 ? selectedSkills : ['skill_flame_claw'],
      awakeningStages: [
        {
          stage: 'AWAKENED',
          title: awakenedTitle || `Awakened ${trimmedName}`,
          visualTitle: awakenedTitle || `Awakened ${trimmedName}`,
          statMultipliers: {
            attack: 1.15,
            hp: 1.1,
            speed: 5,
          },
          description: awakenedBonus,
        },
      ],
      artwork: {
        baseAvatar: trimmedName.replace(/\s+/g, ''),
        awakenedAvatar: `Awakened${trimmedName.replace(/\s+/g, '')}`,
        colorHex: ELEMENT_CONFIG[element].color,
        accentHex: '#d97706',
      },
      isObtainable: true,
    };

    try {
      setIsSubmitting(true);
      const res = await customUnitsService.createUnit({
        family: familyData,
        variant: variantData,
        autoGrantToRoster: autoGrant,
        startingLevel,
        startingStars: stars,
      });

      setSuccessInfo({
        name: trimmedName,
        element: element,
        directory: res.directory || canonicalDirectory,
      });
      onUnitCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create unit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const elemTheme = ELEMENT_CONFIG[element];

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-[#FAF6ED] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/50 flex items-center justify-center text-[#92400E] shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-[#D97706]" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#2E1F0F]">Dynamic Monster Creation Engine</h4>
          <p className="text-[12px] text-[#5C4A34] leading-relaxed mt-0.5">
            Configure new species or elemental variants. Upon creation, the server automatically
            provisions its canonical asset folder, registers skills & stats in memory, and injects a
            playable copy into your active roster.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successInfo && (
        <div className="bg-[#ECFDF5] border border-[#10B981]/50 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>Unit Created Successfully: {successInfo.name}!</span>
          </div>
          <p className="text-xs text-emerald-700">
            Registered as a <strong className="uppercase">{successInfo.element}</strong> unit. The
            canonical sprite folder has been provisioned on disk:
          </p>
          <div className="flex items-center gap-2 bg-white/80 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono text-emerald-900">
            <Folder className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1 truncate">{successInfo.directory}</span>
            <button
              type="button"
              onClick={handleCopyDirectory}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedFolder ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedFolder ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {onNavigateToParty && (
              <button
                type="button"
                onClick={onNavigateToParty}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>View in Party Screen</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSuccessInfo(null);
                setUnitName('');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs cursor-pointer"
            >
              Create Another Unit
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="bg-[#FEF2F2] border border-red-300 rounded-xl p-3 flex items-center gap-2.5 text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form & Live Preview Grid */}
      <form onSubmit={handleCreateUnit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Family Selection */}
          <div className="bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#78654E]">
                1. Monster Family & Lineage
              </span>
              <div className="flex bg-[#FAF6ED] p-0.5 rounded-lg border border-[#D5C29E]">
                <button
                  type="button"
                  onClick={() => setFamilyMode('EXISTING')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    familyMode === 'EXISTING'
                      ? 'bg-[#2E1F0F] text-[#FFFDF9]'
                      : 'text-[#78654E] hover:text-[#2E1F0F]'
                  }`}
                >
                  Existing Family
                </button>
                <button
                  type="button"
                  onClick={() => setFamilyMode('NEW')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    familyMode === 'NEW'
                      ? 'bg-[#2E1F0F] text-[#FFFDF9]'
                      : 'text-[#78654E] hover:text-[#2E1F0F]'
                  }`}
                >
                  + New Family
                </button>
              </div>
            </div>

            {familyMode === 'EXISTING' ? (
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Select Monster Family
                </label>
                <select
                  value={selectedFamilyId}
                  onChange={(e) => setSelectedFamilyId(e.target.value)}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-3 py-2 text-xs font-semibold text-[#2E1F0F] focus:outline-none focus:border-[#F59E0B]"
                >
                  {existingFamilies.map((fam) => (
                    <option key={fam.familyId} value={fam.familyId}>
                      {fam.familyName} ({fam.familyId}) — {fam.rarity}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                    Family Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frostfang"
                    value={newFamilyName}
                    onChange={(e) => handleFamilyNameChange(e.target.value)}
                    className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-3 py-2 text-xs font-semibold text-[#2E1F0F] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                    Family ID (Canonical slug)
                  </label>
                  <input
                    type="text"
                    value={newFamilyId}
                    onChange={(e) => setNewFamilyId(e.target.value)}
                    placeholder="fam_frostfang"
                    className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[#2E1F0F] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Unit Identity & Element */}
          <div className="bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-[#78654E]">
              2. Unit Identity & Element
            </span>

            <div>
              <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Unit Name ([Monster Name] [Element])</label>
              <input
                type="text"
                placeholder="e.g. Pyrosaur Fire, NekoHime Water"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-3 py-2 text-xs font-semibold text-[#2E1F0F] focus:outline-none focus:border-[#F59E0B]"
                required
              />
            </div>

            {/* Element Selection */}
            <div>
              <label className="block text-[11px] font-bold text-[#5C4A34] mb-1.5">
                Elemental Affinity
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'] as ElementType[]).map((elem) => {
                  const cfg = ELEMENT_CONFIG[elem];
                  const IconComp = cfg.icon;
                  const isSelected = element === elem;
                  return (
                    <button
                      key={elem}
                      type="button"
                      onClick={() => handleElementChange(elem)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? `${cfg.border} bg-[#2E1F0F] text-[#FFFDF9] shadow-sm scale-102`
                          : 'border-[#D5C29E] bg-[#FAF6ED] text-[#78654E] hover:border-[#2E1F0F]'
                      }`}
                    >
                      <IconComp
                        className="w-4 h-4 mb-1"
                        style={{ color: isSelected ? '#FFF' : cfg.color }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-tight">
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rarity & Combat Roles */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Rarity</label>
                <select
                  value={rarity}
                  onChange={(e) => handleRarityChange(e.target.value as Rarity)}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2E1F0F]"
                >
                  <option value="COMMON">Common (1★)</option>
                  <option value="UNCOMMON">Uncommon (2★)</option>
                  <option value="RARE">Rare (3★)</option>
                  <option value="EPIC">Epic (4★)</option>
                  <option value="LEGENDARY">Legendary (5★)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Primary Role
                </label>
                <select
                  value={primaryRole}
                  onChange={(e) => setPrimaryRole(e.target.value as MonsterRole)}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2E1F0F]"
                >
                  <option value="DAMAGE">Damage (DPS)</option>
                  <option value="TANK">Tank (Defender)</option>
                  <option value="SUPPORT">Support (Buffer)</option>
                  <option value="HEALER">Healer</option>
                  <option value="BRUISER">Bruiser</option>
                  <option value="ASSASSIN">Assassin</option>
                  <option value="CONTROL">Control</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Secondary Role
                </label>
                <select
                  value={secondaryRole}
                  onChange={(e) => setSecondaryRole(e.target.value as MonsterRole | '')}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2E1F0F]"
                >
                  <option value="">None</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="TANK">Tank</option>
                  <option value="SUPPORT">Support</option>
                  <option value="HEALER">Healer</option>
                  <option value="BRUISER">Bruiser</option>
                  <option value="ASSASSIN">Assassin</option>
                  <option value="CONTROL">Control</option>
                </select>
              </div>
            </div>

            {/* Lore */}
            <div>
              <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                Lore / Bio Description
              </label>
              <textarea
                rows={2}
                value={lore}
                onChange={(e) => setLore(e.target.value)}
                className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-3 py-1.5 text-xs text-[#2E1F0F] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          {/* 3. Stat Calibration & Presets */}
          <div className="bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#78654E]">
                3. Combat Stats & Archetype Presets
              </span>
            </div>

            {/* Archetype Quick-Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STAT_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF6ED] border border-[#D5C29E] hover:border-[#2E1F0F] text-[#5C4A34] hover:text-[#2E1F0F] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Granular Stat Inputs */}
            <div className="grid grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#78654E] uppercase">HP</label>
                <input
                  type="number"
                  value={hp}
                  onChange={(e) => setHp(Number(e.target.value))}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-lg px-2 py-1 font-semibold text-[#2E1F0F]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#78654E] uppercase">
                  Attack
                </label>
                <input
                  type="number"
                  value={attack}
                  onChange={(e) => setAttack(Number(e.target.value))}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-lg px-2 py-1 font-semibold text-[#2E1F0F]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#78654E] uppercase">
                  Defense
                </label>
                <input
                  type="number"
                  value={defense}
                  onChange={(e) => setDefense(Number(e.target.value))}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-lg px-2 py-1 font-semibold text-[#2E1F0F]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#78654E] uppercase">
                  Speed
                </label>
                <input
                  type="number"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-lg px-2 py-1 font-semibold text-[#2E1F0F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#78654E] uppercase">
                  Crit Rate %
                </label>
                <input
                  type="number"
                  value={critRate}
                  onChange={(e) => setCritRate(Number(e.target.value))}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-lg px-2 py-1 font-semibold text-[#2E1F0F]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#78654E] uppercase">
                  Crit DMG %
                </label>
                <input
                  type="number"
                  value={critDamage}
                  onChange={(e) => setCritDamage(Number(e.target.value))}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-lg px-2 py-1 font-semibold text-[#2E1F0F]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#78654E] uppercase">
                  Accuracy %
                </label>
                <input
                  type="number"
                  value={accuracy}
                  onChange={(e) => setAccuracy(Number(e.target.value))}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-lg px-2 py-1 font-semibold text-[#2E1F0F]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#78654E] uppercase">
                  Resistance %
                </label>
                <input
                  type="number"
                  value={resistance}
                  onChange={(e) => setResistance(Number(e.target.value))}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-lg px-2 py-1 font-semibold text-[#2E1F0F]"
                />
              </div>
            </div>
          </div>

          {/* 4. Skill Loadout */}
          <div className="bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#78654E]">
              4. Skill Assignment
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search skills (e.g. burn, claw, barrier, strike)..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-3 py-1.5 text-xs text-[#2E1F0F] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            {/* Currently selected skills chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedSkills.map((skId) => {
                const sk = SKILLS_DATABASE[skId];
                return (
                  <span
                    key={skId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6ED] border border-[#D5C29E] text-xs font-bold text-[#2E1F0F]"
                  >
                    <span>{sk?.name || skId}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSkills(selectedSkills.filter((id) => id !== skId))
                      }
                      className="text-[#78654E] hover:text-red-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Skill Selector List */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border-t border-[#E8DEC8] pt-2">
              {filteredSkills.map((sk) => {
                const isSelected = selectedSkills.includes(sk.id);
                return (
                  <div
                    key={sk.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSkills(selectedSkills.filter((id) => id !== sk.id));
                      } else if (selectedSkills.length < 3) {
                        setSelectedSkills([...selectedSkills, sk.id]);
                      }
                    }}
                    className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                        : 'bg-[#FAF6ED] border-[#D5C29E] text-[#5C4A34] hover:border-[#2E1F0F]'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{sk.name}</div>
                      <div className="text-[10px] text-[#78654E] line-clamp-1">{sk.description}</div>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 ml-2">
                      CD: {sk.cooldown === 0 ? 'Basic' : `${sk.cooldown}t`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Awakening Upgrades */}
          <div className="bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#78654E]">
              5. Awakening Title & Description
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Awakened Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Glaciersoul"
                  value={awakenedTitle}
                  onChange={(e) => setAwakenedTitle(e.target.value)}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-3 py-1.5 text-xs text-[#2E1F0F]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Awakening Stat Description
                </label>
                <input
                  type="text"
                  value={awakenedBonus}
                  onChange={(e) => setAwakenedBonus(e.target.value)}
                  className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-3 py-1.5 text-xs text-[#2E1F0F]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview & Directory Info (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Card Preview */}
          <div className="bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#78654E]">
                Live Unit Preview Card
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${elemTheme.bg}`}>
                {element}
              </span>
            </div>

            {/* Preview Banner */}
            <div
              className="rounded-xl p-4 text-[#FFFDF9] relative overflow-hidden shadow-inner flex flex-col justify-end min-h-[140px]"
              style={{
                background: `linear-gradient(135deg, #1E1710 0%, ${elemTheme.color}88 100%)`,
              }}
            >
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <span key={i} className="text-amber-300 text-sm">
                    ★
                  </span>
                ))}
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  {primaryRole} {secondaryRole ? `• ${secondaryRole}` : ''}
                </span>
                <h3 className="text-lg font-black font-serif">{unitName || 'New Unit Name'}</h3>
                <span className="text-[11px] text-white/70">
                  {familyMode === 'NEW'
                    ? newFamilyName || 'New Family'
                    : MONSTER_FAMILIES[selectedFamilyId]?.familyName || selectedFamilyId}
                </span>
              </div>
            </div>

            {/* Preview Stats Grid */}
            <div className="grid grid-cols-4 gap-2 text-center bg-[#FAF6ED] p-2.5 rounded-xl border border-[#D5C29E]">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#78654E]">HP</span>
                <div className="text-xs font-black text-[#2E1F0F]">{hp}</div>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-[#78654E]">ATK</span>
                <div className="text-xs font-black text-[#2E1F0F]">{attack}</div>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-[#78654E]">DEF</span>
                <div className="text-xs font-black text-[#2E1F0F]">{defense}</div>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-[#78654E]">SPD</span>
                <div className="text-xs font-black text-[#2E1F0F]">{speed}</div>
              </div>
            </div>

            {/* Selected Skills Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#78654E]">
                Skill Loadout ({selectedSkills.length})
              </span>
              {selectedSkills.map((skId) => {
                const sk = SKILLS_DATABASE[skId];
                return (
                  <div
                    key={skId}
                    className="p-2 rounded-lg bg-[#FAF6ED] border border-[#D5C29E] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#2E1F0F]">{sk?.name || skId}</span>
                    <span className="text-[10px] text-[#78654E]">
                      {sk?.cooldown === 0 ? 'Basic' : `${sk?.cooldown} Turn CD`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canonical Asset Directory Information */}
          <div className="bg-[#FAF6ED] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#78654E]">
                Canonical Asset Directory
              </span>
              <button
                type="button"
                onClick={handleCopyDirectory}
                className="text-[11px] font-bold text-[#D97706] hover:text-[#92400E] flex items-center gap-1 cursor-pointer"
              >
                {copiedFolder ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFolder ? 'Copied' : 'Copy Directory'}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#D5C29E] font-mono text-[11px] text-[#2E1F0F] break-all">
              {canonicalDirectory}
            </div>

            <p className="text-[11px] text-[#5C4A34] leading-relaxed">
              When created, this directory will be automatically generated on disk with a README.
              Add standard PNG combat sprites to this folder anytime:
            </p>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-[#5C4A34]">
              <div className="p-1.5 rounded-lg bg-white/70 border border-[#E8DEC8]">IDLE.png</div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-[#E8DEC8]">
                PORTRAIT.png
              </div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-[#E8DEC8]">ATTACK.png</div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-[#E8DEC8]">HURT.png</div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-[#E8DEC8]">DEAD.png</div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-[#E8DEC8]">
                VICTORY.png
              </div>
            </div>
          </div>

          {/* Roster Auto-Injection Settings */}
          <div className="bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#78654E]">
              Immediate Delivery Options
            </span>

            <label className="flex items-center gap-2.5 text-xs text-[#2E1F0F] font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={autoGrant}
                onChange={(e) => setAutoGrant(e.target.checked)}
                className="w-4 h-4 rounded text-[#D97706] focus:ring-[#F59E0B]"
              />
              <span>Add to my active Monster Roster immediately</span>
            </label>

            {autoGrant && (
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs font-bold text-[#5C4A34]">Starting Level:</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={startingLevel}
                  onChange={(e) => setStartingLevel(Number(e.target.value))}
                  className="w-20 bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-2.5 py-1 text-xs font-bold text-[#2E1F0F]"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-[#FFFDF9] font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>{isSubmitting ? 'Creating Unit...' : '✨ Create & Register Unit'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
