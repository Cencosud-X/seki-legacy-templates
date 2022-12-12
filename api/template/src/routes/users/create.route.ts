import { CustomKoaRoute, Router } from '../../CustomKoaRoute';

export default class CreateUserRoute extends CustomKoaRoute {
  register(router: Router): void {
    router.post(`/:id`, (ctx) => {
      console.log(ctx.params.id);
      ctx.status = 201;
    });
  }
}
