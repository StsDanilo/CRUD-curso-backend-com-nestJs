import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class AddHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    
    const response = context.switchToHttp().getResponse();

    response.setHeader('X-Custom-Header', 'O valor do cabeçalho');
    
    return next.handle();
  }
}