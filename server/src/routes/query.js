import { Router } from 'express';

export function createQueryRouter(ragService) {
  const router = Router();
  router.post('/', async (request, response, next) => {
    try {
      response.json(await ragService.query(request.body));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
