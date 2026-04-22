import { Request, Response, NextFunction } from 'express';
import { classifyName } from '../services/gender.service';
import { isValidNameQueryValue } from '../utils/validate';
import { classifyAge } from '../services/age.service';
import { classifyNationality } from '../services/nationality.service';
import {
  createProfile,
  deleteProfileById,
  getProfileById,
  getProfileByName,
  getProfiles,
  getProfilesByFilters,
  type CreateProfileInput,
} from '../services/profile.service';
import { Profile } from '../database/models/profile.model';
import { queryInterpreter } from '../utils/queryInterpreter';

enum externalApi {
  Genderize = 'Genderize',
  Agify = 'Agify',
  Nationalize = 'Nationalize',
}

function serializeProfile(profile: Profile) {
  return {
    id: profile.id,
    name: profile.name,
    gender: profile.gender,
    gender_probability: profile.gender_probability,
    age: profile.age,
    age_group: profile.age_group,
    country_id: profile.country_id,
    country_name: profile.country_name,
    country_probability: profile.country_probability,
    created_at: profile.created_at.toISOString().replace('.000Z', 'Z'),
  };
}

export async function createProfileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name } = req.body;

    if (typeof name !== 'string') {
      return res.status(422).json({
        status: 'error',
        message: 'Invalid type',
      });
    }

    const nameString = name.trim();

    if (!nameString) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty name',
      });
    }

    if (nameString.length > 255 || !isValidNameQueryValue(nameString)) {
      return res.status(422).json({
        status: 'error',
        message: 'Invalid type',
      });
    }

    const existingProfile = await getProfileByName(nameString);
    if (existingProfile) {
      return res.status(200).json({
        status: 'success',
        message: 'Profile already exists',
        data: serializeProfile(existingProfile),
      });
    }

    let data;
    try {
      data = await classifyName(nameString);
    } catch (_error) {
      return res.status(502).json({
        status: 'error',
        message: `${externalApi.Genderize} returned an invalid response`,
      });
    }

    if (!data.gender || data.count === 0) {
      return res.status(502).json({
        status: 'error',
        message: `${externalApi.Genderize} returned an invalid response`,
      });
    }

    let ageData;
    try {
      ageData = await classifyAge(nameString);
    } catch (_error) {
      return res.status(502).json({
        status: 'error',
        message: `${externalApi.Agify} returned an invalid response`,
      });
    }

    if (ageData.age === null) {
      return res.status(502).json({
        status: 'error',
        message: `${externalApi.Agify} returned an invalid response`,
      });
    }

    let nationalityData;
    try {
      nationalityData = await classifyNationality(nameString);
    } catch (_error) {
      return res.status(502).json({
        status: 'error',
        message: `${externalApi.Nationalize} returned an invalid response`,
      });
    }
    if (!nationalityData.countryId || !nationalityData.countryName) {
      return res.status(502).json({
        status: 'error',
        message: `${externalApi.Nationalize} returned an invalid response`,
      });
    }

    const profileData: CreateProfileInput = {
      name: data.name,
      gender: data.gender,
      gender_probability: data.probability,
      age: ageData.age,
      age_group: ageData.ageGroup,
      country_id: nationalityData.countryId,
      country_name: nationalityData.countryName,
      country_probability: nationalityData.probability ?? 0,
    };

    const profile = await createProfile(profileData);

    return res.status(201).json({
      status: 'success',
      data: serializeProfile(profile),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid type',
      });
    }

    const profile = await getProfileById(id as string);

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found',
      });
    }
    return res.status(200).json({
      status: 'success',
      data: serializeProfile(profile),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfilesController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const gender =
      typeof req.query.gender === 'string' ? req.query.gender : undefined;
    const country_id =
      typeof req.query.country_id === 'string' ? req.query.country_id : undefined;
    const age_group =
      typeof req.query.age_group === 'string' ? req.query.age_group : undefined;
    const min_age =
      typeof req.query.min_age === 'string' ? Number(req.query.min_age) : undefined;
    const max_age =
      typeof req.query.max_age === 'string' ? Number(req.query.max_age) : undefined;
    const min_gender_probability =
      typeof req.query.min_gender_probability === 'string'
        ? Number(req.query.min_gender_probability)
        : undefined;
    const min_country_probability =
      typeof req.query.min_country_probability === 'string'
        ? Number(req.query.min_country_probability)
        : undefined;
    const sort_by =
      req.query.sort_by === 'age' ||
      req.query.sort_by === 'created_at' ||
      req.query.sort_by === 'gender_probability'
        ? req.query.sort_by
        : undefined;
    const order =
      req.query.order === 'asc' || req.query.order === 'desc'
        ? req.query.order
        : undefined;
    const parsedPage =
      typeof req.query.page === 'string' ? Number(req.query.page) : undefined;
    const parsedLimit =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const page =
      typeof parsedPage === 'number' && parsedPage >= 1
        ? Math.floor(parsedPage)
        : 1;
    const limit =
      typeof parsedLimit === 'number' && parsedLimit >= 1
        ? Math.min(Math.floor(parsedLimit), 50)
        : 10;

    const { rows: profiles, count } = await getProfiles({
      gender,
      country_id,
      age_group,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
      sort_by,
      order,
      page,
      limit,
    });
    return res.status(200).json({
      status: 'success',
      total: count,
      page,
      limit,
      data: profiles.map(serializeProfile),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteProfileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid type',
      });
    }
    const profile = await deleteProfileById(id as string);
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found',
      });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
} 

export async function getProfilesBySearchQueryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { q, page: pageQuery, limit: limitQuery } = req.query;
    if (typeof q === 'undefined') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty parameter',
      });
    }

    if (typeof q !== 'string') {
      return res.status(422).json({
        status: 'error',
        message: 'Invalid query parameters',
      });
    }

    const normalizedQuery = q.trim();
    if (!normalizedQuery) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty parameter',
      });
    }

    const filters = queryInterpreter(normalizedQuery);
    if (!filters) {
      return res.status(400).json({
       status: "error", 
       message: "Unable to interpret query"
      });
    }

    if (filters) {
      const parsedPage = typeof pageQuery === 'string' ? Number(pageQuery) : undefined;
      const parsedLimit = typeof limitQuery === 'string' ? Number(limitQuery) : undefined;
      const page = typeof parsedPage === 'number' && parsedPage >= 1 ? Math.floor(parsedPage) : 1;
      const limit = typeof parsedLimit === 'number' && parsedLimit >= 1 ? Math.min(Math.floor(parsedLimit), 50) : 10;

      const { rows: profiles, count } = await getProfilesByFilters({ ...filters, page, limit });
      return res.status(200).json({
        status: 'success',
        total: count,
        page,
        limit,
        data: profiles.map(serializeProfile),
      });
    }
    
  } catch (err) {
    next(err);
  }
}