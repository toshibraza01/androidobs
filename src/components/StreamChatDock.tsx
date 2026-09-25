import React, { useState, useEffect, useRef } from 'react';
import { Gift, Smile, Send, MessageSquare, ChevronRight, X, Users, Crown, Shield } from 'lucide-react';

interface ChatMessage {
  id: string;
  user: string;
  color: string;
  badge?: 'broadcaster' | 'mod' | 'vip' | 'sub';
  text: string;
  time: string;
  isAction?: boolean;
}

export const StreamChatDock: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'StreamMaster',
      color: '#e11d48',
      badge: 'broadcaster',
      text: 'Welcome to the live broadcast! OBS Mobile engine running 1080p60.',
      time: '12:00'
    },
    {
      id: '2',
      user: 'pixel_gamer',
      color: '#3b82f6',
      badge: 'sub',
      text: 'Audio levels sound crystal clear, zero dropped frames!',
      time: '12:01'
    },
    {
      id: '3',
      user: 'testkanal',
      color: '#eab308',
      badge: 'vip',
      text: 'Hey is that the native OBS Studio Android compositor?',
      time: '12:02'
    },
    {
      id: '4',
      user: 'cyber_voyager',
      color: '#10b981',
      badge: 'mod',
      text: 'Sure is! Dual OES hardware textures and MediaCodec AAC pipeline.',
      time: '12:03'
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>('testkanal');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-simulate incoming chat messages
  useEffect(() => {
    const chatters = [
      { user: 'stream_enjoyer', color: '#ec4899', text: 'Love the picture-in-picture layout!' },
      { user: 'android_dev', color: '#10b981', text: 'Native C++ audio mixer working like a charm.' },
      { user: 'twitch_lurker', color: '#8b5cf6', text: 'PogChamp stream quality is insane!' },
      { user: 'vortex_fps', color: '#f59e0b', text: 'Can you show the Studio Mode transition?' }
    ];

    const interval = setInterval(() => {
      const pick = chatters[Math.floor(Math.random() * chatters.length)];
      setMessages(prev => [
        ...prev.slice(-30),
        {
          id: Math.random().toString(),
          user: pick.user,
          color: pick.color,
          badge: 'sub',
          text: pick.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        user: 'You',
        color: '#e11d48',
        badge: 'broadcaster',
        text: inputVal,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputVal('');
    setReplyTo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="w-72 bg-[#181921] border-r border-[#2b2d3a] flex flex-col h-full select-none shrink-0 font-sans">
      {/* Dock Header */}
      <div className="h-9 px-3 bg-[#14151b] border-b border-[#2b2d3a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#2b66ff]" />
          <span className="text-xs font-bold tracking-wider uppercase text-neutral-300">
            Stream Chat
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Users className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono font-medium text-emerald-400">2,842</span>
          <button
            onClick={onClose}
            className="w-5 h-5 ml-1 rounded flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Gift Sub Banner (matching Reference 4) */}
      <div className="mx-2 mt-2 p-2 bg-gradient-to-r from-purple-900/40 to-pink-900/30 border border-purple-800/40 rounded flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-600/30 flex items-center justify-center text-amber-400">
            <Gift className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-purple-200">
              Gift a Sub now to be #1!
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-purple-400" />
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 text-xs text-neutral-300"
      >
        <div className="text-[11px] text-neutral-500 text-center py-1 border-b border-neutral-800/60">
          Welcome to the chat room!
        </div>

        {messages.map(msg => (
          <div key={msg.id} className="leading-snug hover:bg-neutral-900/40 p-1 rounded transition-colors">
            <span className="text-[10px] text-neutral-500 mr-1.5">{msg.time}</span>

            {/* Badge Icon */}
            {msg.badge === 'broadcaster' && (
              <span className="inline-flex items-center px-1 py-0.2 mr-1 rounded bg-rose-600 text-[9px] font-bold text-white uppercase">
                <Crown className="w-2.5 h-2.5 mr-0.5" /> Host
              </span>
            )}
            {msg.badge === 'mod' && (
              <span className="inline-flex items-center px-1 py-0.2 mr-1 rounded bg-emerald-600 text-[9px] font-bold text-white uppercase">
                <Shield className="w-2.5 h-2.5 mr-0.5" /> Mod
              </span>
            )}
            {msg.badge === 'vip' && (
              <span className="inline-flex items-center px-1 py-0.2 mr-1 rounded bg-pink-600 text-[9px] font-bold text-white uppercase">
                VIP
              </span>
            )}

            <button
              onClick={() => setReplyTo(msg.user)}
              style={{ color: msg.color }}
              className="font-bold mr-1 hover:underline cursor-pointer"
            >
              {msg.user}:
            </button>
            <span className="text-neutral-200 break-words">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Reply Banner */}
      {replyTo && (
        <div className="px-3 py-1 bg-[#1e202a] border-t border-[#2b2d3a] flex items-center justify-between text-[11px] text-neutral-400">
          <span>Replying to <b className="text-emerald-400">@{replyTo}</b></span>
          <button onClick={() => setReplyTo(null)} className="hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-2 bg-[#14151b] border-t border-[#2b2d3a]">
        <div className="flex items-center gap-1.5 bg-[#222430] border border-[#343746] rounded-md px-2 py-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Send a message..."
            className="flex-1 bg-transparent text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden"
          />
          <button className="text-neutral-400 hover:text-white">
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSend}
            className="w-6 h-6 rounded bg-[#2b66ff] hover:bg-[#1f54e0] text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
