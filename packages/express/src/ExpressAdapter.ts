import type {
  AppControllerRoute,
  AppViewRoute,
  QueueRegistry,
  ControllerHandlerReturnType,
  HTTPMethod,
  IServerAdapter,
  UIConfig,
} from '@aios-medical/bullmq-dashboard-api/typings/app';
import ejs from 'ejs';
import express, { Express, Request, Response, Router } from 'express';
import { wrapAsync } from './helpers/wrapAsync';

export class ExpressAdapter implements IServerAdapter {
  protected readonly app: Express;
  protected basePath = '';
  protected queueRegistry: QueueRegistry | undefined;
  protected errorHandler: ((error: Error) => ControllerHandlerReturnType) | undefined;
  protected uiConfig: UIConfig = {};

  constructor() {
    this.app = express();
  }

  public setBasePath(path: string): ExpressAdapter {
    this.basePath = path;
    return this;
  }

  public setStaticPath(staticsRoute: string, staticsPath: string): ExpressAdapter {
    this.app.use(staticsRoute, express.static(staticsPath));

    return this;
  }

  public setViewsPath(viewPath: string): ExpressAdapter {
    this.app.set('view engine', 'ejs').set('views', viewPath);
    this.app.engine('ejs', ejs.renderFile);

    return this;
  }

  public setErrorHandler(handler: (error: Error) => ControllerHandlerReturnType) {
    this.errorHandler = handler;
    return this;
  }

  public setApiRoutes(routes: AppControllerRoute[]): ExpressAdapter {
    if (!this.errorHandler) {
      throw new Error(`Please call 'setErrorHandler' before using 'registerPlugin'`);
    } else if (!this.queueRegistry) {
      throw new Error(`Please call 'setQueues' before using 'registerPlugin'`);
    }
    const router = Router();
    router.use(express.json());
    // When mounted inside NestJS' MiddlewareConsumer, the request reaching us
    // sometimes has `req.query` as undefined (Express's query parser doesn't
    // re-run for nested apps). Restore it from the URL ourselves so handlers
    // can rely on it being at least `{}`.
    router.use((req, _res, next) => {
      if (!req.query) {
        const qIdx = (req.url || '').indexOf('?');
        if (qIdx === -1) {
          (req as any).query = {};
        } else {
          const params = new URLSearchParams(req.url!.slice(qIdx + 1));
          const out: Record<string, string | string[]> = {};
          for (const [k, v] of params.entries()) {
            const existing = out[k];
            if (existing === undefined) out[k] = v;
            else if (Array.isArray(existing)) existing.push(v);
            else out[k] = [existing, v];
          }
          (req as any).query = out;
        }
      }
      next();
    });

    routes.forEach((route) =>
      (Array.isArray(route.method) ? route.method : [route.method]).forEach(
        (method: HTTPMethod) => {
          router[method](
            route.route,
            wrapAsync(async (req: Request, res: Response) => {
              const response = await route.handler({
                queues: this.queueRegistry!,
                uiConfig: this.uiConfig || {},
                query: req.query,
                params: req.params,
                body: req.body,
                headers: req.headers as Record<string, string>,
              });

              res.status(response.status || 200).json(response.body);
            })
          );
        }
      )
    );

    router.use((err: Error, _req: Request, res: Response, next: any) => {
      if (!this.errorHandler) {
        return next();
      }

      const response = this.errorHandler(err);
      return res.status(response.status as 500).send(response.body);
    });

    this.app.use(router);
    return this;
  }

  public setEntryRoute(routeDef: AppViewRoute): ExpressAdapter {
    const viewHandler = (_req: Request, res: Response) => {
      const { name, params } = routeDef.handler({
        basePath: this.basePath,
        uiConfig: this.uiConfig,
      });

      res.render(name, params);
    };

    this.app[routeDef.method](routeDef.route, viewHandler);
    return this;
  }

  public setQueues(queueRegistry: QueueRegistry): ExpressAdapter {
    this.queueRegistry = queueRegistry;
    return this;
  }

  setUIConfig(config: UIConfig = {}): ExpressAdapter {
    this.uiConfig = config;
    return this;
  }

  public getRouter(): any {
    return this.app;
  }
}
