import { Op, type Order, type WhereOptions } from 'sequelize';
import { AgeGroup, Profile } from '../database/models/profile.model';

export type CreateProfileInput = {
  name: string;
  gender: 'male' | 'female' | null;
  gender_probability: number;
  age: number | null;
  age_group: AgeGroup | null;
  country_id: string;
  country_name: string;
  country_probability: number;
};
export type UpdateProfileInput = Partial<CreateProfileInput>;
export type GetProfilesFilters = {
  gender?: string;
  country_id?: string;
  age_group?: string;
  min_age?: number;
  max_age?: number;
  min_gender_probability?: number;
  min_country_probability?: number;
  sort_by?: 'age' | 'created_at' | 'gender_probability';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export async function createProfile(data: CreateProfileInput) {
  return Profile.create(data);
}

export async function getProfiles(filters: GetProfilesFilters = {}) {
  const query: WhereOptions = {};

  if (filters.gender) query.gender = filters.gender.toLowerCase();
  if (filters.country_id) query.country_id = filters.country_id.toUpperCase();
  if (filters.age_group) query.age_group = filters.age_group.toLowerCase();
  if (typeof filters.min_gender_probability === 'number') {
    query.gender_probability = { [Op.gte]: filters.min_gender_probability };
  }
  if (typeof filters.min_country_probability === 'number') {
    query.country_probability = { [Op.gte]: filters.min_country_probability };
  }
  if (
    typeof filters.min_age === 'number' ||
    typeof filters.max_age === 'number'
  ) {
    query.age = {};
    if (typeof filters.min_age === 'number') {
      (query.age as Record<symbol, number>)[Op.gte] = filters.min_age;
    }
    if (typeof filters.max_age === 'number') {
      (query.age as Record<symbol, number>)[Op.lte] = filters.max_age;
    }
  }

  const sortBy = filters.sort_by ?? 'created_at';
  const sortOrder = (filters.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC';
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;
  const order: Order = [[sortBy, sortOrder]];

  return Profile.findAndCountAll({
    where: query,
    order,
    limit,
    offset,
  });
}

export async function getProfileByName(name: string) {
  return Profile.findOne({ where: { name: name.toLowerCase().trim() } });
}

export async function getProfileById(id: string) {
  return Profile.findByPk(id);
}

export async function getProfilesByFilters(filters: GetProfilesFilters) {
  const query: WhereOptions = {};
  if (filters.gender) query.gender = filters.gender.toLowerCase();
  if (filters.country_id) query.country_id = filters.country_id.toUpperCase();
  if (filters.age_group) query.age_group = filters.age_group.toLowerCase();

  if (
    typeof filters.min_age === 'number' ||
    typeof filters.max_age === 'number'
  ) {
    query.age = {};
    if (typeof filters.min_age === 'number') {
      (query.age as Record<symbol, number>)[Op.gte] = filters.min_age;
    }
    if (typeof filters.max_age === 'number') {
      (query.age as Record<symbol, number>)[Op.lte] = filters.max_age;
    }
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;

  return Profile.findAndCountAll({
    where: query,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
}

export async function updateProfileById(id: string, data: UpdateProfileInput) {
  const profile = await Profile.findByPk(id);
  if (!profile) return null;

  return profile.update(data);
}

export async function deleteProfileById(id: string) {
  const profile = await Profile.findByPk(id);
  if (!profile) return null;

  await profile.destroy();
  return profile;
}
