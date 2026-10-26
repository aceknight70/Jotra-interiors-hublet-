import React, { useState, useRef, useEffect } from 'react';
import { Store, Handshake, MessageCircle, GripVertical } from 'lucide-react';

interface DraggableFloatingButtonsProps {
  onOpenTenant: () => void;
  onOpenAlly: () => void;
  onOpenChat?: () => void;
}

export default function DraggableFloatingButtons({
  onOpenTenant,
  onOpenAlly,
  onOpenChat
}: DraggableFloatingButtonsProps) {
  // Position from bottom-right initially
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMovedRef = useRef(false);

  // Initialize position to bottom right once mounted
  useEffect(() => {
    const defaultX = Math.max(16, window.innerWidth - 90);
    const defaultY = Math.max(16, window.innerHeight - 240);
    setPosition({ x: defaultX, y: defaultY });

    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return null;
        const clampedX = Math.min(Math.max(16, prev.x), window.innerWidth - 90);
        const clampedY = Math.min(Math.max(16, prev.y), window.innerHeight - 240);
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position?.x || 0,
      posY: position?.y || 0
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }
    const nextX = Math.min(Math.max(10, startPosRef.current.posX + dx), window.innerWidth - 85);
    const nextY = Math.min(Math.max(10, startPosRef.current.posY + dy), window.innerHeight - 220);
    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  if (!position) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        touchAction: 'none'
      }}
      className="flex flex-col items-center gap-2 select-none"
    >
      {/* Drag Handle Bar */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-grab active:cursor-grabbing w-12 py-1 flex items-center justify-center rounded-t-lg bg-neutral-900/90 border border-neutral-700/80 text-neutral-400 hover:text-white shadow-md backdrop-blur-md"
        title="Drag buttons anywhere"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Button 1: GREEN "TENANT" */}
      <button
        onClick={() => {
          if (!hasMovedRef.current) onOpenTenant();
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-16 h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[11px] rounded-2xl shadow-xl shadow-emerald-950/60 flex flex-col items-center justify-center gap-0.5 border-2 border-emerald-400/40 transition-transform cursor-pointer"
        title="HubTenant: Resident Mini-Storefronts"
      >
        <Store className="w-4 h-4 pointer-events-none" />
        <span className="leading-none tracking-wider pointer-events-none">TENANT</span>
      </button>

      {/* Button 2: BLUE "ALLY" */}
      <button
        onClick={() => {
          if (!hasMovedRef.current) onOpenAlly();
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-16 h-12 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-[11px] rounded-2xl shadow-xl shadow-blue-950/60 flex flex-col items-center justify-center gap-0.5 border-2 border-blue-400/40 transition-transform cursor-pointer"
        title="HubAlly: Verified Allies"
      >
        <Handshake className="w-4 h-4 pointer-events-none" />
        <span className="leading-none tracking-wider pointer-events-none">ALLY</span>
      </button>

      {/* Button 3: ROUND CHAT BUTTON */}
      <button
        onClick={() => {
          if (!hasMovedRef.current) {
            if (onOpenChat) {
              onOpenChat();
            } else {
              window.open('https://wa.me/2348110891806', '_blank');
            }
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-13 h-13 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-neutral-950 font-black rounded-full shadow-xl shadow-amber-950/60 flex items-center justify-center border-2 border-amber-300 transition-transform cursor-pointer"
        title="Jotra Live Chat & WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-neutral-950 pointer-events-none" />
      </button>
    </div>
  );
}
