import { CustomKoaRoute, Router } from '../CustomKoaRoute';

export default class HealthRoute extends CustomKoaRoute {
  register(router: Router): void {
    router.get(`/health`, (ctx) => {
      ctx.status = 200;
      ctx.body = 'UP';
    });
  }
}
