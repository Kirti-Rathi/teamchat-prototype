"use client";
import Link from "next/link";
import {Trash } from "lucide-react";

type Workspace = { id: string; name: string };

// Workspace card component
export default function WorkspaceCard({ workspace, onDeleteWorkspace }: { workspace: Workspace, onDeleteWorkspace: (id: string) => void }) {
  return (<div className="flex items-center justify-between block px-3 py-2 rounded hover:bg-gray-800 transition cursor-pointer">
    <Link
      key={workspace.id}
      href={`/workspace/${workspace.id}`}
      className="block p-6 bg-white rounded shadow hover:bg-blue-50 border border-gray-200 transition"
    >
      <div className="font-bold text-lg mb-2">{workspace.name}</div>
      <div className="text-xs text-gray-500">ID: {workspace.id}</div>
    </Link>
    <button
      onClick={() => onDeleteWorkspace(workspace.id)}
      className="text-red-500 hover:text-red-600"
    >
      <Trash />
    </button>
    </div>
  );
}