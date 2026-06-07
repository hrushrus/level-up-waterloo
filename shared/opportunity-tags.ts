export const OPPORTUNITY_TAGS = [
  "stem",
  "arts",
  "entrepreneurship",
  "leadership",
  "volunteering",
  "sports",
  "career",
  "mentorship",
  "environment",
  "competition",
  "camp",
  "workshop",
  "free",
  "paid",
  "summer",
] as const;

export type OpportunityTag = (typeof OPPORTUNITY_TAGS)[number];

export function isOpportunityTag(value: string): value is OpportunityTag {
  return OPPORTUNITY_TAGS.includes(value as OpportunityTag);
}
