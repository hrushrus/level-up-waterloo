// Detect if we're running locally or in production
const API_URL = process.env.NODE_ENV === "development" 
  ? "http://localhost:3000" 
  : "https://level-up-api-production.up.railway.app";

export async function fetchOpportunities() {
  const response = await fetch(`${API_URL}/api/opportunities`);
  if (!response.ok) {
    throw new Error(`Unable to load opportunities (${response.status})`);
  }
  const data = await response.json();
  return data.map((opp: any) => ({
    ...opp,
    tags: typeof opp.tags === 'string' ? JSON.parse(opp.tags) : (opp.tags || [])
  }));
}

export async function fetchOpportunity(id: number) {
  const response = await fetch(`${API_URL}/api/opportunities/${id}`);
  if (!response.ok) {
    throw new Error(`Unable to load opportunity (${response.status})`);
  }
  const data = await response.json();
  if (data) {
    data.tags = typeof data.tags === 'string' ? JSON.parse(data.tags) : (data.tags || []);
  }
  return data;
}
