import { existsSync, readFileSync } from "fs";
import path from "path";

interface Filters {
  gender?: string;
  min_age?: number;
  max_age?: number;
  age_group?: string;
  country_id?: string;
}

const BASE_COUNTRY_MAP: Record<string, string> = {
  nigeria: "NG",
  kenya: "KE",
  angola: "AO",
};

const GENDER_MAP: Record<string, string[]> = {
  male: ["male", "males", "men", "guys"],
  female: ["female", "females", "women", "ladies", "girl", "girls"],
};

const TEENAGER_WORDS = ["teen", "teens", "teenager", "teenagers"];
const ADULT_WORDS = ["adult", "adults"];

let cachedCountryMap: Record<string, string> | null = null;

function loadCountryMap(): Record<string, string> {
  if (cachedCountryMap) {
    return cachedCountryMap;
  }

  const dynamicCountryMap: Record<string, string> = {};
  const candidatePaths = [
    path.resolve(process.cwd(), "src", "database", "data", "seed_profiles.json"),
    path.resolve(process.cwd(), "dist", "database", "data", "seed_profiles.json"),
    path.resolve(process.cwd(), "database", "data", "seed_profiles.json"),
  ];

  for (const filePath of candidatePaths) {
    if (!existsSync(filePath)) {
      continue;
    }

    try {
      const content = readFileSync(filePath, "utf8");
      const parsed = JSON.parse(content) as
        | { profiles?: Array<{ country_name?: string; country_id?: string }> }
        | Array<{ country_name?: string; country_id?: string }>;
      const rows = Array.isArray(parsed) ? parsed : parsed.profiles ?? [];

      for (const row of rows) {
        const name = row.country_name?.trim().toLowerCase();
        const id = row.country_id?.trim().toUpperCase();
        if (name && id && id.length === 2) {
          dynamicCountryMap[name] = id;
        }
      }
      break;
    } catch (_error) {
      // Fall back to base map if seed file cannot be read.
    }
  }

  cachedCountryMap = { ...BASE_COUNTRY_MAP, ...dynamicCountryMap };
  return cachedCountryMap;
}

export const queryInterpreter = (q: string):Filters | null => {
  if (!q?.trim()) {
    return null;
  }


  const query = q.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = query.split(/\s+/).filter(Boolean);
  const filters: Filters = {};

  const matchedGenders = new Set<string>();

  for (const word of words) {
    for (const [genderKey, aliases] of Object.entries(GENDER_MAP)) {
      if (aliases.includes(word)) {
        matchedGenders.add(genderKey);
      }
    }
  }

  if (matchedGenders.size === 1) {
    filters.gender = Array.from(matchedGenders)[0];
  }

  if (words.includes("young")) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  if (words.some((word) => TEENAGER_WORDS.includes(word))) {
    filters.age_group = "teenager";
  } else if (words.some((word) => ADULT_WORDS.includes(word))) {
    filters.age_group = "adult";
  }

  const countryMap = loadCountryMap();
  for (const [countryName, countryCode] of Object.entries(countryMap)) {
    const countryPattern = new RegExp(`\\b${countryName.replace(/\s+/g, "\\s+")}\\b`);
    if (countryPattern.test(query)) {
      filters.country_id = countryCode;
      break;
    }
  }

  const fromCountryCodeMatch = query.match(/\bfrom\s+([a-z]{2})\b/);
  if (!filters.country_id && fromCountryCodeMatch) {
    filters.country_id = fromCountryCodeMatch[1].toUpperCase();
  }

  const aboveMatch = query.match(/\b(?:above|over)\s+(\d+)\b/);
  if (aboveMatch) {
    filters.min_age = Number(aboveMatch[1]);
  }

  if (Object.keys(filters).length === 0) {
    return null;
  }

  return filters;
};