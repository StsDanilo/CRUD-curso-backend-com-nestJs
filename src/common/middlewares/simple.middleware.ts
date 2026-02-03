// Client (Navegador) -> (Servidor) -> Middleware ( Request, Response ) ->
// -> NestJs (Guards, Interceptors, Pipes, Filters)

import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export class SimpleMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Simple Middleware Executed');
    const authorization = req.headers?.authorization;


    if (authorization) {
        req['user'] = {
            nome : 'Danilo',
            sobrenome : 'Santos',
            role : 'admin',
        }
    }

    res.setHeader('X-Simple-Middleware', 'Executado');

    // Terminando a cadeia de chamadas, nada vai ser executado após isso
    // return res.status(404).send({
    //     message: 'Não encontrado - Middleware',
    // })

    next(); // Próximo middleware 

    console.log('Simple Middleware tchau');

    res.on('finish', () => {
        console.log('Response finished - Simple Middleware');
    })
  }
}
