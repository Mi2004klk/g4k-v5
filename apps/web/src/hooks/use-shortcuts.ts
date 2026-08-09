import { useEffect } from 'react';

export function useShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+B / Cmd+B: Toggle Sidebar
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('shortcut-toggle-sidebar'));
      }

      // Ctrl+/ / Cmd+/: Toggle Help
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('shortcut-toggle-help'));
      }

      // Ctrl+N / Cmd+N: New Item Action
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('shortcut-action-new'));
      }
      
      // Ctrl+K is usually handled by cmDK / Command primitive globally, but we can emit an event just in case
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // cmdk handles its own preventDefault and checking
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
