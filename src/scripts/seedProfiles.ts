import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import { v7 as uuidv7 } from 'uuid';
import { sequelize } from '../utils/db';
import { AgeGroup, Profile } from '../database/models/profile.model';

type SeedProfile = {
  id?: string;
  name: string;
  gender: 'male' | 'female';
  gender_probability: number;
  age: number;
  age_group: AgeGroup;
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at?: string;
};

const DEFAULT_FILE = path.resolve('src', 'database', 'data', 'seed_profiles.json');
const CHUNK_SIZE = Number(process.env.SEED_CHUNK_SIZE || 1000);

function normalizeRow(row: SeedProfile) {
  return {
    id: row.id ?? uuidv7(),
    name: row.name.trim().toLowerCase(),
    gender: row.gender,
    gender_probability: row.gender_probability,
    age: row.age,
    age_group: row.age_group,
    country_id: row.country_id.trim().toUpperCase(),
    country_name: row.country_name.trim(),
    country_probability: row.country_probability,
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
  };
}

async function main() {
  const filePath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_FILE;

  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw) as SeedProfile[] | { profiles?: SeedProfile[] };
  const rows = Array.isArray(parsed) ? parsed : parsed.profiles ?? [];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Seed file must contain a non-empty JSON array');
  }

  await sequelize.authenticate();
  console.log(`Connected. Seeding ${rows.length} profiles from ${filePath}`);

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE).map(normalizeRow);
    await Profile.bulkCreate(chunk, {
      validate: true,
      ignoreDuplicates: true,
    });
    console.log(`Inserted ${Math.min(i + CHUNK_SIZE, rows.length)}/${rows.length}`);
  }

  await sequelize.close();
  console.log('Seed completed successfully.');
}

main().catch(async (error) => {
  console.error('Seed failed:', error);
  await sequelize.close();
  process.exit(1);
});
