import { Role } from "@/types/message";

export const roleColors: Record<Role, string> = {
  admin: "bg-blue-600 text-white",
  member: "bg-green-600 text-white",
  guest: "bg-yellow-500 text-white",
  viewer: "bg-gray-400 text-white",
};

export function formatRoleLabel(role: Role | null): string {
  if (!role) return "Viewer";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
