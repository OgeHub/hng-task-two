import type { Options } from 'sequelize';

type Env = 'development' | 'test' | 'production';
type Config = Record<Env, Options & { use_env_variable: string }>;

const baseConfig: Options = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

const config: Config = {
  development: {
    ...baseConfig,
    use_env_variable: 'DATABASE_URL',
  },
  test: {
    ...baseConfig,
    use_env_variable: 'DATABASE_URL_TEST',
  },
  production: {
    ...baseConfig,
    use_env_variable: 'DATABASE_URL',
  },
};

module.exports = config;
