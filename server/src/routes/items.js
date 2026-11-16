import { Router } from 'express';

export function createItemsRouter(itemRepository) {
  const router = Router();

  router.get('/', (_request, response) => {
    response.json({ items: itemRepository.list() });
  });

  return router;
}
