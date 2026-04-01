import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface FilterOptions {
  search: string;
  categories: string[];
  deadlineRange: {
    min: number | null; // days from now
    max: number | null;
  };
  commitmentLevels: string[]; // "part_time", "full_time", "flexible"
  locations: string[]; // "on_campus", "remote", "in_person"
  payStatus: string[]; // "paid", "unpaid", "stipend"
  levels: string[]; // "beginner", "intermediate", "advanced"
  sortBy: "newest" | "deadline" | "relevance";
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterOptions;
  createdAt: Date;
}

interface FilterContextType {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  updateFilter: (key: keyof FilterOptions, value: any) => void;
  resetFilters: () => void;
  savedFilters: SavedFilter[];
  saveFilter: (name: string) => Promise<void>;
  loadFilter: (id: string) => Promise<void>;
  deleteFilter: (id: string) => Promise<void>;
  loadSavedFilters: () => Promise<void>;
}

const defaultFilters: FilterOptions = {
  search: "",
  categories: [],
  deadlineRange: { min: null, max: null },
  commitmentLevels: [],
  locations: [],
  payStatus: [],
  levels: [],
  sortBy: "newest",
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const loadSavedFilters = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("savedFilters");
      if (stored) {
        setSavedFilters(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    }
  }, []);

  const saveFilter = useCallback(
    async (name: string) => {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name,
        filters: { ...filters },
        createdAt: new Date(),
      };

      const updated = [...savedFilters, newFilter];
      setSavedFilters(updated);

      try {
        await AsyncStorage.setItem("savedFilters", JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving filter:", error);
      }
    },
    [filters, savedFilters]
  );

  const loadFilter = useCallback(async (id: string) => {
    const filter = savedFilters.find((f) => f.id === id);
    if (filter) {
      setFilters(filter.filters);
    }
  }, [savedFilters]);

  const deleteFilter = useCallback(
    async (id: string) => {
      const updated = savedFilters.filter((f) => f.id !== id);
      setSavedFilters(updated);

      try {
        await AsyncStorage.setItem("savedFilters", JSON.stringify(updated));
      } catch (error) {
        console.error("Error deleting filter:", error);
      }
    },
    [savedFilters]
  );

  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        savedFilters,
        saveFilter,
        loadFilter,
        deleteFilter,
        loadSavedFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
}
