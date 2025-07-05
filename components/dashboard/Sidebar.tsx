"use client";
// import Link from "next/link";
import ChatItem from "./ChatItem";

// Types for our data models
type Chat = { id: string; title: string };

// Chat sidebar component
export default function Sidebar({
  chats,
  loading,
  onCreateChat,
  onDeleteChat
}: {
  chats: Chat[];
  loading: boolean;
  onCreateChat: () => void;
  onDeleteChat: (id: string) => void;
}) {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col border-r">
      <button
        className="m-4 mb-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
        onClick={onCreateChat}
        disabled={loading}
      >
        + New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {chats.length === 0 && (
            <li className="text-gray-400 px-2 py-2">No chats</li>
          )}
          {chats.map((chat) => (
            <li key={chat.id}>
              {/* <Link
                href={`/chat/${chat.id}`}
                className="block px-3 py-2 rounded hover:bg-gray-800 transition cursor-pointer truncate"
              >
                {chat.title}
              </Link> */}
              <ChatItem id={chat.id} title={chat.title} onDeleteChat={onDeleteChat} />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}