import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ParseIntIdPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if(metadata.type !== 'param' || metadata.data !== 'id') {
            return value;
        }

        const parsedValue = Number(value);

        if(isNaN(parsedValue)) {
            throw new BadRequestException('ParsedIntIdPipe espera uma string numérica');
        }

        if(parsedValue < 0) {
            throw new BadRequestException('ID deve ser um número positivo');
        }

        return parsedValue;
    }
}