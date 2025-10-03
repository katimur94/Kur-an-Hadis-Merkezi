import { PointerEvent, MouseEvent, useCallback, useRef } from 'react';

export const useLongPress = (
  onLongPress: (text: string, position: { x: number; y: number }) => void,
  { delay = 500 } = {}
) => {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  // Ref to store the pointer type from onPointerDown
  const pointerType = useRef<string | null>(null);

  const start = useCallback((event: PointerEvent) => {
    // Ignore multi-touch events
    if (event.pointerType === 'touch' && !event.isPrimary) {
      return;
    }
    // Store the pointer type to differentiate between mouse and touch events later
    pointerType.current = event.pointerType;
    longPressTriggered.current = false;
    
    // Set a timer. When it fires, it signifies that a long press has occurred.
    timeout.current = setTimeout(() => {
      longPressTriggered.current = true;
    }, delay);
  }, [delay]);

  const clear = useCallback((event: PointerEvent) => {
      // Always clear the timer when the pointer is released
      timeout.current && clearTimeout(timeout.current);
      
      // For mouse devices, trigger the action on pointer up after the delay.
      // This preserves the "long left-click" functionality on desktop.
      if (pointerType.current === 'mouse' && longPressTriggered.current) {
          const selectedText = window.getSelection()?.toString().trim();
          if (selectedText) {
              onLongPress(selectedText, { x: event.clientX, y: event.clientY });
          }
      }
      
      // Reset the long press trigger
      longPressTriggered.current = false;
    }, [onLongPress]
  );

  const handleContextMenu = (e: MouseEvent) => {
      // For touch devices, the contextmenu event is the long-press trigger.
      if (pointerType.current === 'touch' && longPressTriggered.current) {
          const selectedText = window.getSelection()?.toString().trim();
          if (selectedText) {
              // Prevent the native context menu (copy/paste) from appearing
              e.preventDefault();
              onLongPress(selectedText, { x: e.clientX, y: e.clientY });
          }
      }
      
      // Prevent default context menu if a long press was triggered on any device.
      if (longPressTriggered.current) {
          e.preventDefault();
      }
  };

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onContextMenu: handleContextMenu,
    onPointerLeave: () => {
        timeout.current && clearTimeout(timeout.current);
        longPressTriggered.current = false;
    },
  };
};
