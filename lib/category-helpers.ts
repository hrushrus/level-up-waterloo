import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export interface CategoryMeta {
  id: string;
  label: string;
  shortLabel: string;
  icon: IconName;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const CATEGORIES_CONFIG: CategoryMeta[] = [
  {
    id: "all",
    label: "All Opportunities",
    shortLabel: "All",
    icon: "sparkles-outline",
    color: "#d97706",
    bgColor: "#fef3c7",
    textColor: "#92400e",
    borderColor: "#fde68a",
  },
  {
    id: "closing_soon",
    label: "Closing Soon",
    shortLabel: "Closing Soon",
    icon: "flame-outline",
    color: "#ef4444",
    bgColor: "#fee2e2",
    textColor: "#b91c1c",
    borderColor: "#fecaca",
  },
  {
    id: "volunteering",
    label: "Volunteering & Community",
    shortLabel: "Volunteering",
    icon: "people-outline",
    color: "#10b981",
    bgColor: "#d1fae5",
    textColor: "#047857",
    borderColor: "#a7f3d0",
  },
  {
    id: "stem_competition",
    label: "STEM & Tech Competitions",
    shortLabel: "STEM",
    icon: "code-slash-outline",
    color: "#6366f1",
    bgColor: "#e0e7ff",
    textColor: "#4338ca",
    borderColor: "#c7d2fe",
  },
  {
    id: "grant",
    label: "Grants & Scholarships",
    shortLabel: "Grants",
    icon: "ribbon-outline",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    textColor: "#b45309",
    borderColor: "#fde68a",
  },
  {
    id: "extracurricular",
    label: "Extracurricular Clubs",
    shortLabel: "Clubs",
    icon: "trophy-outline",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    textColor: "#6d28d9",
    borderColor: "#ddd6fe",
  },
  {
    id: "experiential_learning",
    label: "Experiential Learning & Co-op",
    shortLabel: "Experiential",
    icon: "compass-outline",
    color: "#06b6d4",
    bgColor: "#cffafe",
    textColor: "#0e7490",
    borderColor: "#a5f3fc",
  },
  {
    id: "sports",
    label: "Sports & Athletics",
    shortLabel: "Sports",
    icon: "fitness-outline",
    color: "#f97316",
    bgColor: "#ffedd5",
    textColor: "#c2410c",
    borderColor: "#fed7aa",
  },
  {
    id: "other",
    label: "Other Opportunities",
    shortLabel: "Other",
    icon: "grid-outline",
    color: "#64748b",
    bgColor: "#f1f5f9",
    textColor: "#475569",
    borderColor: "#e2e8f0",
  },
];

export function getCategoryMeta(categoryId: string): CategoryMeta {
  const found = CATEGORIES_CONFIG.find((c) => c.id === categoryId);
  if (found) return found;
  return {
    id: categoryId,
    label: categoryId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    shortLabel: categoryId.replace(/_/g, " "),
    icon: "bookmark-outline",
    color: "#64748b",
    bgColor: "#f1f5f9",
    textColor: "#475569",
    borderColor: "#e2e8f0",
  };
}

export interface DeadlineInfo {
  label: string;
  daysRemaining: number | null;
  isUrgent: boolean;
  isPassed: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function getDeadlineInfo(deadline: Date | string | null | undefined): DeadlineInfo {
  if (!deadline) {
    return {
      label: "Rolling / Ongoing",
      daysRemaining: null,
      isUrgent: false,
      isPassed: false,
      color: "#64748b",
      bgColor: "#f1f5f9",
      borderColor: "#e2e8f0",
    };
  }

  const d = new Date(deadline);
  if (isNaN(d.getTime())) {
    return {
      label: "Flexible",
      daysRemaining: null,
      isUrgent: false,
      isPassed: false,
      color: "#64748b",
      bgColor: "#f1f5f9",
      borderColor: "#e2e8f0",
    };
  }

  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: "Closed",
      daysRemaining: diffDays,
      isUrgent: false,
      isPassed: true,
      color: "#94a3b8",
      bgColor: "#f1f5f9",
      borderColor: "#e2e8f0",
    };
  }

  if (diffDays === 0) {
    return {
      label: "Closes today!",
      daysRemaining: 0,
      isUrgent: true,
      isPassed: false,
      color: "#dc2626",
      bgColor: "#fee2e2",
      borderColor: "#fecaca",
    };
  }

  if (diffDays <= 7) {
    return {
      label: `${diffDays}d left`,
      daysRemaining: diffDays,
      isUrgent: true,
      isPassed: false,
      color: "#dc2626",
      bgColor: "#fee2e2",
      borderColor: "#fecaca",
    };
  }

  if (diffDays <= 30) {
    return {
      label: `${diffDays}d left`,
      daysRemaining: diffDays,
      isUrgent: false,
      isPassed: false,
      color: "#b45309",
      bgColor: "#fef3c7",
      borderColor: "#fde68a",
    };
  }

  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return {
    label: `Due ${formatted}`,
    daysRemaining: diffDays,
    isUrgent: false,
    isPassed: false,
    color: "#475569",
    bgColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  };
}
