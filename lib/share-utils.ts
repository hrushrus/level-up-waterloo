import { Platform, Share } from "react-native";

export const SITE_URL = "https://waterloo-student-opps.expo.app";
export const SITE_NAME = "Level Up Waterloo";
export const SITE_TAGLINE =
  "Connecting local high school and middle school students with jobs, volunteering, competitions, and grants across Waterloo Region.";

export function getBaseUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_URL;
}

export function getOpportunityShareUrl(opportunityId: number): string {
  return `${getBaseUrl()}/opportunity/${opportunityId}`;
}

export function getPlatformShareUrl(): string {
  return getBaseUrl();
}

export interface ShareData {
  title: string;
  text: string;
  url: string;
  type: "website" | "opportunity";
}

export async function canNativeShare(): Promise<boolean> {
  if (Platform.OS === "web") {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  }
  return true;
}

/**
 * Attempt to invoke native device share sheet (iOS/Android/macOS/Windows).
 * Returns true if native share was launched, false otherwise.
 */
export async function triggerNativeShare(data: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        return true;
      }
      return false;
    } else {
      await Share.share({
        title: data.title,
        message: `${data.text}\n\n${data.url}`,
        url: data.url,
      });
      return true;
    }
  } catch (err: any) {
    // User cancelled share or share failed
    if (err?.name === "AbortError") {
      return true; // user simply dismissed dialog
    }
    console.warn("Native share failed:", err);
    return false;
  }
}

/**
 * Copy text to clipboard in web or native
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (e) {
    console.warn("Clipboard copy failed:", e);
    return false;
  }
}
