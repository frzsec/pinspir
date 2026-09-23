// types/story.ts
export interface StoryChapter {
  id: string;
  title: string;
  number: number;
  coverImage: string;
  narrative: string[];
  question: string;
  audioWord: string;
  audioUrl?: string;
  options: StoryOption[];
  correctAnswerId: string;
}

export interface StoryOption {
  id: string;
  imageUrl: string;
  label: string;
  description?: string;
}

export interface StoryState {
  currentChapter: number;
  totalChapters: number;
  completedChapters: Set<number>;
  selectedAnswer: string | null;
  showFeedback: boolean;
}

// styles/colors.ts
export const storyColors = {
  primary: {
    brown: '#8C6D46',
    brownDark: '#735A3A',
    brownLight: '#6B5130',
  },
  secondary: {
    green: '#5A7144',
    greenDark: '#4A5D37',
  },
  background: {
    cream: '#FDFBF7',
    light: '#F5F0E1',
    border: '#E5DEC5',
  },
  text: {
    dark: '#2A2E26',
    medium: '#5C5C50',
  },
};

// components/StoryHero.tsx
import React from 'react';
import { storyColors } from '../styles/colors';

interface StoryHeroProps {
  coverImage: string;
  title: string;
  onBack?: () => void;
}

export const StoryHero: React.FC<StoryHeroProps> = ({
  coverImage,
  title,
  onBack,
}) => {
  return (
    <>
      {/* Hero Cover Image */}
      <div className="w-full h-[55vh] relative shrink-0">
        <img
          src={coverImage}
          alt="Story cover"
          className="w-full h-full object-cover object-top"
        />
        {/* Gradient overlay for text readability and blending */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#FDFBF7]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />

        {/* Header/Nav Overlay */}
        <header className="absolute top-0 w-full z-20 pt-12 px-6 pb-4 flex items-center gap-4 text-white">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors shadow-sm"
            aria-label="Go back"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-[17px] font-bold tracking-wide drop-shadow-md">
            {title}
          </h1>
        </header>
      </div>
    </>
  );
};

// components/StoryNarrative.tsx
import React from 'react';
import { storyColors } from '../styles/colors';

interface StoryNarrativeProps {
  chapterNumber: number;
  paragraphs: string[];
}

export const StoryNarrative: React.FC<StoryNarrativeProps> = ({
  chapterNumber,
  paragraphs,
}) => {
  return (
    <section>
      <h2
        className="text-2xl font-extrabold mb-3 tracking-tight"
        style={{ color: storyColors.text.dark }}
      >
        Chapter {String(chapterNumber).padStart(2, '0')}
      </h2>
      <div className="space-y-4">
        {paragraphs.map((paragraph, idx) => (
          <p
            key={idx}
            className="text-[16px] leading-[1.8]"
            style={{ color: storyColors.text.medium }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
};

// components/AudioVocabulary.tsx
import React from 'react';
import { storyColors } from '../styles/colors';

interface AudioVocabularyProps {
  word: string;
  audioUrl?: string;
  onPlay?: () => void;
}

export const AudioVocabulary: React.FC<AudioVocabularyProps> = ({
  word,
  audioUrl,
  onPlay,
}) => {
  const handleClick = () => {
    if (audioUrl && onPlay) {
      onPlay();
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div className="mb-6 inline-block">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-3 group px-5 py-3 rounded-2xl border shadow-sm hover:shadow-md transition-all active:scale-95"
        style={{
          backgroundColor: storyColors.background.light,
          borderColor: storyColors.background.border,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-inner transition-colors"
          style={{ backgroundColor: storyColors.primary.brown }}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.383 3.076A1 1 0 010 4v12a1 1 0 001.707.707L9.414 9.414a2 2 0 010-2.828L2.707 1.293A1 1 0 009.383 3.076zM12.707 5.293a1 1 0 000 1.414l2.586 2.586H9a1 1 0 100 2h6.293l-2.586 2.586a1 1 0 101.414 1.414l4-4a1 1 0 000-1.414l-4-4z" />
          </svg>
        </div>
        <span
          className="text-[22px] font-extrabold tracking-wide border-b-[3px] border-dotted pb-0.5"
          style={{
            color: storyColors.primary.brownLight,
            borderColor: `${storyColors.primary.brownLight}4D`,
          }}
        >
          {word}
        </span>
      </button>
    </div>
  );
};

// components/StoryOptionCard.tsx
import React from 'react';
import { storyColors } from '../styles/colors';

interface StoryOptionCardProps {
  id: string;
  imageUrl: string;
  label: string;
  isSelected?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  onClick?: () => void;
}

export const StoryOptionCard: React.FC<StoryOptionCardProps> = ({
  id,
  imageUrl,
  label,
  isSelected = false,
  isCorrect = false,
  isIncorrect = false,
  onClick,
}) => {
  let borderColor = storyColors.background.border;
  let borderWidth = '3px';

  if (isCorrect) {
    borderColor = '#10B981'; // Green
  } else if (isIncorrect) {
    borderColor = '#EF4444'; // Red
  } else if (isSelected) {
    borderColor = storyColors.primary.brown;
  }

  return (
    <button
      onClick={onClick}
      className="aspect-square bg-white rounded-[20px] p-2 outline-none transition-all shadow-sm group hover:border-[#8C6D46]"
      style={{
        borderWidth,
        borderColor,
      }}
    >
      <div className="w-full h-full rounded-xl overflow-hidden relative group-active:scale-105 transition-transform duration-300">
        <img
          src={imageUrl}
          alt={label}
          className="w-full h-full object-cover"
        />
      </div>
    </button>
  );
};

// components/StoryOptionsGrid.tsx
import React from 'react';
import { StoryOptionCard } from './StoryOptionCard';
import { StoryOption } from '../types/story';

interface StoryOptionsGridProps {
  options: StoryOption[];
  selectedOptionId?: string | null;
  onSelect?: (optionId: string) => void;
  correctOptionId?: string;
  showResults?: boolean;
  question: string;
}

export const StoryOptionsGrid: React.FC<StoryOptionsGridProps> = ({
  options,
  selectedOptionId,
  onSelect,
  correctOptionId,
  showResults = false,
  question,
}) => {
  return (
    <section className="pb-4">
      <h3 className="text-[19px] font-bold text-[#2A2E26] mb-5 leading-snug">
        {question}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <StoryOptionCard
            key={option.id}
            id={option.id}
            imageUrl={option.imageUrl}
            label={option.label}
            isSelected={selectedOptionId === option.id}
            isCorrect={showResults && correctOptionId === option.id}
            isIncorrect={
              showResults &&
              selectedOptionId === option.id &&
              correctOptionId !== option.id
            }
            onClick={() => onSelect?.(option.id)}
          />
        ))}
      </div>
    </section>
  );
};

// components/ContinueButton.tsx
import React from 'react';
import { storyColors } from '../styles/colors';

interface ContinueButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const ContinueButton: React.FC<ContinueButtonProps> = ({
  label = 'Continue Story',
  onClick,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <div className="fixed bottom-0 left-0 w-full z-40 border-t px-6 py-4 pb-6 flex justify-center" style={{ backgroundColor: storyColors.background.cream, borderColor: `${storyColors.background.border}CC` }}>
      <div className="w-full max-w-[400px]">
        <button
          onClick={onClick}
          disabled={disabled}
          className="w-full font-bold py-[18px] rounded-2xl text-[17px] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{
            backgroundColor: disabled
              ? '#9CA3AF'
              : storyColors.secondary.green,
            boxShadow: `0 10px 15px -3px ${storyColors.secondary.green}33`,
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            label
          )}
        </button>
      </div>
    </div>
  );
};

// components/StoryScreen.tsx
import React, { useState } from 'react';
import { StoryHero } from './StoryHero';
import { StoryNarrative } from './StoryNarrative';
import { AudioVocabulary } from './AudioVocabulary';
import { StoryOptionsGrid } from './StoryOptionsGrid';
import { ContinueButton } from './ContinueButton';
import { StoryChapter, StoryState } from '../types/story';
import { storyColors } from '../styles/colors';

interface StoryScreenProps {
  chapter: StoryChapter;
  storyState: StoryState;
  onSelectAnswer: (answerId: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

export const StoryScreen: React.FC<StoryScreenProps> = ({
  chapter,
  storyState,
  onSelectAnswer,
  onContinue,
  onBack,
}) => {
  const isAnswered = storyState.selectedAnswer !== null;

  return (
    <div className="w-full max-w-[400px] mx-auto min-h-screen bg-[#FDFBF7] relative pb-[120px] shadow-2xl overflow-x-hidden">
      {/* Hero Section */}
      <StoryHero
        coverImage={chapter.coverImage}
        title={chapter.title}
        onBack={onBack}
      />

      {/* Content Area */}
      <main className="relative z-10 bg-[#FDFBF7] rounded-t-[32px] -mt-12 px-6 pt-8 pb-8 flex flex-col gap-8">
        {/* Story Narrative */}
        <StoryNarrative
          chapterNumber={chapter.number}
          paragraphs={chapter.narrative}
        />

        {/* Divider */}
        <hr style={{ borderColor: storyColors.background.border }} />

        {/* Audio Vocabulary */}
        <AudioVocabulary
          word={chapter.audioWord}
          audioUrl={chapter.audioUrl}
        />

        {/* Options Grid */}
        <StoryOptionsGrid
          options={chapter.options}
          selectedOptionId={storyState.selectedAnswer}
          onSelect={onSelectAnswer}
          correctOptionId={chapter.correctAnswerId}
          showResults={storyState.showFeedback}
          question={chapter.question}
        />
      </main>

      {/* Continue Button */}
      <ContinueButton
        onClick={onContinue}
        disabled={!isAnswered}
        label={
          storyState.currentChapter === storyState.totalChapters - 1
            ? 'Finish Story'
            : 'Continue Story'
        }
      />
    </div>
  );
};

// App.tsx (Example usage)
import React, { useState } from 'react';
import { StoryScreen } from './components/StoryScreen';
import { StoryChapter, StoryState } from './types/story';

const sampleChapters: StoryChapter[] = [
  {
    id: 'ch1',
    title: 'Emma and the Whisper',
    number: 1,
    coverImage:
      'https://images.unsplash.com/photo-1542124505-1a87754378f4?q=80&w=800&auto=format&fit=crop',
    narrative: [
      'Emma loved playing in the forest near her house. One day, while exploring the old trees, she heard a soft whisper coming from behind the stone oak tree.',
      '"Help me, Emma," the tree seemed to say. Emma\'s eyes widened. "Who\'s there?" she asked, stepping closer.',
    ],
    question: 'What does Emma hear in the forest?',
    audioWord: 'Whisper',
    audioUrl: '/audio/whisper.mp3',
    options: [
      {
        id: 'opt1',
        imageUrl:
          'https://images.unsplash.com/photo-1471018597330-019688126b86?w=400&h=400&fit=crop',
        label: 'Wind',
        description: 'Blowing leaves',
      },
      {
        id: 'opt2',
        imageUrl:
          'https://images.unsplash.com/photo-1555543419-58db82fa20c7?w=400&h=400&fit=crop',
        label: 'Bird',
        description: 'Forest bird singing',
      },
      {
        id: 'opt3',
        imageUrl:
          'https://images.unsplash.com/photo-1507661273397-d8c9735d1f11?w=400&h=400&fit=crop',
        label: 'Animal',
        description: 'Forest animal',
      },
      {
        id: 'opt4',
        imageUrl:
          'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop',
        label: 'Stream',
        description: 'Forest stream',
      },
    ],
    correctAnswerId: 'opt1',
  },
  // Add more chapters...
];

const App: React.FC = () => {
  const [storyState, setStoryState] = useState<StoryState>({
    currentChapter: 0,
    totalChapters: sampleChapters.length,
    completedChapters: new Set(),
    selectedAnswer: null,
    showFeedback: false,
  });

  const currentChapter = sampleChapters[storyState.currentChapter];

  const handleSelectAnswer = (answerId: string) => {
    setStoryState((prev) => ({
      ...prev,
      selectedAnswer: answerId,
      showFeedback: true,
    }));
  };

  const handleContinue = () => {
    const isCorrect =
      storyState.selectedAnswer === currentChapter.correctAnswerId;

    if (isCorrect) {
      if (storyState.currentChapter < storyState.totalChapters - 1) {
        setStoryState((prev) => ({
          ...prev,
          currentChapter: prev.currentChapter + 1,
          completedChapters: new Set([
            ...prev.completedChapters,
            prev.currentChapter,
          ]),
          selectedAnswer: null,
          showFeedback: false,
        }));
      } else {
        // Story completed
        console.log('Story completed!');
        setStoryState((prev) => ({
          ...prev,
          completedChapters: new Set([
            ...prev.completedChapters,
            prev.currentChapter,
          ]),
        }));
      }
    }
  };

  const handleBack = () => {
    if (storyState.currentChapter > 0) {
      setStoryState((prev) => ({
        ...prev,
        currentChapter: prev.currentChapter - 1,
        selectedAnswer: null,
        showFeedback: false,
      }));
    }
  };

  return (
    <StoryScreen
      chapter={currentChapter}
      storyState={storyState}
      onSelectAnswer={handleSelectAnswer}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
};

export default App;