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
import { TrackingEventService } from './tracking-event.service';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';
import { UpdateTrackingEventDto } from './dto/update-tracking-event.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';

@ApiTags('tracking-event')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tracking-event')
export class TrackingEventController {
  constructor(private readonly trackingEventService: TrackingEventService) {}

  @Post()
  @ApiOperation({ summary: 'Crear evento de tracking' })
  @ApiSuccessMessage('Evento de tracking creado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER')
  create(@Body() dto: CreateTrackingEventDto) {
    return this.trackingEventService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos de tracking' })
  @ApiSuccessMessage('Listado de eventos de tracking obtenido')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER', 'CLIENT', 'USER', 'STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.trackingEventService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle evento de tracking' })
  @ApiSuccessMessage('Evento de tracking obtenido')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER', 'CLIENT', 'USER', 'STORE')
  findOne(@Param('id') id: string) {
    return this.trackingEventService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar evento de tracking' })
  @ApiSuccessMessage('Evento de tracking actualizado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER')
  update(@Param('id') id: string, @Body() dto: UpdateTrackingEventDto) {
    return this.trackingEventService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar evento de tracking' })
  @ApiSuccessMessage('Evento de tracking eliminado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER')
  remove(@Param('id') id: string) {
    return this.trackingEventService.remove(id);
  }
}
