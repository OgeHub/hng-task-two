import { fetchWithRetry } from '../utils/retry';

export type NationalizeCountry = {
  country_id: string;
  probability: number;
};

export type NationalizeResponse = {
  count: number;
  name: string;
  country: NationalizeCountry[];
};

export type NationalityClassification = {
  name: string;
  countryId: string | null;
  countryName: string | null;
  probability: number | null;
  sampleSize: number;
};

function getMostLikelyCountry(
  countries: NationalizeCountry[]
): NationalizeCountry | null {
  if (countries.length === 0) return null;

  return countries.reduce((best, current) =>
    current.probability > best.probability ? current : best
  );
}

export async function classifyNationality(
  name: string
): Promise<NationalityClassification> {

  const url = `https://api.nationalize.io?name=${encodeURIComponent(name)}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    console.error(`Failed to fetch Nationalize API for name: ${name}`);
    console.error(`Response: ${await response.text()}`);
    throw new Error('Failed to fetch Nationalize API');
  }

  console.log(`Nationalize responded successfully for name: ${name}`);

  const data: NationalizeResponse = await response.json();
  const mostLikelyCountry = getMostLikelyCountry(data.country);
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const countryName = mostLikelyCountry?.country_id
    ? regionNames.of(mostLikelyCountry.country_id) ?? null
    : null;

  const result: NationalityClassification = {
    name: data.name,
    countryId: mostLikelyCountry?.country_id ?? null,
    countryName,
    probability: mostLikelyCountry?.probability ?? null,
    sampleSize: data.count,
  };

  return result;
}
