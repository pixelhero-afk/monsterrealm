/**
 * Monster Realms - Interactive Tutorial Guidance Overlay
 * Features mandatory prominent "SKIP TUTORIAL" button and step-by-step guidance.
 */

import React from 'react';
import {
  Sparkles,
  Swords,
  Shield,
  Zap,
  FastForward,
  CheckCircle,
  X,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { TutorialState } from '../types';
import { skipTutorial, updateTutorialStep } from '../services/apiClient';

interface TutorialOverlayProps {
  tutorialState: TutorialState;
  onUpdateTutorial: () => void;
  onNavigateToTab?: (tab: any) => void;
}

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Welcome to Monster Realms',
    content:
      'You have been granted a balanced 5-monster starter team spanning Fire, Water, Grass, Light, and Dark. In Monster Realms, battles are fought 5v5 using speed-based turn meters!',
    icon: Flame,
    recommendedTab: 'HOME',
  },
  {
    step: 2,
    title: 'Speed-Based Turn Order',
    content:
      'Turn order is not round-based. Each combatant has an individual Turn Meter that ticks forward according to their Speed stat. Faster monsters gain turns sooner!',
    icon: Zap,
    recommendedTab: 'BATTLE',
  },
  {
    step: 3,
    title: 'Elemental Advantage',
    content:
      'Remember the elemental triad: Fire > Grass > Water > Fire! Light and Dark have strong mutual advantages against each other. Advantage grants +25% Damage and +15% Crit Rate.',
    icon: Sparkles,
    recommendedTab: 'BATTLE',
  },
  {
    step: 4,
    title: 'Tactical 5v5 Combat',
    content:
      'During your turn, select a skill and target an enemy or ally. You can also toggle Auto-Battle with 1x, 2x, or 3x battle speeds at any time.',
    icon: Swords,
    recommendedTab: 'BATTLE',
  },
  {
    step: 5,
    title: 'Astral Summon Gate',
    content:
      'Use earned Summon Points or Gems at the Astral Gateway to summon rare, epic, and legendary monsters to diversify your strategic compositions.',
    icon: Sparkles,
    recommendedTab: 'SUMMON',
  },
  {
    step: 6,
    title: 'Awakening & Equipment',
    content:
      'Level up monsters, equip 4-piece equipment sets for synergy bonuses, and enter the Awakening Chamber to unlock transformed appearances and ultimate skills!',
    icon: Shield,
    recommendedTab: 'MONSTERS',
  },
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  tutorialState,
  onUpdateTutorial,
  onNavigateToTab,
}) => {
  if (tutorialState.isCompleted || tutorialState.isSkipped) {
    return null;
  }

  const currentStepData =
    TUTORIAL_STEPS.find((s) => s.step === tutorialState.currentStep) || TUTORIAL_STEPS[0];
  const IconComponent = currentStepData.icon;

  const handleNextStep = async () => {
    const nextStepNum = tutorialState.currentStep + 1;
    if (nextStepNum > TUTORIAL_STEPS.length) {
      await updateTutorialStep(13, 'COMPLETED');
    } else {
      await updateTutorialStep(nextStepNum, `STEP_${nextStepNum}`);
    }
    onUpdateTutorial();
  };

  const handleSkip = async () => {
    await skipTutorial();
    onUpdateTutorial();
  };

  return (
    <div className="fixed bottom-4 right-4 sm:right-6 z-50 max-w-sm w-full animate-fade-in">
      <div className="fantasy-scroll-card p-4 shadow-2xl text-[#2E1F0F] space-y-3">
        {/* Header with SKIP TUTORIAL prominent button */}
        <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E] uppercase tracking-wider font-serif">
            <IconComponent className="w-4 h-4 text-[#D97706]" />
            <span>
              Tutorial ({currentStepData.step}/{TUTORIAL_STEPS.length})
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#9F1239] border border-[#FDA4AF] transition-colors cursor-pointer shadow-2xs"
            title="Skip all tutorial steps and unlock full game immediately"
          >
            SKIP TUTORIAL
          </button>
        </div>

        {/* Step Body */}
        <div>
          <h4 className="text-sm font-black text-[#2E1F0F] font-serif">
            {currentStepData.title}
          </h4>
          <p className="text-xs text-[#5C4A34] mt-1 leading-relaxed font-medium">
            {currentStepData.content}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleSkip}
            className="text-[11px] text-[#78654E] hover:text-[#2E1F0F] underline cursor-pointer"
          >
            Skip all
          </button>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-1 px-4 py-1.5 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs shadow-md cursor-pointer transition-transform hover:scale-105"
          >
            {currentStepData.step === TUTORIAL_STEPS.length ? 'Finish' : 'Next'}
            <ChevronRight className="w-3.5 h-3.5 text-[#92400E]" />
          </button>
        </div>
      </div>
    </div>
  );
};
