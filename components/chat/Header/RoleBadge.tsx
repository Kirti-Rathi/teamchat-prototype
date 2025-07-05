// RoleBadge.tsx (Extracted badge component)
import { roleColors } from "../types";
import clsx from "clsx";
import { RoleBadgeProps } from "../types";

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={clsx(
        "ml-2 px-2 py-1 rounded text-xs font-semibold",
        roleColors[role || "viewer"]
      )}
    >
      {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Viewer"}
    </span>
  );
}
