import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ReqDataParam = createParamDecorator(
    (data: keyof Request, ctx: ExecutionContext) => {
        const context = ctx.switchToHttp();
        const request: Request = context.getRequest();
        return request[data];
    }
)