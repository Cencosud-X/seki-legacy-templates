import { CustomKoaRoute, Router } from '../CustomKoaRoute';

export default class PingRoute extends CustomKoaRoute {
  register(router: Router): void {
    router.get('/ping', (ctx) => {
      ctx.body = 'pong';
      ctx.status = 200;
    });
  }
}
