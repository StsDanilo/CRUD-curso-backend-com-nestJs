// Client (Navegador) -> (Servidor) -> Middleware ( Request, Response ) ->
// -> NestJs (Guards, Interceptors, Pipes, Filters)

import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export class AnotherMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers?.authorization;


    if (authorization) {
        req['user'] = {
            nome : 'Danilo',
            sobrenome : 'Santos'
        }
    }

    res.setHeader('X-Another-Middleware', 'Executado');

    // Terminando a cadeia de chamadas, nada vai ser executado após isso
    // return res.status(404).send({
    //     message: 'Não encontrado - Middleware',
    // })

    next();
  }
}
