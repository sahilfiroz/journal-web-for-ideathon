import React, { useEffect, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  time: number;
  opacity: number;
  size: number;
}

export const PencilGraphiteTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<TrailPoint[]>([]);
  const lastPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Handle high DPI / retina screens and window resizing
    const updateCanvasSize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Capture global mousemove events everywhere on the window (including over modals & iframes)
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const now = performance.now();

      // Interpolate points during quick mouse gestures to prevent dotted gaps
      if (lastPosRef.current) {
        const dx = x - lastPosRef.current.x;
        const dy = y - lastPosRef.current.y;
        const dist = Math.hypot(dx, dy);
        const timeDiff = now - lastPosRef.current.time;

        // Only interpolate if moved noticeably
        if (dist > 4 && timeDiff < 100) {
          const steps = Math.min(Math.floor(dist / 3), 12);
          for (let i = 1; i <= steps; i++) {
            const ratio = i / (steps + 1);
            pointsRef.current.push({
              x: lastPosRef.current.x + dx * ratio,
              y: lastPosRef.current.y + dy * ratio,
              time: now - (1 - ratio) * 15,
              opacity: 0.5,
              size: 3.2,
            });
          }
        }
      }

      pointsRef.current.push({
        x,
        y,
        time: now,
        opacity: 0.6,
        size: 3.5,
      });

      lastPosRef.current = { x, y, time: now };
    };

    // Listen on window with capture: true so modals or overlays cannot block the mouse trail
    window.addEventListener('mousemove', handleMouseMove, { capture: true, passive: true });

    // Animation & Graphite Render Loop
    const TRAIL_DURATION = 950; // ms duration for soft graphite dissipation

    const render = () => {
      const now = performance.now();

      // Clear the viewport area
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Filter out points that have exceeded lifetime
      pointsRef.current = pointsRef.current.filter(p => now - p.time < TRAIL_DURATION);

      const points = pointsRef.current;
      if (points.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < points.length; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];

          // Skip connecting points if too much time elapsed between movements (e.g. mouse left & returned)
          if (Math.abs(p2.time - p1.time) > 150) continue;

          const progress = (now - p2.time) / TRAIL_DURATION; // 0 to 1
          const alpha = Math.max(0, (1 - progress) * 0.42);
          const width = Math.max(1.2, (1 - progress * 0.6) * 3.4);

          // Subtle organic pencil shading: Soft graphite grey (#5a6678 / #6b7280)
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(100, 116, 139, ${alpha})`;
          ctx.lineWidth = width;
          ctx.stroke();

          // Soft ambient pencil aura for natural paper graphite texture
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(71, 85, 105, ${alpha * 0.28})`;
          ctx.lineWidth = width * 2.4;
          ctx.stroke();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 w-screen h-screen overflow-hidden"
      style={{
        pointerEvents: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
      }}
    />
  );
};
