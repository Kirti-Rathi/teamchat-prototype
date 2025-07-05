// UserAvatar.tsx
import { UserAvatarProps } from "../types";

export default function UserAvatar({
  label,
  bgColor,
  textColor,
  position,
}: UserAvatarProps) {
  return (
    <div className={`flex flex-col items-center ${position}`}>
      <div
        className={`w-8 h-8 ${bgColor} ${textColor} rounded-full flex items-center justify-center font-bold`}
      >
        {label}
      </div>
    </div>
  );
}
