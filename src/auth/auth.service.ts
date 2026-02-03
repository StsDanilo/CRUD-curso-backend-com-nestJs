import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { Repository } from "typeorm";
import { Pessoa } from "src/pessoas/entities/pessoa.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { HashingService } from "./hashing/hashing.service";
import jwtConfig from "./config/jwt.config";
import { privateDecrypt } from "crypto";
import type { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Pessoa)
        private readonly pessoaRepository: Repository<Pessoa>,
        private readonly hashingService: HashingService,
        @Inject(jwtConfig.KEY)
        private readonly jwtConfiguration: ConfigType<typeof jwtConfig>, 
        private readonly jwtService: JwtService,
    ) {}
    
    async login(loginDto: LoginDto) {
        let passwordIsValid = false;
                
        const pessoa = await this.pessoaRepository.findOneBy({
            email: loginDto.email,
            active: true,
        })

        if(pessoa) {
            passwordIsValid = await this.hashingService.compare(loginDto.password, pessoa.passwordHash)
        }

        if(!passwordIsValid){
            throw new UnauthorizedException('Usuário ou senha inválidos')
        }

        return this.createTokens(pessoa);
    }

    private async createTokens(pessoa: Pessoa) {
        const accessToken = await this.signJwtAsync<Partial<Pessoa>>(
            pessoa.id,
            this.jwtConfiguration.jwtTtl,
            {email: pessoa.email}
        )

        const refreshToken = await this.signJwtAsync(
            pessoa.id, 
            this.jwtConfiguration.jwtRefreshTtl,
        );

        return {
            accessToken,
            refreshToken,
        }
    }

    private async signJwtAsync<T>(sub: number, expiresIn: number, payload?: T) {
        return await this.jwtService.signAsync(
            {
                sub,
                ...payload
            },
            {
                audience: this.jwtConfiguration.audience,
                issuer: this.jwtConfiguration.issuer,
                secret: this.jwtConfiguration.secret,
                expiresIn,
            }
        );
    }

    async refreshTokens(refreshTokenDto: RefreshTokenDto) {
        try {
            const {sub} = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, this.jwtConfiguration)

            const pessoa = await this.pessoaRepository.findOneBy({
                id: sub,
                active: true,
            })

            if(!pessoa) {
                throw new Error('Pessoa não autorizada')
            }

            return this.createTokens(pessoa)
        } catch (error) {
            throw new UnauthorizedException(error.message)
        }
    }
}