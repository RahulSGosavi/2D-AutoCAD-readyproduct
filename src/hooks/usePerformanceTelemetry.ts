import { useEffect } from 'react';
import { performanceMonitor } from '../services/telemetry/perfMonitor';
import { useEditorStore } from '../state/useEditorStore';

export const usePerformanceTelemetry = () => {
  const elements = useEditorStore((state) => state.elements);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const frameDuration = now - lastTime;
      lastTime = now;
      performanceMonitor.record('frame', frameDuration);
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    const logInterval = setInterval(() => {
      const summary = performanceMonitor.summary();
      if (summary.length > 0) {
        console.table(summary);
      }
    }, 10000);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(logInterval);
    };
  }, [elements.length]);
};

