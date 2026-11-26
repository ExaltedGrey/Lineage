import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StoryJourney from './components/StoryJourney';
import LineageExplorer from './components/LineageExplorer';
import LifespanTimeline from './components/LifespanTimeline';
import LineageQuiz from './components/LineageQuiz';
import ProfileDrawer from './components/ProfileDrawer';

const STORAGE_KEY = 'promised_offspring_progress_v1';

const DEFAULT_PROGRESS = {
  completedEras: [],
  quizStats: {
    totalAnswered: 0,
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    badges: [],
  },
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      completedEras: Array.isArray(parsed.completedEras) ? parsed.completedEras : [],
      quizStats: {
        ...DEFAULT_PROGRESS.quizStats,
        ...(parsed.quizStats || {}),
        badges: Array.isArray(parsed.quizStats?.badges) ? parsed.quizStats.badges : [],
      },
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export default function App() {
  const [activeMode, setActiveMode] = useState('story');
  const [selectedNode, setSelectedNode] = useState(null);
  const [explorerFocusTarget, setExplorerFocusTarget] = useState(null);
  const [explorerFocusMessianic, setExplorerFocusMessianic] = useState(false);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors in private browsing
    }
  }, [progress]);

  const handleCompleteEra = useCallback((eraId) => {
    setProgress((prev) => {
      if (prev.completedEras.includes(eraId)) return prev;
      return {
        ...prev,
        completedEras: [...prev.completedEras, eraId],
      };
    });
  }, []);

  const handleRecordAnswer = useCallback((isCorrect) => {
    setProgress((prev) => {
      const q = prev.quizStats;
      const totalAnswered = q.totalAnswered + 1;
      const totalCorrect = q.totalCorrect + (isCorrect ? 1 : 0);
      const currentStreak = isCorrect ? q.currentStreak + 1 : 0;
      const bestStreak = Math.max(q.bestStreak, currentStreak);
      const badges = new Set(q.badges);

      if (totalCorrect >= 1) badges.add('first-correct');
      if (bestStreak >= 5) badges.add('streak-5');
      if (totalCorrect >= 15) badges.add('master-scholar');

      return {
        ...prev,
        quizStats: {
          totalAnswered,
          totalCorrect,
          currentStreak,
          bestStreak,
          badges: Array.from(badges),
        },
      };
    });
  }, []);

  const handleRoundComplete = useCallback((modeId, correctCount, totalCount) => {
    const pct = totalCount > 0 ? correctCount / totalCount : 0;
    if (pct < 0.7) return;
    setProgress((prev) => {
      const badges = new Set(prev.quizStats.badges);
      if (modeId === 'chain') badges.add('chain-master');
      if (modeId === 'prophecy') badges.add('prophecy-keeper');
      if (modeId === 'timeline') badges.add('timekeeper');
      return {
        ...prev,
        quizStats: {
          ...prev.quizStats,
          badges: Array.from(badges),
        },
      };
    });
  }, []);

  const handleLocateInExplorer = useCallback((node) => {
    setSelectedNode(null);
    setExplorerFocusMessianic(false);
    setExplorerFocusTarget(node);
    setActiveMode('explorer');
  }, []);

  const handleOpenExplorerFocus = useCallback(() => {
    setExplorerFocusMessianic(true);
    setExplorerFocusTarget(null);
    setActiveMode('explorer');
  }, []);

  return (
    <>
      <Header
        activeMode={activeMode}
        onModeChange={(mode) => {
          if (mode !== 'explorer') setExplorerFocusMessianic(false);
          setActiveMode(mode);
        }}
        completedErasCount={progress.completedEras.length}
        earnedBadgesCount={progress.quizStats.badges.length}
      />

      <main className={`main-shell ${activeMode === 'explorer' ? 'explorer-full' : ''}`}>
        {activeMode === 'story' && (
          <StoryJourney
            completedEras={progress.completedEras}
            onCompleteEra={handleCompleteEra}
            onSelectNode={setSelectedNode}
            onOpenExplorerFocus={handleOpenExplorerFocus}
          />
        )}

        {activeMode === 'explorer' && (
          <LineageExplorer
            onSelectNode={setSelectedNode}
            selectedNodeId={selectedNode?.id || null}
            focusTargetNode={explorerFocusTarget}
            onClearFocusTarget={() => setExplorerFocusTarget(null)}
            initialFocusMessianic={explorerFocusMessianic}
          />
        )}

        {activeMode === 'timeline' && (
          <LifespanTimeline onSelectNode={setSelectedNode} />
        )}

        {activeMode === 'quiz' && (
          <LineageQuiz
            quizStats={progress.quizStats}
            onRecordAnswer={handleRecordAnswer}
            onRoundComplete={handleRoundComplete}
            onSelectNode={setSelectedNode}
          />
        )}
      </main>

      <ProfileDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onSelectNode={setSelectedNode}
        onLocateInExplorer={handleLocateInExplorer}
      />
    </>
  );
}
