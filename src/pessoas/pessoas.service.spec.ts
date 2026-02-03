import { Repository } from "typeorm";
import { PessoasService } from "./pessoas.service";
import { Pessoa } from "./entities/pessoa.entity";
import { HashingService } from "src/auth/hashing/hashing.service";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CreatePessoaDto } from "./dto/create-pessoa.dto";
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import * as path from 'path';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('PessoasService', () => {
    let pessoasService: PessoasService;
    let pessoasRepository: Repository<Pessoa>;
    let hashingService: HashingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PessoasService,
                {
                    provide: getRepositoryToken(Pessoa),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOneBy: jest.fn(),
                        find: jest.fn(),
                        preload: jest.fn(),
                        remove: jest.fn(),
                    }
                },
                {
                    provide: HashingService,
                    useValue: {
                        hash: jest.fn(),
                    }
                }
            ],
        }).compile();

        pessoasService = module.get<PessoasService>(PessoasService)
        pessoasRepository = module.get<Repository<Pessoa>>(getRepositoryToken(Pessoa))
        hashingService = module.get<HashingService>(HashingService)
    })

    it('pessoaService should be defined', () => {
        expect(pessoasService).toBeDefined();
    });


    describe('create', () => {
        it('should create a new person', async () => {
            // Arange
            const createPessoaDto: CreatePessoaDto = {
                email: 'luiz@email.com',
                nome: 'Luiz',
                password: '123456',
            }
            const passwordHash = 'HASHDESENHA';
            const novaPessoa = {
                id: 1,
                nome: createPessoaDto.nome,
                passwordHash: 'HASHDESENHA',
                email: createPessoaDto.email,
            }

            // Como o valor retornado por hashingService.hash é necessário
            // Vamos simular este valor
            jest.spyOn(hashingService, 'hash').mockResolvedValue(passwordHash)
            // Como a pessoa retornada por pessoaRepository.create é necessária em 
            // pessoaRepository.save. Vamos simular este valor
            jest.spyOn(pessoasRepository, 'create').mockReturnValue(novaPessoa as any)

            //Act -> ação -> executar o método
            const result = await pessoasService.create(createPessoaDto)

            // Assert 
            // o método hashingService.hash foi chamado com createPessoaDto.password?
            expect(hashingService.hash).toHaveBeenCalledWith(createPessoaDto.password);

            // o método pessoaRepository.create foi chamado com os dados da nova 
            // pessoa com o hash de senha gerado por hashingService.hash?
            expect(pessoasRepository.create).toHaveBeenCalledWith({
                nome: createPessoaDto.nome,
                passwordHash,
                email: createPessoaDto.email,
            })

            // o método pessoaRepository.save foi chamado com os dados da nova 
            // pessoa gerada por pessoaRepository.create?
            expect(pessoasRepository.save).toHaveBeenCalledWith(novaPessoa);

            // o resultado do método pessoaService.create retornou a nova 
            // pessoa criada?
            expect(result).toEqual(novaPessoa)
        });

        it('should throw ConflitcException when the email already exists', async() => {
            jest.spyOn(pessoasRepository, 'save').mockRejectedValue({code: '23505'})

            await expect(pessoasService.create({} as any)).rejects.toThrow(ConflictException)
        })

        it('should throw Error when the error is not a ConflictException', async() => {
            jest.spyOn(pessoasRepository, 'save').mockRejectedValue(new Error('Erro Genérico'))

            await expect(pessoasService.create({} as any)).rejects.toThrow(new Error('Erro Genérico'))
        })
    })

    describe('findOne', () => {
        it('should return a person if the person is found', async () => {
            const pessoaId = 1;
            const pessoaEncontrada = {
                id: pessoaId,
                nome: 'Luiz',
                email: 'luiz@email.com',
                passwordHash: '123456',
            }

            jest.spyOn(pessoasRepository, 'findOneBy').mockResolvedValue(pessoaEncontrada as any)

            const result = await pessoasService.findOne(pessoaId);

            expect(result).toEqual(pessoaEncontrada)
        })

        it('should return a NotFoundExcepction if the person is not found', async () => {
            const pessoaId = 1;
            const pessoaEncontrada = {
                id: pessoaId,
                nome: 'Luiz',
                email: 'luiz@email.com',
                passwordHash: '123456',
            }

            await expect(pessoasService.findOne(pessoaId)).rejects.toThrow(NotFoundException)
        })
    })

    describe('findAll', () => {
        it('should return all people', async () => {
            const pessoasMock: Pessoa[] = [
                {
                    id: 1,
                    nome: 'Luiz',
                    email: 'luiz@email.com',
                    passwordHash: '123456',
                } as Pessoa,
            ];

            jest.spyOn(pessoasRepository, 'find').mockResolvedValue(pessoasMock)

            const result = await  pessoasService.findAll();

            expect(result).toEqual(pessoasMock)
            expect(pessoasRepository.find).toHaveBeenCalledWith({
                order: {
                    id: 'desc'
                },
            })
        })
    })

    describe('update', () => {
        it('should update the person if the user is authorized', async () => {
            // Arrange
            const pessoaId = 1;
            const updatePessoaDto = {
                nome:'Joana',
                password: '654321',
            };
            const tokenPayload = { sub: pessoaId } as any;
            const passwordHash = 'HASHDESENHA'
            const updatedPessoa = { id: pessoaId, nome: 'Joana', passwordHash}

            jest.spyOn(hashingService, 'hash').mockResolvedValue(passwordHash);
            jest.spyOn(pessoasRepository, 'preload').mockResolvedValue(updatedPessoa as any);
            jest.spyOn(pessoasRepository, 'save').mockResolvedValue(updatedPessoa as any);
            
            // Act
            const result = await pessoasService.update(pessoaId, updatePessoaDto, tokenPayload);

            // Assert
            expect(hashingService.hash).toHaveBeenCalledWith(updatePessoaDto.password)
            expect(pessoasRepository.preload).toHaveBeenCalledWith({
                id: pessoaId,
                nome: updatePessoaDto.nome,
                passwordHash,
            })
            expect(pessoasRepository.save).toHaveBeenCalledWith(updatedPessoa)
            expect(result).toEqual(updatedPessoa);
        })

        it('should throw ForbiddenException if the user is not authorized', async () => {
            // Arrange
            const pessoaId = 1; // Usuário certo (ID 1)
            const tokenPayload = { sub: 2 } as any; // Usuário diferente (ID 2)
            const updatePessoaDto = { nome: 'Jane Doe' };
            const existingPessoa = { id: pessoaId, nome: 'John Doe' };

            // Simula que a pessoa existe
            jest
                .spyOn(pessoasRepository, 'preload')
                .mockResolvedValue(existingPessoa as any);

            // Act e Assert
            await expect(
                pessoasService.update(pessoaId, updatePessoaDto, tokenPayload),
            ).rejects.toThrow(ForbiddenException);
        })
        
        it('should throw NotFoundException if the user does not exists', async () => {
            const pessoaId = 1;
            const updatePessoaDto = {
                nome:'Jane',
            };
            const tokenPayload = { sub: pessoaId } as any;

            // Simula que preload retornou null
            jest.spyOn(pessoasRepository, 'preload').mockResolvedValue(null);

            await expect(pessoasService.update(pessoaId, updatePessoaDto, tokenPayload))
            .rejects
            .toThrow(NotFoundException)

        })
    })

    describe('remove', () => {
        it('deve remover uma pessoa se autorizado', async () => {
        // Arrange
        const pessoaId = 1; // Pessoa com ID 1
        const tokenPayload = { sub: pessoaId } as any; // Usuário com ID 1
        const existingPessoa = { id: pessoaId, nome: 'John Doe' }; // Pessoa é o Usuário

        // findOne do service vai retornar a pessoa existente
        jest
            .spyOn(pessoasService, 'findOne')
            .mockResolvedValue(existingPessoa as any);
        // O método remove do repositório também vai retornar a pessoa existente
        jest
            .spyOn(pessoasRepository, 'remove')
            .mockResolvedValue(existingPessoa as any);

        // Act
        const result = await pessoasService.remove(pessoaId, tokenPayload);

        // Assert
        // Espero que findOne do pessoaService seja chamado com o ID da pessoa
        expect(pessoasService.findOne).toHaveBeenCalledWith(pessoaId);
        // Espero que o remove do repositório seja chamado com a pessoa existente
        expect(pessoasRepository.remove).toHaveBeenCalledWith(existingPessoa);
        // Espero que a pessoa apagada seja retornada
        expect(result).toEqual(existingPessoa);
        });

        it('deve lançar ForbiddenException se não autorizado', async () => {
        // Arrange
        const pessoaId = 1; // Pessoa com ID 1
        const tokenPayload = { sub: 2 } as any; // Usuário com ID 2
        const existingPessoa = { id: pessoaId, nome: 'John Doe' }; // Pessoa NÃO é o Usuário

        // Espero que o findOne seja chamado com pessoa existente
        jest
            .spyOn(pessoasService, 'findOne')
            .mockResolvedValue(existingPessoa as any);

        // Espero que o servico rejeite porque o usuário é diferente da pessoa
        await expect(
            pessoasService.remove(pessoaId, tokenPayload),
        ).rejects.toThrow(ForbiddenException);
        });

        it('deve lançar NotFoundException se a pessoa não for encontrada', async () => {
        const pessoaId = 1;
        const tokenPayload = { sub: pessoaId } as any;

        // Só precisamos que o findOne lance uma exception e o remove também deve lançar
        jest
            .spyOn(pessoasService, 'findOne')
            .mockRejectedValue(new NotFoundException());

        await expect(
            pessoasService.remove(pessoaId, tokenPayload),
        ).rejects.toThrow(NotFoundException);
        });
    });

    describe('uploadPicture', () => {
        it('should save the image correctly and update the person', async () => {
            // Arrange
            const mockFile = {
                originalname: 'test.png',
                size: 2000,
                buffer: Buffer.from('file content'),
            } as Express.Multer.File;

            const mockPessoa = {
                id: 1,
                nome: 'Luiz',
                email: 'luiz@email.com',
            } as Pessoa

            const tokenPayload = { sub: 1 } as any;

            jest.spyOn(pessoasService, 'findOne').mockResolvedValue(mockPessoa);
            jest.spyOn(pessoasRepository, 'save').mockResolvedValue({
                ...mockPessoa,
                picture: '1.png',
            })

            const filePath = path.resolve(process.cwd(), 'pictures', '1.png');

            // Act
            const result = await pessoasService.uploadPicture(mockFile, tokenPayload)

            // Assert
            expect(fs.writeFile).toHaveBeenCalledWith(filePath, mockFile.buffer);
            expect(pessoasRepository.save).toHaveBeenCalledWith({
                ...mockPessoa,
                picture: '1.png',
            });
            expect(result).toEqual({
                ...mockPessoa,
                picture: '1.png',
            });
        });

        it('should throw BadRequestException if the file is too small', async () => {
            const mockFile = {
                originalname: 'test.png',
                size: 500,
                buffer: Buffer.from('file content'),
            } as Express.Multer.File

            const tokenPayload = { sub: 1 } as any;

            await expect(
                pessoasService.uploadPicture(mockFile, tokenPayload),
            ).rejects.toThrow(BadRequestException);
        });
    })
});    