import { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator";

const PROFILE_QUERY_KEYS = new Set([
  "gender",
  "age_group",
  "country_id",
  "min_age",
  "max_age",
  "min_gender_probability",
  "min_country_probability",
  "sort_by",
  "order",
  "page",
  "limit",
]);

const SEARCH_QUERY_KEYS = new Set(["q", "page", "limit"]);

export const validateGetProfilesQuery = [
  query("gender")
    .optional()
    .isString()
    .bail()
    .notEmpty()
    .bail()
    .isIn(["male", "female"]),
  query("age_group")
    .optional()
    .isString()
    .bail()
    .notEmpty()
    .bail()
    .isIn(["child", "teenager", "adult", "senior"]),
  query("country_id")
    .optional()
    .isString()
    .bail()
    .notEmpty()
    .bail()
    .isLength({ min: 2, max: 2 }),
  query("min_age").optional().isInt({ min: 0 }),
  query("max_age")
    .optional()
    .isInt({ min: 0 })
    .bail()
    .custom((value, { req }) => {
      const minAge = req.query?.min_age;
      if (minAge === undefined) return true;
      return Number(value) >= Number(minAge);
    }),
  query("min_gender_probability").optional().isFloat({ min: 0, max: 1 }),
  query("min_country_probability").optional().isFloat({ min: 0, max: 1 }),
  query("sort_by").optional().isIn(["age", "created_at", "gender_probability"]),
  query("order").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  (req: Request, res: Response, next: NextFunction) => {
    const hasUnknownQueryParams = Object.keys(req.query).some(
      (key) => !PROFILE_QUERY_KEYS.has(key)
    );
    if (hasUnknownQueryParams) {
      return res.status(422).json({
        status: "error",
        message: "Invalid query parameters",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: "error",
        message: "Invalid query parameters",
      });
    }
    next();
  },
];

export const validateGetProfilesBySearchQuery = [
  query("q").optional().isString(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  (req: Request, res: Response, next: NextFunction) => {
    const hasUnknownQueryParams = Object.keys(req.query).some(
      (key) => !SEARCH_QUERY_KEYS.has(key)
    );
    if (hasUnknownQueryParams) {
      return res.status(422).json({
        status: "error",
        message: "Invalid query parameters",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({
        status: "error",
        message: "Invalid query parameters",
      });
    next();
  },
];
