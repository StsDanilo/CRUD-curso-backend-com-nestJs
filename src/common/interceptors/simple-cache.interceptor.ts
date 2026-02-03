import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { of, tap } from "rxjs";

@Injectable()
export class SimpleCacheInterceptor implements NestInterceptor {
    private readonly cache = new Map();

    async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    if (this.cache.has(url)) {
        return of(this.cache.get(url));
    }

    return next.handle().pipe(
        tap(response => {
            this.cache.set(url, response);
        })
    );
  }
}