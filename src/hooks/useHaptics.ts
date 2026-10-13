/**
 * Android haptic vibration feedback for native app feel.
 */
export function useHaptics() {
  const trigger = (type: 'tap' | 'success' | 'warning' | 'heavy' = 'tap') => {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

    try {
      if (type === 'tap') {
        navigator.vibrate(10);
      } else if (type === 'success') {
        navigator.vibrate([15, 30, 20]);
      } else if (type === 'warning') {
        navigator.vibrate([30, 40, 30]);
      } else if (type === 'heavy') {
        navigator.vibrate(40);
      }
    } catch {
      // Ignore vibration errors if restricted by browser permissions
    }
  };

  return { trigger };
}
