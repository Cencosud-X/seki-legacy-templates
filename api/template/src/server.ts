import * as c from 'ansi-colors';
import { Server } from 'http';
import * as glob from 'glob';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as koaCors from '@koa/cors';
import { CustomKoaRoute, Router } from './CustomKoaRoute';

export class KoaServer {
  private state: 'CREATED' | 'STARTED' | 'BOOTED' | 'CLOSED' = 'CREATED';
  private koaServer: Koa;
  private runningServer: Server;

  private log(level: 'info' | 'error' | 'debug', msg: string) {
    if (level == 'info')
      console.log(c.green(` http-server: (${c.bold(c.greenBright(level))}) ${msg}`));
    if (level == 'error')
      console.log(c.red(` http-server: (${c.bold(c.redBright(level))}) ${msg}`));
    if (level == 'debug')
      console.log(c.blue(` http-server: (${c.bold(c.blueBright(level))}) ${msg}`));
  }

  private constructor(
    private productName: string,
    private port: number,
    private routesBasePath: string
  ) {
    this.koaServer = new Koa();
    this.koaServer
      .use(bodyParser())
      .use(koaCors())
      .use(async (_, next) => {
        try {
          await next();
        } catch (err) {
          err.status = err.statusCode ?? err.status ?? 500;
          throw err;
        }
      });
  }

  static create(productName: string, port: number, routesBasePath = 'routes'): KoaServer {
    return new KoaServer(productName, port, routesBasePath);
  }

  boot(routeBaseMiddlewares: Koa.Middleware[] = []): Promise<this> {
    this.log('debug', 'Boot started');

    return new Promise((res, rej) => {
      glob(
        `**/${this.routesBasePath}/**/*.route.*`,
        { nodir: true },
        (error: Error, listOfMatches) => (error ? rej(error) : res(listOfMatches))
      );
    })
      .then((matches: string[]) =>
        Promise.all(
          matches
            .map((route) => route.slice(route.indexOf('src') + 3))
            .map((path) => {
              const routeElements = path.split('/');
              return import('../src' + path).then((module) => [
                '/' + routeElements.slice(2, routeElements.length - 1).join('/'),
                module,
              ]);
            })
        )
      )
      .then((contents: Array<[string, any]>) => {
        const router = new Router();
        router.use(...routeBaseMiddlewares);

        contents
          .filter(
            ([_, nodeModule]) =>
              nodeModule.default !== undefined &&
              typeof nodeModule.default == 'function' &&
              nodeModule.default.prototype instanceof CustomKoaRoute
          )
          .map(([basePath, nodeModule]): { basePath: string; route: CustomKoaRoute } => ({
            basePath,
            route: new nodeModule.default(),
          }))
          .forEach(({ basePath, route }) => {
            const customRouter = new Router({ prefix: basePath == '/' ? undefined : basePath });
            route.register(customRouter);
            router.use(customRouter.routes(), customRouter.allowedMethods());
          });

        this.koaServer.use(router.routes()).use(router.allowedMethods());

        this.log(
          'info',
          `Registered server routes:\n  ${router.stack
            .filter((ly) => !ly.path.endsWith(')'))
            .map((ly) => `[ ${ly.methods.filter((m) => m != 'HEAD')} ] - ${ly.path}`)
            .join('\n  ')}`
        );

        this.log('debug', 'Boot ended');
        this.state = 'BOOTED';
        return this;
      });
  }

  start(): Promise<this> {
    return new Promise((res) => {
      if (this.state != 'BOOTED') throw new Error('App must boot first');

      this.runningServer = this.koaServer.listen(this.port, () => {
        this.state = 'STARTED';
        this.log(
          'info',
          `${this.productName}: 🚀 API is running on: ${c.bold(`[http(s)://host]:${this.port}`)}`
        );
        return res(this);
      });
    });
  }

  getHTTPServer(): Koa {
    return this.koaServer;
  }

  async stop(): Promise<void> {
    this.runningServer.close();
    this.state = 'CLOSED';
    this.log('info', `💀 closed API running on ${c.bold(`[http(s)://host]:${this.port}`)}`);
  }
}
