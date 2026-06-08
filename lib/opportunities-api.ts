import { getApiBaseUrl } from "@/constants/oauth";
import { Platform } from "react-native";

const PRODUCTION_API_URL = "https://level-up-api-production.up.railway.app";

function getOpportunitiesApiUrl() {
  const configuredUrl = getApiBaseUrl();
  if (
    Platform.OS !== "web" &&
    (!configuredUrl || configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1"))
  ) {
    return PRODUCTION_API_URL;
  }
  return configuredUrl;
}

export async function fetchOpportunities() {
  const response = await fetch(`${getOpportunitiesApiUrl()}/api/opportunities`);
  if (!response.ok) {
    throw new Error(`Unable to load opportunities (${response.status})`);
  }
  return response.json();
}

export async function fetchOpportunity(id: number) {
  const response = await fetch(`${getOpportunitiesApiUrl()}/api/opportunities/${id}`);
  if (!response.ok) {
    throw new Error(`Unable to load opportunity (${response.status})`);
  }
  return response.json();
}
