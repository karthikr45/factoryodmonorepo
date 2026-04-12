import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { FilesService } from './files.service';

@ApiBearerAuth()
@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a file upload (URL from Supabase Storage / S3)' })
  async upload(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: {
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      category: string;
      relatedType?: string;
      relatedId?: string;
    },
  ): ReturnType<FilesService['upload']> {
    return this.filesService.upload(orgId, user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List files by related entity or category' })
  async list(
    @OrgId() orgId: string,
    @Query('relatedType') relatedType?: string,
    @Query('relatedId') relatedId?: string,
    @Query('category') category?: string,
  ): Promise<unknown> {
    if (relatedType && relatedId) {
      return this.filesService.listByRelated(orgId, relatedType, relatedId);
    }
    if (category) {
      return this.filesService.listByCategory(orgId, category);
    }
    return [];
  }

  @Delete(':id')
  async delete(@OrgId() orgId: string, @Param('id') id: string): ReturnType<FilesService['delete']> {
    return this.filesService.delete(orgId, id);
  }
}
