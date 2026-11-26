import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Sparkles, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { mountQuestWorld3D } from '../three/buildQuestScene';
import { ALL_STORIES } from '../utils/dataStore';

export default function QuestWorld3D({
  activeIndex,
  completedEras,
  celebrationTrigger,
  onSelectEra,
  onToggleLiteMode,
}) {
  const canvasRef = useRef(null);
  const controllerRef = useRef(null);
  const onSelectEraRef = useRef(onSelectEra);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    onSelectEraRef.current = onSelectEra;
  }, [onSelectEra]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let ctrl = null;
    try {
      ctrl = mountQuestWorld3D(canvas, {
        reducedMotion,
        onSelectEra: (idx) => onSelectEraRef.current?.(idx),
      });
      controllerRef.current = ctrl;
    } catch {
      queueMicrotask(() => setWebglError(true));
      return;
    }

    return () => {
      ctrl?.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setActiveEra(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    controllerRef.current?.setCompletedEras(completedEras);
  }, [completedEras]);

  useEffect(() => {
    if (celebrationTrigger && celebrationTrigger.tick > 0) {
      controllerRef.current?.triggerCelebration(celebrationTrigger.eraIndex);
    }
  }, [celebrationTrigger]);

  if (webglError) {
    return (
      <div className="world3d-fallback">
        <span>3D view unavailable on this browser — using crisp 2D Quest Trail below!</span>
      </div>
    );
  }

  const story = ALL_STORIES[activeIndex];

  return (
    <div className="world3d-shell" aria-label="Interactive 3D Seven-Island Quest Diorama">
      <canvas ref={canvasRef} className="world3d-canvas" />

      {/* Top Overlay: Active Island Badge + Controls */}
      <div className="world3d-overlay-top">
        <div className="world3d-island-pill">
          <Sparkles size={13} color="#F4DB9F" />
          <span>
            Island {story.chapter}: <strong>{story.title}</strong>
          </span>
        </div>

        <div className="world3d-top-actions">
          <button
            type="button"
            className="world3d-mini-btn"
            onClick={() => controllerRef.current?.resetCamera()}
            title="Reset 3D camera"
            aria-label="Reset 3D camera"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            className="world3d-mini-btn"
            onClick={onToggleLiteMode}
            title="Switch to 2D Lite mode"
          >
            <Layers size={13} />
            <span>2D Lite</span>
          </button>
        </div>
      </div>

      {/* Bottom Overlay: Swipe/Tap Hint + Quick Prev/Next Island Hop */}
      <div className="world3d-overlay-bottom">
        <span className="world3d-hint">Drag to tilt · Tap any 3D island to hop!</span>
        <div className="world3d-hop-btns">
          <button
            type="button"
            className="world3d-hop-btn"
            disabled={activeIndex <= 0}
            onClick={() => onSelectEra(Math.max(0, activeIndex - 1))}
            aria-label="Hop to previous 3D island"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="world3d-hop-btn"
            disabled={activeIndex >= ALL_STORIES.length - 1}
            onClick={() => onSelectEra(Math.min(ALL_STORIES.length - 1, activeIndex + 1))}
            aria-label="Hop to next 3D island"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
