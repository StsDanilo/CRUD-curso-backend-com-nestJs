import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ParseIntIdPipe } from './common/pipes/parse-int-id.pipe';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove chaves que não estão nos DTOs
      forbidNonWhitelisted: true, // Retorna erro se houver chaves inválidas
      transform: false, // tenta converter tipos automaticamente de param e dtos (ex: string para number)
    }),
    new ParseIntIdPipe(),
  );

  if(process.env.NODE_ENV === 'production'){

    // helmet -> cabeçalhos de segurança no protocolo HTTP
    app.use(helmet())

    // CORS -> permitir que outro domínio faça requests na sua aplicação
    app.enableCors({
      origin: 'https://meuapp.com.br'
    })
  }
  await app.listen(process.env.APP_PORT ?? 3000);
}
void bootstrap();
