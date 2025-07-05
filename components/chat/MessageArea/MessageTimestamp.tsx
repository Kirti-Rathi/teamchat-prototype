// MessageTimestamp.tsx
import { MessageTimestampProps } from "../types";

export default function MessageTimestamp({ timestamp }: MessageTimestampProps) {
  return (
    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
      {new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}
