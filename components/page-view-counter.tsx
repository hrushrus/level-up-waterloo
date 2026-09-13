import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

interface UsePageViewOptions {
  record?: boolean;
}

interface PageViewState {
  views: number | null;
  totalViews: number | null;
  isLoading: boolean;
}

// In-memory cache to avoid double counting on re-renders in the same route session
const recordedPagesInSession = new Set<string>();

export function usePageView(page: string = "home", options: UsePageViewOptions = { record: true }) {
  const [state, setState] = useState<PageViewState>({
    views: null,
    totalViews: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function handleView() {
      try {
        const apiUrl = getApiBaseUrl();
        const shouldRecord = options.record !== false && !recordedPagesInSession.has(page);

        if (shouldRecord) {
          recordedPagesInSession.add(page);
          const res = await fetch(`${apiUrl}/api/views`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ page }),
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setState({
                views: typeof data.views === "number" ? data.views : null,
                totalViews: typeof data.totalViews === "number" ? data.totalViews : null,
                isLoading: false,
              });
              return;
            }
          }
        }

        // Fetch view count without re-incrementing
        const res = await fetch(`${apiUrl}/api/views?page=${encodeURIComponent(page)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setState({
              views: typeof data.views === "number" ? data.views : null,
              totalViews: typeof data.totalViews === "number" ? data.totalViews : null,
              isLoading: false,
            });
          }
        } else {
          if (isMounted) {
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        }
      } catch (err) {
        if (isMounted) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    handleView();

    return () => {
      isMounted = false;
    };
  }, [page, options.record]);

  return state;
}

interface PageViewBadgeProps {
  page?: string;
  showTotal?: boolean;
  label?: string;
  className?: string;
}

export function PageViewBadge({
  page = "home",
  showTotal = false,
  label,
  className = "",
}: PageViewBadgeProps) {
  const { views, totalViews, isLoading } = usePageView(page);

  const count = showTotal ? totalViews : (views ?? totalViews);

  if (isLoading && count === null) {
    return null;
  }

  const formattedCount = (count ?? 0).toLocaleString();
  const displayLabel = label || (showTotal ? "Total Site Views" : "Views");

  return (
    <View
      className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border ${className}`}
      style={{ alignSelf: "flex-start" }}
    >
      <Text style={{ fontSize: 13 }}>👀</Text>
      <Text className="text-xs font-semibold text-foreground">
        {formattedCount}{" "}
        <Text className="text-xs font-normal text-muted">{displayLabel}</Text>
      </Text>
    </View>
  );
}
