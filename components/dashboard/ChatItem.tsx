import Link from "next/link";
import {Trash } from "lucide-react";

interface ChatItemProps {
  id: string;
  title: string;
  onDeleteChat: (id: string) => void;
}

export default function ChatItem({ id, title, onDeleteChat }: ChatItemProps) {
  return (<div  className="flex items-center justify-between block px-3 py-2 rounded hover:bg-gray-800 transition">
    <Link href={`/chat/${id}`} className="truncate cursor-pointer" >
      {title}
    </Link>
    <button
      onClick={() => onDeleteChat(id)}
      className="text-red-500 hover:text-red-600 cursor-pointer"
    >
      <Trash />
    </button>
    </div>
  );
}
