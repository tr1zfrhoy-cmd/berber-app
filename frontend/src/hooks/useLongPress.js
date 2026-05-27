import { useRef, useCallback } from "react";

/**
 * useLongPress — detects a long-press on touch / mouse / pen.
 *
 * Returns props you spread onto any element. When the user presses and holds
 * for `delay` ms (without moving more than `moveThreshold` pixels), the
 * `callback` fires. A short haptic buzz is emitted on supported devices.
 *
 * The hook also prevents the browser's native context menu (the "Save image /
 * Copy link" sheet) and short-circuits the immediate click that would
 * otherwise follow the press.
 */
export default function useLongPress(callback, { delay = 450, moveThreshold = 8 } = {}) {
  const timerRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0 });
  const triggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = (e) => {
    triggeredRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    clear();
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      try { if ("vibrate" in navigator) navigator.vibrate(15); } catch {}
      callback(e);
    }, delay);
  };

  const onPointerMove = (e) => {
    if (!timerRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (dx * dx + dy * dy > moveThreshold * moveThreshold) clear();
  };

  const onPointerUp = () => clear();
  const onPointerCancel = () => clear();
  const onPointerLeave = () => clear();

  // If long-press fired, swallow the click that follows so we don't double-trigger.
  const onClick = (e) => {
    if (triggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      triggeredRef.current = false;
    }
  };

  // Kill the browser's native long-press context menu.
  const onContextMenu = (e) => { e.preventDefault(); };

  return {
    onPointerDown, onPointerMove, onPointerUp,
    onPointerCancel, onPointerLeave,
    onClick, onContextMenu,
  };
}
