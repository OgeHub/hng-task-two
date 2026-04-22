import { getCache, setCache } from '../utils/cache';
import { fetchWithRetry } from '../utils/retry';

export type GenderizeResponse = {
  name: string;
  gender: 'male' | 'female' | null;
  probability: number;
  count: number;
};

export async function classifyName(name: string) {
  const cacheKey = `gender:${name.toLowerCase()}`;

  const cached = getCache<GenderizeResponse>(cacheKey);
  if (cached) return cached;

  const url = `https://api.genderize.io?name=${encodeURIComponent(name)}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    console.error(`Failed to fetch Genderize API for name: ${name}`);
    console.error(`Response: ${await response.text()}`);
    throw new Error('Failed to fetch Genderize API');
  }

  const data: GenderizeResponse = await response.json();
  
  console.log(`Genderize API responded successfully for name: ${name}`);

  setCache(cacheKey, data, 1000 * 60 * 60); // 1 hour cache

  return data;
}