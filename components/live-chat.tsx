'use client';

import { useEffect, useRef, useState } from 'react';
import { ref, push, onChildAdded, query, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Send, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Load messages on component mount
  useEffect(() => {
    if (!isOpen) return;

    const messagesRef = ref(database, 'messages');
    const recentMessagesQuery = query(messagesRef, limitToLast(50));

    const unsubscribe = onChildAdded(recentMessagesQuery, (snapshot) => {
      const data = snapshot.val();
      const messageId = snapshot.key;

      if (data && messageId) {
        setMessages((prev) => {
          // Check if message already exists
          if (prev.some((msg) => msg.id === messageId)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: messageId,
              username: data.username || 'Anonymous',
              message: data.message,
              timestamp: data.timestamp || Date.now(),
            },
          ];
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !username.trim()) return;

    try {
      const messagesRef = ref(database, 'messages');
      await push(messagesRef, {
        username: username,
        message: inputValue,
        timestamp: Date.now(),
      });

      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all z-40 flex items-center gap-2"
        title="Open live chat"
      >
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold">Live Chat</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 w-80 h-96 bg-card rounded-lg border border-border shadow-2xl flex flex-col z-40">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-foreground text-background rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">Live Chat</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-background/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="text-center text-muted-foreground text-sm">
                Loading messages...
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {msg.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-foreground bg-muted p-2 rounded break-words">
                  {msg.message}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isUsernameSet ? (
            <form onSubmit={handleSetUsername} className="p-4 border-t border-border">
              <input
                type="text"
                placeholder="Enter your name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full mt-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Join Chat
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-3 py-2 bg-background text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
