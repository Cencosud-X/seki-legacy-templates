import { KoaServer } from './server';
import secrets from './config/secrets';

const closeSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2', 'SIGQUIT'];

KoaServer.create(secrets.PRODUCT_NAME, {{data.settings.port}})
  .boot([
    async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      ctx.set('X-Response-Time', `${ms}ms`);
    },
  ])
  .then((server) => server.start())
  .then((server) => {
    closeSignals.forEach((s) =>
      process.on(s, async () => {
        await server.stop();
        console.log('App closed');
        process.exit(0);
      })
    );

    console.log(`App running`);
  })
  .catch(console.error);
