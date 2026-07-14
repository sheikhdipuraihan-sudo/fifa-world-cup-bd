'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Space', action: 'Play / Pause' },
    { key: 'F', action: 'Fullscreen' },
    { key: 'M', action: 'Mute / Unmute' },
    { key: 'P', action: 'Picture in Picture' },
    { key: '→', action: 'Skip +5 seconds' },
    { key: '←', action: 'Skip -5 seconds' },
    { key: '↑', action: 'Volume up' },
    { key: '↓', action: 'Volume down' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors z-40"
        title="Keyboard shortcuts"
      >
        <HelpCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded transition-colors">
                <X size={20} className="text-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-foreground border border-border">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-border">
              <button onClick={() => setIsOpen(false)} className="w-full px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
