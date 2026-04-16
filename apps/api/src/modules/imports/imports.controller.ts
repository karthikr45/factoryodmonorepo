import { BadRequestException, Body, Controller, Get, Header, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { OrgId } from '../../common/decorators/org-id.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

import { ImportsService } from './imports.service';

type ImportKind = 'customers' | 'vendors' | 'employees';

const KINDS: ImportKind[] = ['customers', 'vendors', 'employees'];

@ApiBearerAuth()
@ApiTags('imports')
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Get('template/:kind')
  @ApiOperation({ summary: 'Download a CSV template (header row + one example)' })
  @Header('Content-Type', 'text/csv')
  template(@Param('kind') kind: string, @Res() res: Response): void {
    if (!KINDS.includes(kind as ImportKind)) {
      throw new BadRequestException(`Unknown template kind: ${kind}`);
    }
    const csv = this.imports.buildTemplate(kind as ImportKind);
    res.setHeader('Content-Disposition', `attachment; filename="${kind}-template.csv"`);
    res.end(csv);
  }

  /**
   * Body: { csv: string }
   * Gated by `team.manage` — import is an admin op regardless of kind.
   */
  @Post(':kind')
  @RequirePermissions('team.manage')
  @ApiOperation({ summary: 'Import rows from a CSV body. Upserts by phone (customers/employees) or name (vendors).' })
  async run(
    @OrgId() orgId: string,
    @Param('kind') kind: string,
    @Body() body: { csv: string },
  ): Promise<unknown> {
    if (!body?.csv) throw new BadRequestException('csv field is required in request body');
    switch (kind) {
      case 'customers':
        return this.imports.importCustomers(orgId, body.csv);
      case 'vendors':
        return this.imports.importVendors(orgId, body.csv);
      case 'employees':
        return this.imports.importEmployees(orgId, body.csv);
      default:
        throw new BadRequestException(`Unknown import kind: ${kind}`);
    }
  }
}
