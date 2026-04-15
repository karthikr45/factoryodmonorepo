import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

import { ContentService } from './content.service';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly service: ContentService) {}

  // ---- Public endpoints (used by landing page) ----

  @Public()
  @Get('testimonials')
  async testimonials(): ReturnType<ContentService['listPublishedTestimonials']> {
    return this.service.listPublishedTestimonials();
  }

  @Public()
  @Get('faqs')
  async faqs(@Query('category') category?: string): ReturnType<ContentService['listPublishedFAQs']> {
    return this.service.listPublishedFAQs(category);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Real-time public stats — orders count, GMV, factories on platform' })
  async stats(): ReturnType<ContentService['publicStats']> {
    return this.service.publicStats();
  }

  @Public()
  @Get('block/:key')
  async getBlock(@Param('key') key: string): ReturnType<ContentService['getBlock']> {
    return this.service.getBlock(key);
  }

  @Public()
  @Post('contact')
  @ApiOperation({ summary: 'Submit contact form' })
  async contact(@Body() body: Parameters<ContentService['submitContact']>[0]): ReturnType<ContentService['submitContact']> {
    return this.service.submitContact(body);
  }

  // ---- Admin endpoints (super admin only — guard added at the page level) ----

  @Get('testimonials/all')
  async listTestimonials(): ReturnType<ContentService['listAllTestimonials']> {
    return this.service.listAllTestimonials();
  }

  @Post('testimonials')
  async createTestimonial(@Body() body: Parameters<ContentService['createTestimonial']>[0]): ReturnType<ContentService['createTestimonial']> {
    return this.service.createTestimonial(body);
  }

  @Put('testimonials/:id')
  async updateTestimonial(@Param('id') id: string, @Body() body: Parameters<ContentService['updateTestimonial']>[1]): ReturnType<ContentService['updateTestimonial']> {
    return this.service.updateTestimonial(id, body);
  }

  @Delete('testimonials/:id')
  async deleteTestimonial(@Param('id') id: string): ReturnType<ContentService['deleteTestimonial']> {
    return this.service.deleteTestimonial(id);
  }

  @Get('faqs/all')
  async listFAQs(): ReturnType<ContentService['listAllFAQs']> {
    return this.service.listAllFAQs();
  }

  @Post('faqs')
  async createFAQ(@Body() body: Parameters<ContentService['createFAQ']>[0]): ReturnType<ContentService['createFAQ']> {
    return this.service.createFAQ(body);
  }

  @Put('faqs/:id')
  async updateFAQ(@Param('id') id: string, @Body() body: Parameters<ContentService['updateFAQ']>[1]): ReturnType<ContentService['updateFAQ']> {
    return this.service.updateFAQ(id, body);
  }

  @Delete('faqs/:id')
  async deleteFAQ(@Param('id') id: string): ReturnType<ContentService['deleteFAQ']> {
    return this.service.deleteFAQ(id);
  }

  @Get('contact/all')
  async listContacts(@Query('status') status?: string): ReturnType<ContentService['listContactSubmissions']> {
    return this.service.listContactSubmissions(status);
  }

  @Put('contact/:id/status')
  async updateContactStatus(@Param('id') id: string, @Body() body: { status: string; notes?: string }): ReturnType<ContentService['updateContactStatus']> {
    return this.service.updateContactStatus(id, body.status, body.notes);
  }

  @Get('blocks')
  async listBlocks(): ReturnType<ContentService['listBlocks']> {
    return this.service.listBlocks();
  }

  @Put('blocks/:key')
  async setBlock(
    @Param('key') key: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { value: string; type?: string },
  ): ReturnType<ContentService['setBlock']> {
    return this.service.setBlock(key, body.value, body.type ?? 'string', user.id);
  }
}
