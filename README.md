# Profile API (Filtering + Search)

Node.js/TypeScript API for retrieving profiles using direct query filters and natural-language search.

## Setup

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL connection string

### Install

```bash
npm install
```

### Environment Variables

Create `.env`:

```env
PORT=3009
DATABASE_URL=postgres://username:password@localhost:5432/database_name
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

## Endpoints Documented

### 1) Get All Profiles

**GET** `/api/profiles`

Supports filter/pagination query params:

- `gender` (`male`, `female`)
- `age_group` (`child`, `teenager`, `adult`, `senior`)
- `country_id` (2-letter code, e.g. `NG`)
- `min_age`, `max_age`
- `min_gender_probability`, `min_country_probability`
- `sort_by` (`age`, `created_at`, `gender_probability`)
- `order` (`asc`, `desc`)
- `page` (default `1`)
- `limit` (default `10`, max `50`)

Example:

```http
GET /api/profiles?gender=male&country_id=KE&min_age=20&max_age=40&page=1&limit=10
```

### 2) Search Profiles (Natural Language)

**GET** `/api/profiles/search?q=<query>&page=<n>&limit=<n>`

This endpoint parses `q` into filters, then reuses profile filtering.

Example:

```http
GET /api/profiles/search?q=young girls from kenya&page=1&limit=10
```

## Natural Language Parsing

Parsing is strictly rule-based (no AI/LLM).

### Supported keywords and mapping

- **Gender**
  - Male words: `male`, `males`, `men`, `guys`
  - Female words: `female`, `females`, `women`, `ladies`, `girl`, `girls`
  - Mapping:
    - one matched gender -> `gender=<male|female>`
    - both male and female present -> gender is omitted

- **Age**
  - `young` -> `min_age=16`, `max_age=24` (parsing rule only, not an `age_group`)
  - `above <n>` or `over <n>` -> `min_age=<n>`

- **Age group**
  - `teen`, `teens`, `teenager`, `teenagers` -> `age_group=teenager`
  - `adult`, `adults` -> `age_group=adult`

- **Country**
  - Country names are loaded from the seed dataset (`seed_profiles.json`) and mapped to their `country_id`
  - Also supports direct 2-letter codes in natural queries, e.g. `from ng` -> `country_id=NG`

### Parsing logic

1. Normalize query (lowercase, remove punctuation, split into words).
2. Detect gender aliases and set `gender` only if exactly one gender is found.
3. Apply age rules:
   - `young` adds `16..24`
   - `above/over n` sets `min_age=n`
4. Detect age-group keywords.
5. Detect supported country names.
6. If no filters are extracted, return:

```json
{ "status": "error", "message": "Unable to interpret query" }
```

### Age filter behavior in DB query

- if both `min_age` and `max_age` exist: `age >= min_age AND age <= max_age`
- if only `min_age` exists: `age >= min_age`
- if only `max_age` exists: `age <= max_age`

## Limitations and edge cases

- Only listed keywords/aliases are supported (limited vocabulary).
- Country matching supports countries present in the seed file (`seed_profiles.json`); countries not present there are not recognized by name.
- Max-only natural language is not parsed yet (`below 20`, `under 20` are unsupported).
- No fuzzy matching or typo correction (`femle` will not match `female`).
- No negation/comparison logic (`not male`, `between 20 and 30`) is supported.
- Multi-intent/compound natural-language queries are handled only when they match existing simple rules.

## Error Format

All errors use:

```json
{
  "status": "error",
  "message": "error message"
}
```
