import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ServeStaticModule } from "@nestjs/serve-static"
import { Test, TestingModule } from "@nestjs/testing"
import request from 'supertest'
import { TypeOrmModule } from "@nestjs/typeorm"
import path from "path"
import { AuthModule } from "src/auth/auth.module"
import { ParseIntIdPipe } from "src/common/pipes/parse-int-id.pipe"
import { GlobalConfigModule } from "src/global-config/global-config.module"
import globalConfig from "src/global-config/global.config"
import { PessoasModule } from "src/pessoas/pessoas.module"
import { RecadosModule } from "src/recados/recados.module"
import { CreatePessoaDto } from "src/pessoas/dto/create-pessoa.dto"

const login = async (
    app: INestApplication,
    email: string,
    password: string,
) => {
    const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ email, password})
    return response.body.accessToken
}

const createUserAndLogin = async (app: INestApplication) => {
    const nome = 'Any User'
    const email = 'anyuser@email.com'
    const password = '123456'

    await request(app.getHttpServer()).post('/pessoas').send({
        nome, email, password
    })

    return login(app, email, password)
}

describe('AppController (e2e)', () => {
    let app: INestApplication

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forFeature(globalConfig),
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: 'localhost',
                    port: 5432,
                    username: 'postgres',
                    database: 'testing',
                    password: '123456',
                    autoLoadEntities: true,
                    synchronize: true,
                    dropSchema: true,
                }),
                ServeStaticModule.forRoot({
                  rootPath: path.resolve(__dirname, '..', '..', 'pictures'),
                  serveRoot: '/pictures',
                }),
                RecadosModule,
                PessoasModule,
                GlobalConfigModule,
                AuthModule,    
            ]
        }).compile()

        app = module.createNestApplication()

        app.useGlobalPipes(
            new ValidationPipe({
              whitelist: true, // Remove chaves que não estão nos DTOs
              forbidNonWhitelisted: true, // Retorna erro se houver chaves inválidas
              transform: false, // tenta converter tipos automaticamente de param e dtos (ex: string para number)
            }),
            new ParseIntIdPipe(),
          );

        await app.init()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('/pessoas (POST)', () => {
        it('should create a person successfully', async () => {
            const createPessoaDto: CreatePessoaDto = {
                email: 'luiz@email.com',
                password: '123456',
                nome:'Luiz',
            }
            const response = await request(app.getHttpServer())
                .post('/pessoas')
                .send(createPessoaDto)
                .expect(HttpStatus.CREATED)

            expect(response.body).toEqual({
                email: createPessoaDto.email,
                passwordHash: expect.any(String),
                nome: createPessoaDto.nome,
                active: true,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                picture: '',
                id: expect.any(Number)
            })
        })

        it('should throw a error email already exists', async () => {
            const createPessoaDto: CreatePessoaDto = {
                email: 'luiz@email.com',
                password: '123456',
                nome:'Luiz',
            }

            await request(app.getHttpServer())
                .post('/pessoas')
                .send(createPessoaDto)
                .expect(HttpStatus.CREATED)

            const response = await request(app.getHttpServer())
                .post('/pessoas')
                .send(createPessoaDto)
                .expect(HttpStatus.CONFLICT)
            
            expect(response.body.message).toBe('Email já cadastrado')
        })

        it('should throw a error short password', async () => {
            const createPessoaDto: CreatePessoaDto = {
                email: 'luiz@email.com',
                password: '123',
                nome:'Luiz',
            }
            const response = await request(app.getHttpServer())
                .post('/pessoas')
                .send(createPessoaDto)
                .expect(HttpStatus.BAD_REQUEST)

            expect(response.body.message).toEqual(["password must be longer than or equal to 5 characters"])
            expect(response.body.message).toContain("password must be longer than or equal to 5 characters")
        })
    })

    describe('/pessoas/:id (GET)', () => {
        it('should return unauthorized', async () => {
            const pessoaResponse = await request(app.getHttpServer())
            .post('/pessoas')
            .send({
                email: 'luiz@email.com',
                password: '123456',
                nome:'Luiz',
            }).expect(HttpStatus.CREATED)

            const response = await request(app.getHttpServer())
                .get('/pessoas/' + pessoaResponse.body.id)
                .expect(HttpStatus.UNAUTHORIZED)
        })

        it('should return a person when user is logged in', async () => {
            const createPessoaDto: CreatePessoaDto = {
                email: 'luiz@email.com',
                password: '123456',
                nome:'Luiz',
            }
        
            const pessoaResponse = await request(app.getHttpServer())
            .post('/pessoas')
            .send(createPessoaDto).expect(HttpStatus.CREATED)

            const accessToken = await createUserAndLogin(app)

            const response = await request(app.getHttpServer())
                .get('/pessoas/' + pessoaResponse.body.id)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(HttpStatus.OK)

            expect(response.body).toEqual({
                email: createPessoaDto.email,
                passwordHash: expect.any(String),
                nome: createPessoaDto.nome,
                active: true,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                picture: '',
                id: expect.any(Number)
            })
        })
    })
})