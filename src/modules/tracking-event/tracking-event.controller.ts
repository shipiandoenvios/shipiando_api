import { RequestWithUser } from '../../common/permissions/permission.util';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
  create(@Body() dto: CreateTrackingEventDto, @Req() req?: RequestWithUser) {
    return this.trackingEventService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos de tracking' })
  @ApiSuccessMessage('Listado de eventos de tracking obtenido')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER', 'CLIENT', 'USER', 'STORE')
  findAll(@Query() query: PaginationQueryDto, @Req() req?: RequestWithUser) {
    return this.trackingEventService.findAll(query, req?.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle evento de tracking' })
  @ApiSuccessMessage('Evento de tracking obtenido')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER', 'CLIENT', 'USER', 'STORE')
  findOne(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.trackingEventService.findOne(id, req?.clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar evento de tracking' })
  @ApiSuccessMessage('Evento de tracking actualizado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTrackingEventDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.trackingEventService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar evento de tracking' })
  @ApiSuccessMessage('Evento de tracking eliminado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.trackingEventService.remove(id, req?.user);
  }
}
