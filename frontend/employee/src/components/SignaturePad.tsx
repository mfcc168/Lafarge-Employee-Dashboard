import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';

type SignaturePadProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onClear: () => void;
};

const SignaturePad = ({ value, onChange, onClear }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState<boolean>(() => Boolean(value));

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deviceRatio = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = Math.max(container.clientHeight, 220);

    canvas.width = width * deviceRatio;
    canvas.height = height * deviceRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(deviceRatio, deviceRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1f2937'; // slate-800

    if (value) {
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
      };
      image.src = value;
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }, [value]);

  useEffect(() => {
    initializeCanvas();
    const container = containerRef.current;
    if (!container) return;

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      initializeCanvas();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [initializeCanvas]);

  useEffect(() => {
    setHasSignature(Boolean(value));
  }, [value]);

  const getCursorPosition = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const commitStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
    setHasSignature(true);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = getCursorPosition(event);
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCursorPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.releasePointerCapture(event.pointerId);
    ctx.closePath();
    isDrawingRef.current = false;
    commitStroke();
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.releasePointerCapture(event.pointerId);
    ctx.closePath();
    isDrawingRef.current = false;
    commitStroke();
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.closePath();
    canvas.releasePointerCapture(event.pointerId);
    isDrawingRef.current = false;
    commitStroke();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    onChange('');
    onClear();
    setHasSignature(false);
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="w-full h-56 sm:h-64 border-2 border-dashed border-emerald-300 bg-white rounded-2xl shadow-inner overflow-hidden touch-none select-none"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
          aria-label="Signature input canvas"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-xs text-slate-500">
          {hasSignature ? 'Signature captured. You can clear and retry if needed.' : 'Draw your signature directly in the box above.'}
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="self-start sm:self-auto px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150"
        >
          Clear Signature
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
