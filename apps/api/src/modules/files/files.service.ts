import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    orgId: string,
    userId: string,
    input: {
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      category: string;
      relatedType?: string;
      relatedId?: string;
    },
  ): Promise<{ id: string; fileUrl: string }> {
    const file = await this.prisma.client.fileAttachment.create({
      data: {
        orgId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        category: input.category as never,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
        uploadedBy: userId,
      },
    });
    return { id: file.id, fileUrl: file.fileUrl };
  }

  async listByRelated(
    orgId: string,
    relatedType: string,
    relatedId: string,
  ): Promise<Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    category: string;
    createdAt: Date;
  }>> {
    return this.prisma.client.fileAttachment.findMany({
      where: { orgId, relatedType, relatedId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByCategory(orgId: string, category: string): Promise<Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    category: string;
    relatedType: string | null;
    relatedId: string | null;
    createdAt: Date;
  }>> {
    return this.prisma.client.fileAttachment.findMany({
      where: { orgId, category: category as never },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async delete(orgId: string, id: string): Promise<{ ok: true }> {
    const file = await this.prisma.client.fileAttachment.findFirst({ where: { id, orgId } });
    if (!file) throw new NotFoundException('File not found');
    await this.prisma.client.fileAttachment.delete({ where: { id } });
    return { ok: true };
  }
}
