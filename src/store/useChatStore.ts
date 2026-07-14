import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/utils";

export type Role = "user" | "assistant";

export interface Attachment {
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  attachments?: Attachment[];
  error?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  pinned: boolean;
  favorite?: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  createChat: () => string;
  setActiveChat: (id: string) => void;
  addMessage: (chatId: string, message: Omit<Message, "id" | "createdAt">) => void;
  updateLastMessage: (chatId: string, content: string, error?: boolean) => void;
  deleteChat: (id: string) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  truncateChat: (chatId: string, fromMessageId: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
  clearAll: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,

      createChat: () => {
        const id = generateId("chat");
        const newChat: Chat = {
          id,
          title: "Nueva conversación",
          messages: [],
          pinned: false,
          favorite: false,
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChatId: id,
        }));
        return id;
      },

      setActiveChat: (id) => set({ activeChatId: id }),

      addMessage: (chatId, message) => {
        set((state) => {
          const chats = [...state.chats];
          const chatIndex = chats.findIndex((c) => c.id === chatId);
          if (chatIndex === -1) return state;

          const chat = chats[chatIndex];
          const newMsg: Message = {
            ...message,
            id: generateId("msg"),
            createdAt: Date.now(),
          };

          const updatedChat = {
            ...chat,
            messages: [...chat.messages, newMsg],
            updatedAt: Date.now(),
          };

          if (updatedChat.title === "Nueva conversación" && message.role === "user") {
            updatedChat.title = message.content.slice(0, 48) || "Nueva conversación";
          }

          chats[chatIndex] = updatedChat;
          // Sort to put updated chat on top, unless pinned rules apply
          return { chats };
        });
      },

      updateLastMessage: (chatId, content, error) => {
        set((state) => {
          const chats = [...state.chats];
          const chatIndex = chats.findIndex((c) => c.id === chatId);
          if (chatIndex === -1) return state;

          const chat = chats[chatIndex];
          if (chat.messages.length === 0) return state;

          const lastMsgIndex = chat.messages.length - 1;
          const updatedMessages = [...chat.messages];
          updatedMessages[lastMsgIndex] = {
            ...updatedMessages[lastMsgIndex],
            content,
            error: error ?? updatedMessages[lastMsgIndex].error,
          };

          chats[chatIndex] = {
            ...chat,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
          return { chats };
        });
      },

      deleteChat: (id) =>
        set((state) => {
          const filtered = state.chats.filter((c) => c.id !== id);
          return {
            chats: filtered,
            activeChatId: state.activeChatId === id ? (filtered[0]?.id || null) : state.activeChatId,
          };
        }),

      removeMessage: (chatId, messageId) =>
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c
          ),
        })),

      truncateChat: (chatId, fromMessageId) =>
        set((state) => {
          const chats = [...state.chats];
          const chatIndex = chats.findIndex((c) => c.id === chatId);
          if (chatIndex === -1) return state;

          const chat = chats[chatIndex];
          const msgIndex = chat.messages.findIndex((m) => m.id === fromMessageId);
          if (msgIndex === -1) return state;

          // Keep all messages strictly before the specified message
          const updatedMessages = chat.messages.slice(0, msgIndex);

          chats[chatIndex] = {
            ...chat,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };

          return { chats };
        }),

      renameChat: (id, newTitle) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
        })),

      togglePin: (id) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)),
        })),

      toggleArchive: (id) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)),
        })),

      clearAll: () => set({ chats: [], activeChatId: null }),
    }),
    {
      name: "nexy-ai-chats",
    }
  )
);
