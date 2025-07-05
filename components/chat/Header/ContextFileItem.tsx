// ContextFileItem.tsx (Sub-component for file items)
import { FileText, Trash } from "lucide-react";
import { ContextFileItemProps } from "../types";

export function ContextFileItem({ ctx, onRemove }: ContextFileItemProps) {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
      <a
        href={ctx.public_url}
        target="_blank"
        className="flex items-center gap-1 text-green-700 hover:underline"
      >
        <FileText className="w-4 h-4" />
        {ctx.file_name}
      </a>
      <button
        onClick={() => onRemove(ctx.id, ctx.storage_path)}
        className="text-gray-500 hover:text-red-600"
        aria-label="Delete context"
      >
        <Trash className="w-4 h-4" />
      </button>
    </div>
  );
}
