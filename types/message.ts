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
