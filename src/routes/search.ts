// Express router for GET /api/v1/search
// Mounted in app.ts via: app.use('/api/v1/search', searchRouter)

import { Router } from 'express';
import { SearchHandler } from '../handlers/SearchHandler';

const searchRouter = Router();

// GET /api/v1/search
// Full-text search across innovation_records using PostgreSQL FTS (tsvector + GIN index)
searchRouter.get('/', SearchHandler.handleSearch);

export { searchRouter };
