import { PointerEvent, MouseEvent, useCallback, useRef } from 'react';

export const useLongPress = (
  onLongPress: (text: string, position: { x: number; y: number }) => void,
  { delay = 500 } = {}
) => {
  // Fix: Use ReturnType<typeof setTimeout> for browser and Node compatibility instead of NodeJS.Timeout
  // Fix: Initialize useRef with null to fix "Expected 1 arguments, but got 0" error and be more explicit.
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  // Fix: Use imported PointerEvent type directly
  const start = useCallback((event: PointerEvent) => {
    // Stop listening for a long press if the user is using more than one finger
    if (event.pointerType === 'touch' && !event.isPrimary) {
      return;
    }
    longPressTriggered.current = false;
    timeout.current = setTimeout(() => {
      longPressTriggered.current = true;
    }, delay);
  }, [delay]);

  // Fix: Use imported PointerEvent type directly
  const clear = useCallback((event: PointerEvent) => {
      timeout.current && clearTimeout(timeout.current);
      
      const selectedText = window.getSelection()?.toString().trim();

      if (longPressTriggered.current && selectedText) {
          // Prevent the default context menu
          event.preventDefault();
          onLongPress(selectedText, { x: event.clientX, y: event.clientY });
      }
      
      longPressTriggered.current = false;
    }, [onLongPress]
  );

  return {
    onPointerDown: start,
    onPointerUp: clear,
    // Fix: Changed event type to MouseEvent to match React's onContextMenu prop type.
    onContextMenu: (e: MouseEvent) => {
        // Prevent context menu if a long press was triggered, to avoid conflicts.
        if (longPressTriggered.current) {
            e.preventDefault();
        }
    },
    onPointerLeave: () => {
        timeout.current && clearTimeout(timeout.current);
        longPressTriggered.current = false;
    },
  };
};
