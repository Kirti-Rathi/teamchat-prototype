// types.ts
import { RefObject } from "react";
import { UserResource } from "@clerk/types";

export interface Message {
  id: string;
  chat_id: string;
  user_id: string | null;
  sender_type: "ai" | "user";
  content: string;
  created_at: string;
  updated_at: string;
  user?: { email?: string };
}

export type Role = "admin" | "member" | "guest" | "viewer";

export const roleColors: Record<Role, string> = {
  admin: "bg-blue-600 text-white",
  member: "bg-green-600 text-white",
  guest: "bg-yellow-500 text-white",
  viewer: "bg-gray-400 text-white",
};

export interface ChatContext {
  id: string;
  chat_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  created_at: string;
}

export type UserAvatarProps = {
  label: string;
  bgColor: string;
  textColor: string;
  position: string;
};

export type MessageAreaProps = {
  loading: boolean;
  messages: Message[];
  user: UserResource | null | undefined;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

export type MessageContentProps = {
  isAI: boolean;
  content: string;
};

export type MessageItemProps = {
  message: Message;
  user: UserResource | null | undefined;
};

export type MessageTimestampProps = {
  timestamp: string | Date;
};

export type ContextFilesSectionProps = {
  chatError?: boolean;
  chatContexts?: ChatContext[];
  handleChatFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveChatContext: (id: string, storage_path: string) => void;
};

export type ContextFileItemProps = {
  ctx: any;
  onRemove: (id: string, storage_path: string) => void;
};

export type HeaderProps = {
  chatTitle: string;
  role: Role | null;
  adminInfo?: {
    email?: string | undefined;
    username?: string | undefined;
  } | null;
  chatError?: boolean;
  chatContexts: ChatContext[];
  handleChatFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveChatContext: (id: string, storage_path: string) => void;
  handleSendInvites: (
    invites: { email: string; role: string }[]
  ) => Promise<
    | { success: boolean; error?: undefined }
    | { success: boolean; error: unknown }
  >;
};

export interface Invite {
  email: string;
  role: Role;
}

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (invites: Invite[]) => void;
}

export type RoleBadgeProps = {
  role: Role | null;
};

export type InputAreaProps = {
  input: string;
  setInput: (value: string) => void;
  canSend: boolean;
  loading: boolean;
  aiLoading: boolean;
  handleSend: (e: React.FormEvent) => void;
};

export type MessageInputProps = {
  input: string;
  setInput: (value: string) => void;
  handleSend: (e: React.FormEvent) => void;
  canSend: boolean;
  loading: boolean;
  aiLoading: boolean;
};

export type SubmitButtonProps = {
  canSend: boolean;
  input: string;
  loading: boolean;
  aiLoading: boolean;
};
