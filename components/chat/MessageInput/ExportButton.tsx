// ExportButton.tsx
import React from "react";
import { FileDown } from "lucide-react";

export default function ExportButton() {
  return (
    <div className="ml-2 relative">
      <button className="p-2 rounded hover:bg-gray-100" title="Export">
        <FileDown size={20} />
      </button>
      {/* Export dropdown (not implemented) */}
    </div>
  );
}
