'use client';

import { useEffect, useRef, useState } from 'react';
import { ref, push, onChildAdded, query, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Send, Users } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

export default function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);

  // Load messages on component mount
  useEffect(() => {
    const messagesRef = ref(database, 'messages');
    const recentMessagesQuery = query(messagesRef, limitToLast(100));

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
        setMessageCount((prev) => prev + 1);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    if (!isUsernameSet) {
      setShowUsernameInput(true);
      return;
    }

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
      setShowUsernameInput(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-foreground text-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="font-semibold">Live Chat</h3>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Users size={14} />
            <span>{messageCount}</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="text-center text-muted-foreground text-xs">
            Loading messages...
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs">
            No messages yet. Be the first to chat!
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-0.5 text-xs">
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-blue-500 truncate">
                {msg.username}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            <p className="text-foreground break-words leading-snug">
              {msg.message}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border space-y-2">
        {showUsernameInput && !isUsernameSet && (
          <form onSubmit={handleSetUsername} className="space-y-2">
            <input
              type="text"
              placeholder="Enter your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-2 py-1.5 bg-background text-foreground border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
            >
              Join Chat
            </button>
          </form>
        )}

        {isUsernameSet && (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Send a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-background text-foreground border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        )}

        {!isUsernameSet && !showUsernameInput && (
          <button
            onClick={() => setShowUsernameInput(true)}
            className="w-full px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
          >
            Join Chat
          </button>
        )}
      </div>
    </div>
  );
}
