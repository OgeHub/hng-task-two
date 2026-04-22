
import { fetchWithRetry } from '../utils/retry';

export type AgeGroup = 'child' | 'teenager' | 'adult' | 'senior';

export type AgifyResponse = {
  count: number;
  name: string;
  age: number | null;
};

export type AgeClassification = {
  name: string;
  age: number | null;
  ageGroup: AgeGroup | null;
  sampleSize: number;
};

function getAgeGroup(age: number): AgeGroup {
  if (age <= 12) return 'child';
  if (age <= 19) return 'teenager';
  if (age <= 59) return 'adult';
  return 'senior';
}

export async function classifyAge(name: string): Promise<AgeClassification> {

  const url = `https://api.agify.io?name=${encodeURIComponent(name)}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    console.error(`Failed to fetch Agify API for name: ${name}`);
    console.error(`Response: ${await response.text()}`);
    throw new Error('Failed to fetch Agify API');
  }

  console.log(`Agify responded successfully for name: ${name}`);
  
  const data: AgifyResponse = await response.json();
  const result: AgeClassification = {
    name: data.name,
    age: data.age,
    ageGroup: data.age === null ? null : getAgeGroup(data.age),
    sampleSize: data.count,
  };

  return result;
}
