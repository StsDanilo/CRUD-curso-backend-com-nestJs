import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecadosService } from './recados.service';
import { CreateRecadoDto } from './dto/create-recado.dto';
import { UpdateRecadoDto } from './dto/update-recado.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.param';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

// CRUD
// Create -> POST
// Read -> GET
// Update -> PATCH / PUT
// Delete -> DELETE

// PATCH é utilizado para atualizar dados de um recurso
// PUT é utilizado para atualizar um recurso inteiro

// DTO - Data Transfer Object -> Objeto de transferência de dados
// Usado para definir a estrutura dos dados que serão enviados em requisições
// DTO -> Objeto simples -> Validar dados / Transformar dados 

@Controller('recados')
export class RecadosController {
  constructor(
    private readonly recadosService: RecadosService,
  ) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.recadosService.findAll(paginationDto);
  }
  
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.recadosService.findOne(id);
  }

  @UseGuards(AuthTokenGuard)
  @Post()
  create(@Body() createRecadoDto: CreateRecadoDto, @TokenPayloadParam() tokenPayload: TokenPayloadDto) {
    return this.recadosService.create(createRecadoDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateRecadoDto: UpdateRecadoDto, @TokenPayloadParam() tokenPayload: TokenPayloadDto) {
    return this.recadosService.update(id, updateRecadoDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: number, @TokenPayloadParam() tokenPayload: TokenPayloadDto) {
    return this.recadosService.remove(id, tokenPayload);
  }
}
