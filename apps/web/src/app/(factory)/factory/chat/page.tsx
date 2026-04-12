'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatIST } from '@/lib/utils';

/* ---------- Types ---------- */

interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  memberCount: number;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: { id: string; name: string };
  createdAt: string;
}

/* ---------- Component ---------- */

export default function ChatPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  // New room form
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [memberIds, setMemberIds] = useState('');

  const { data: rooms, isLoading: loadingRooms } = useQuery<ChatRoom[]>({
    queryKey: ['chat-rooms'],
    queryFn: () => apiCall<ChatRoom[]>({ url: '/chat/rooms' }),
  });

  const { data: messages, isLoading: loadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', selectedRoomId],
    queryFn: () => apiCall<ChatMessage[]>({ url: `/chat/rooms/${selectedRoomId}/messages` }),
    enabled: !!selectedRoomId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createRoom = (): void => {
    start(async () => {
      const ids = memberIds.split(',').map((s) => s.trim()).filter(Boolean);
      await apiCall({
        url: '/chat/rooms',
        method: 'POST',
        data: { name: roomName, memberIds: ids },
      });
      setShowNewRoom(false);
      setRoomName(''); setMemberIds('');
      qc.invalidateQueries({ queryKey: ['chat-rooms'] });
    });
  };

  const sendMessage = (): void => {
    if (!selectedRoomId || !messageText.trim()) return;
    start(async () => {
      await apiCall({
        url: '/chat/messages',
        method: 'POST',
        data: { roomId: selectedRoomId, content: messageText.trim() },
      });
      setMessageText('');
      qc.invalidateQueries({ queryKey: ['chat-messages', selectedRoomId] });
      qc.invalidateQueries({ queryKey: ['chat-rooms'] });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const inputClass =
    'w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200';

  const selectedRoom = (rooms ?? []).find((r) => r.id === selectedRoomId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Chat</h1>
          <p className="mt-1 text-neutral-600">Team communication</p>
        </div>
        <Button onClick={() => setShowNewRoom(true)}>+ New room</Button>
      </div>

      {/* New room form */}
      {showNewRoom && (
        <div className="mt-4 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New chat room</h2>
          <div className="mt-4 space-y-4">
            <input
              placeholder="Room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Member IDs (comma-separated)"
              value={memberIds}
              onChange={(e) => setMemberIds(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              <Button onClick={createRoom} disabled={pending || !roomName}>
                {pending ? 'Creating...' : 'Create room'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewRoom(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat layout */}
      <div className="mt-6 flex h-[calc(100vh-280px)] min-h-[400px] overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {/* Left panel: rooms */}
        <div className="w-72 flex-shrink-0 border-r border-neutral-200 overflow-y-auto">
          {loadingRooms ? (
            <div className="px-4 py-8 text-center text-neutral-500">Loading...</div>
          ) : (rooms ?? []).length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500 text-sm">
              No chat rooms yet. Create one to start.
            </div>
          ) : (
            (rooms ?? []).map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                  selectedRoomId === room.id ? 'bg-brand-50 border-r-2 border-brand-700' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-brand-900 text-sm">{room.name}</span>
                  <span className="text-xs text-neutral-400">{room.memberCount}</span>
                </div>
                {room.lastMessage && (
                  <p className="mt-0.5 truncate text-xs text-neutral-500">{room.lastMessage}</p>
                )}
                {room.lastMessageAt && (
                  <p className="mt-0.5 text-xs text-neutral-400">{formatIST(room.lastMessageAt)}</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Right panel: messages */}
        <div className="flex flex-1 flex-col">
          {!selectedRoomId ? (
            <div className="flex flex-1 items-center justify-center text-neutral-500">
              Select a room to start chatting
            </div>
          ) : (
            <>
              {/* Room header */}
              <div className="border-b border-neutral-200 px-5 py-3">
                <div className="font-semibold text-brand-900">{selectedRoom?.name ?? 'Chat'}</div>
                <div className="text-xs text-neutral-400">
                  {selectedRoom?.memberCount ?? 0} members
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-center text-neutral-500">Loading messages...</div>
                ) : (messages ?? []).length === 0 ? (
                  <div className="text-center text-neutral-500 text-sm">
                    No messages yet. Send the first one!
                  </div>
                ) : (
                  (messages ?? []).map((msg) => (
                    <div key={msg.id} className="group">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-brand-800">{msg.sender.name}</span>
                        <span className="text-xs text-neutral-400">{formatIST(msg.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-neutral-700">{msg.content}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send form */}
              <div className="border-t border-neutral-200 px-5 py-3">
                <div className="flex gap-2">
                  <input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <Button onClick={sendMessage} disabled={pending || !messageText.trim()}>
                    {pending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
