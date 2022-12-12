import Router from 'koa-router';

export { Router };

export abstract class CustomKoaRoute {
  abstract register(router: Router): void;
}
