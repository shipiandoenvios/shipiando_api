import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionsService } from './permissions.service';
import type { Policy } from '../../common/permissions/abac.util';
import { logPolicyChange } from '../../common/logging/audit.logger';
import { RequestWithUser } from 'src/common/permissions/permission.util';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly svc: PermissionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List ABAC policies (admin only)' })
  list() {
    return { success: true, data: this.svc.list() };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Replace ABAC policies (admin only)' })
  save(@Body() policies: Policy[], @Req() req: RequestWithUser) {
    const before = this.svc.list();
    const result = this.svc.save(policies);
    try {
      logPolicyChange({
        timestamp: new Date().toISOString(),
        userId: req?.user?.id ?? null,
        before,
        after: result,
      });
    } catch (e) {
      // non-fatal

      console.warn('Failed to write policy change audit', e);
    }
    return { success: true, data: result };
  }
}
