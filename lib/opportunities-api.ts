const PRODUCTION_API_URL = "https://level-up-api-production.up.railway.app";

export async function fetchOpportunities() {
  const response = await fetch(`${PRODUCTION_API_URL}/api/opportunities`);
  if (!response.ok) {
    throw new Error(`Unable to load opportunities (${response.status})`);
  }
  return response.json();
}

export async function fetchOpportunity(id: number) {
  const response = await fetch(`${PRODUCTION_API_URL}/api/opportunities/${id}`);
  if (!response.ok) {
    throw new Error(`Unable to load opportunity (${response.status})`);
  }
  return response.json();
}
