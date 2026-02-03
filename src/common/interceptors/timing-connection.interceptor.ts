import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { tap } from "rxjs";

@Injectable()
export class TimingConnectionInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const now = Date.now();

    return next.handle().pipe(
        tap(() => {
            const elapsed = Date.now() - now;
        })
    );
  }
}