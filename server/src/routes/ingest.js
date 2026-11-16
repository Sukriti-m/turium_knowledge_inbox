import { Router } from 'express';

export function createIngestRouter(ingestionService) {
  const router = Router();
  router.post('/', async (request, response, next) => {
    try {
      response.status(201).json(await ingestionService.ingest(request.body));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
