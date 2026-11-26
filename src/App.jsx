import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StoryJourney from './components/StoryJourney';
import LineageExplorer from './components/LineageExplorer';
import LifespanTimeline from './components/LifespanTimeline';
import LineageQuiz from './components/LineageQuiz';
import ProfileDrawer from './components/ProfileDrawer';

const STORAGE_KEY = 'promised_offspring_progress_v2';

const DEFAULT_FAMILY = {
  enabled: false,
  turnIndex: 0,
  players: [
    { id: 'p-1', name: 'Kids Team', score: 0 },
    { id: 'p-2', name: 'Parents Team', score: 0 },
  ],
};

const DEFAULT_PROGRESS = {
  xp: 0,
  soundEnabled: true,
  completedEras: [],
  completedMiniGames: [],
  unsealedProphecies: [],
  family: DEFAULT_FAMILY,
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
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('promised_offspring_progress_v1');
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    const savedPlayers = Array.isArray(parsed.family?.players) && parsed.family.players.length > 0
      ? parsed.family.players
      : DEFAULT_FAMILY.players;
    return {
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
      completedEras: Array.isArray(parsed.completedEras) ? parsed.completedEras : [],
      completedMiniGames: Array.isArray(parsed.completedMiniGames) ? parsed.completedMiniGames : [],
      unsealedProphecies: Array.isArray(parsed.unsealedProphecies) ? parsed.unsealedProphecies : [],
      family: {
        enabled: Boolean(parsed.family?.enabled),
        turnIndex: Math.min(parsed.family?.turnIndex || 0, savedPlayers.length - 1),
        players: savedPlayers,
      },
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

function advanceFamilyTurn(family, pointsEarned = 0) {
  if (!family.enabled || family.players.length === 0) return family;
  const idx = family.turnIndex % family.players.length;
  const nextPlayers = family.players.map((p, i) =>
    i === idx ? { ...p, score: p.score + pointsEarned } : p
  );
  return {
    ...family,
    players: nextPlayers,
    turnIndex: (idx + 1) % nextPlayers.length,
  };
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

  const handleToggleSound = useCallback(() => {
    setProgress((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  // Family Worship Mode controls
  const handleToggleFamily = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      family: { ...prev.family, enabled: !prev.family.enabled },
    }));
  }, []);

  const handleAddFamilyPlayer = useCallback((name) => {
    setProgress((prev) => {
      if (prev.family.players.length >= 6) return prev;
      const newPlayer = { id: `p-${Date.now()}`, name, score: 0 };
      return {
        ...prev,
        family: {
          ...prev.family,
          players: [...prev.family.players, newPlayer],
        },
      };
    });
  }, []);

  const handleRemoveFamilyPlayer = useCallback((id) => {
    setProgress((prev) => {
      if (prev.family.players.length <= 2) return prev;
      const nextPlayers = prev.family.players.filter((p) => p.id !== id);
      return {
        ...prev,
        family: {
          ...prev.family,
          players: nextPlayers,
          turnIndex: prev.family.turnIndex % nextPlayers.length,
        },
      };
    });
  }, []);

  const handleNextFamilyTurn = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      family: {
        ...prev.family,
        turnIndex: (prev.family.turnIndex + 1) % prev.family.players.length,
      },
    }));
  }, []);

  const handleResetFamilyScores = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      family: {
        ...prev.family,
        turnIndex: 0,
        players: prev.family.players.map((p) => ({ ...p, score: 0 })),
      },
    }));
  }, []);

  const handleSetFamilyPreset = useCallback((names) => {
    setProgress((prev) => ({
      ...prev,
      family: {
        ...prev.family,
        enabled: true,
        turnIndex: 0,
        players: names.map((name, i) => ({ id: `preset-${i}-${Date.now()}`, name, score: 0 })),
      },
    }));
  }, []);

  const handleCompleteEra = useCallback((eraId) => {
    setProgress((prev) => {
      const alreadyDone = prev.completedEras.includes(eraId);
      return {
        ...prev,
        xp: alreadyDone ? prev.xp : prev.xp + 50,
        completedEras: alreadyDone ? prev.completedEras : [...prev.completedEras, eraId],
        family: advanceFamilyTurn(prev.family, 2),
      };
    });
  }, []);

  const handleCompleteMiniGame = useCallback((eraId) => {
    setProgress((prev) => {
      const alreadyDone = prev.completedMiniGames.includes(eraId);
      return {
        ...prev,
        xp: alreadyDone ? prev.xp : prev.xp + (eraId === 'era-7' ? 75 : 50),
        completedMiniGames: alreadyDone
          ? prev.completedMiniGames
          : [...prev.completedMiniGames, eraId],
        family: advanceFamilyTurn(prev.family, 2),
      };
    });
  }, []);

  const handleUnsealProphecy = useCallback((prophecyId) => {
    setProgress((prev) => {
      if (prev.unsealedProphecies.includes(prophecyId)) return prev;
      return {
        ...prev,
        xp: prev.xp + 25,
        unsealedProphecies: [...prev.unsealedProphecies, prophecyId],
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
        xp: prev.xp + (isCorrect ? 20 : 0),
        family: advanceFamilyTurn(prev.family, isCorrect ? 1 : 0),
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
        xp: prev.xp + 40,
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

  const familyProps = {
    familyState: progress.family,
    onToggleEnabled: handleToggleFamily,
    onAddPlayer: handleAddFamilyPlayer,
    onRemovePlayer: handleRemoveFamilyPlayer,
    onNextTurn: handleNextFamilyTurn,
    onResetScores: handleResetFamilyScores,
    onSetPreset: handleSetFamilyPreset,
  };

  return (
    <div className={`app-shell ${activeMode === 'explorer' ? 'explorer-mode' : ''}`}>
      <Header
        activeMode={activeMode}
        onModeChange={(mode) => {
          if (mode !== 'explorer') setExplorerFocusMessianic(false);
          setActiveMode(mode);
        }}
        xp={progress.xp}
        completedErasCount={progress.completedEras.length}
        earnedBadgesCount={progress.quizStats.badges.length}
        soundEnabled={progress.soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <main className={`main-shell ${activeMode === 'explorer' ? 'explorer-full' : ''}`}>
        {activeMode === 'story' && (
          <StoryJourney
            completedEras={progress.completedEras}
            completedMiniGames={progress.completedMiniGames}
            unsealedProphecies={progress.unsealedProphecies}
            xp={progress.xp}
            soundEnabled={progress.soundEnabled}
            familyProps={familyProps}
            onCompleteEra={handleCompleteEra}
            onCompleteMiniGame={handleCompleteMiniGame}
            onUnsealProphecy={handleUnsealProphecy}
            onSelectNode={setSelectedNode}
            onLocateInExplorer={handleLocateInExplorer}
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
            soundEnabled={progress.soundEnabled}
            familyProps={familyProps}
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
    </div>
  );
}
