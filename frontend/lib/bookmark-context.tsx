import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BOOKMARKS_KEY = "levelup_bookmarks";

interface BookmarkContextType {
  bookmarkedIds: Set<number>;
  isBookmarked: (id: number) => boolean;
  toggleBookmark: (id: number) => Promise<void>;
  addBookmark: (id: number) => Promise<void>;
  removeBookmark: (id: number) => Promise<void>;
  clearAllBookmarks: () => Promise<void>;
  loading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load bookmarks from storage on mount
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as number[];
        setBookmarkedIds(new Set(ids));
      }
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveBookmarks = async (ids: Set<number>) => {
    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error("Failed to save bookmarks:", error);
    }
  };

  const isBookmarked = (id: number) => {
    return bookmarkedIds.has(id);
  };

  const addBookmark = async (id: number) => {
    const updated = new Set(bookmarkedIds);
    updated.add(id);
    setBookmarkedIds(updated);
    await saveBookmarks(updated);
  };

  const removeBookmark = async (id: number) => {
    const updated = new Set(bookmarkedIds);
    updated.delete(id);
    setBookmarkedIds(updated);
    await saveBookmarks(updated);
  };

  const toggleBookmark = async (id: number) => {
    if (isBookmarked(id)) {
      await removeBookmark(id);
    } else {
      await addBookmark(id);
    }
  };

  const clearAllBookmarks = async () => {
    setBookmarkedIds(new Set());
    await AsyncStorage.removeItem(BOOKMARKS_KEY);
  };

  const value: BookmarkContextType = {
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    clearAllBookmarks,
    loading,
  };

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within BookmarkProvider");
  }
  return context;
}
