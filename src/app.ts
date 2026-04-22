import express from 'express';
import cors from 'cors';
import {
  createProfileController,
  deleteProfileController,
  getProfileController,
  getProfilesBySearchQueryController,
  getProfilesController,
} from './controllers/profile.controller';
import { validateGetProfilesBySearchQuery, validateGetProfilesQuery } from './validators/profile.validator';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Welcome to Profile API');
});

app.use('/api', apiRateLimiter);

app.route('/api/profiles')
  .post(createProfileController)
  .get(validateGetProfilesQuery, getProfilesController);

app.get('/api/profiles/search', validateGetProfilesBySearchQuery, getProfilesBySearchQueryController);

app.route('/api/profiles/:id')
  .get(getProfileController)
  .delete(deleteProfileController);



app.use(errorHandler);

export default app;