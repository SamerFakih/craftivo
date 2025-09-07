import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-clients.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {}
