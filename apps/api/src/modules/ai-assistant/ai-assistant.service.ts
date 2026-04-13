import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ text: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);
  private readonly apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  private readonly model = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-6';
  private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Workflow generation from natural-language business description
  // ============================================================

  async generateWorkflow(orgId: string, userId: string, description: string): Promise<{
    name: string;
    description: string;
    industry: string;
    icon: string;
    stages: Array<{
      name: string; icon: string; sequence: number; slaHours: number;
      qcRequired: boolean; isOutsourced: boolean; description: string;
    }>;
  }> {
    const prompt = `You are a manufacturing process consultant for Indian SMB factories.
A business owner has described their factory: "${description}"

Design a workflow for them. Output ONLY valid JSON with this exact shape:
{
  "name": "<2-4 word workflow name>",
  "description": "<one-sentence summary>",
  "industry": "<one of: TEXTILE, AUTO_COMPONENTS, PHARMA, FOOD_PROCESSING, JOB_WORK, PACKAGING, ELECTRONICS, GENERAL>",
  "icon": "<single emoji that represents the business>",
  "stages": [
    {
      "name": "<stage name 1-3 words>",
      "icon": "<single emoji>",
      "sequence": 1,
      "slaHours": <realistic hours expected>,
      "qcRequired": <true if quality is checked at this stage>,
      "isOutsourced": <true if usually sent to external vendor>,
      "description": "<what happens in this stage in 1 sentence>"
    }
  ]
}

Rules:
- Use 6-12 stages depending on complexity
- Match stages to actual industry practice in India
- Include QC stages for critical points
- Mark plating, heat treatment, printing, dyeing as outsourced if relevant
- Use realistic SLA hours (small workshop = shorter, large factory = longer)
- Stages must be in production sequence order
- icons should be relevant emojis

Return only the JSON. No prose.`;

    const result = await this.callClaude(prompt);
    await this.logInteraction(orgId, userId, 'WORKFLOW_GENERATION', description, result.text);

    try {
      // Extract JSON from response (Claude sometimes wraps in markdown)
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      this.logger.error(`Failed to parse AI workflow response: ${result.text}`);
      // Fallback: return a generic workflow
      return {
        name: 'Custom Workflow',
        description: description.slice(0, 100),
        industry: 'GENERAL',
        icon: '🏭',
        stages: [
          { name: 'Receipt', icon: '📥', sequence: 1, slaHours: 2, qcRequired: false, isOutsourced: false, description: 'Receive raw material' },
          { name: 'Process', icon: '⚙️', sequence: 2, slaHours: 8, qcRequired: false, isOutsourced: false, description: 'Main processing step' },
          { name: 'Quality Check', icon: '🔍', sequence: 3, slaHours: 2, qcRequired: true, isOutsourced: false, description: 'Inspection' },
          { name: 'Pack & Dispatch', icon: '📦', sequence: 4, slaHours: 4, qcRequired: false, isOutsourced: false, description: 'Pack and ship' },
        ],
      };
    }
  }

  // ============================================================
  // Natural language query — "What is my profit this quarter?"
  // ============================================================

  async naturalLanguageQuery(orgId: string, userId: string, question: string): Promise<{
    answer: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    // Pull a snapshot of factory state to feed Claude as context
    const [orgStats, recentOrders, lowStock] = await Promise.all([
      this.factoryStats(orgId),
      this.prisma.client.order.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customer: { select: { name: true } } },
      }),
      this.prisma.client.inventoryItem.findMany({
        where: { orgId },
        take: 30,
      }),
    ]);

    const context = JSON.stringify({
      orgStats,
      recentOrders: recentOrders.map((o) => ({
        orderNumber: o.orderNumber, status: o.status,
        totalValue: Number(o.totalValue) / 100,
        deliveryDate: o.deliveryDate, customer: o.customer.name,
      })),
      lowStockItems: lowStock
        .filter((i) => i.currentStock <= i.minimumStock && i.minimumStock > 0)
        .map((i) => ({ name: i.name, current: i.currentStock, minimum: i.minimumStock, unit: i.unit })),
    });

    const prompt = `You are a factory operations assistant for a manufacturing business in India.
Here's a snapshot of their data:
${context}

The user asks: "${question}"

Answer concisely (2-4 sentences). Use Indian numbering (lakhs/crores) for amounts.
If you don't have data to answer, say so honestly.
End with a follow-up question or suggested action if relevant.`;

    const result = await this.callClaude(prompt);
    await this.logInteraction(orgId, userId, 'NATURAL_LANGUAGE_QUERY', question, result.text);

    return {
      answer: result.text,
      confidence: result.text.toLowerCase().includes("don't have") ? 'low' : 'high',
    };
  }

  // ============================================================
  // Anomaly detection — daily digest
  // ============================================================

  async detectAnomalies(orgId: string): Promise<Array<{
    severity: 'info' | 'warning' | 'critical';
    title: string;
    detail: string;
    suggestion: string;
  }>> {
    const anomalies: Array<{ severity: 'info' | 'warning' | 'critical'; title: string; detail: string; suggestion: string }> = [];

    // Stuck job cards (in progress > 48hrs)
    const stuck = await this.prisma.client.jobCard.findMany({
      where: {
        orgId, status: 'IN_PROGRESS',
        startedAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      include: { order: { select: { orderNumber: true } }, department: { select: { name: true } } },
      take: 5,
    });
    for (const jc of stuck) {
      const hours = Math.round((Date.now() - (jc.startedAt?.getTime() ?? 0)) / 3_600_000);
      anomalies.push({
        severity: 'warning',
        title: `${jc.order.orderNumber} stuck at ${jc.department.name}`,
        detail: `In progress for ${hours} hours. SLA breached.`,
        suggestion: `Check with ${jc.department.name} supervisor — possible machine issue or material shortage.`,
      });
    }

    // Low stock items
    const items = await this.prisma.client.inventoryItem.findMany({
      where: { orgId },
    });
    const lowStock = items.filter((i) => i.currentStock <= i.minimumStock && i.minimumStock > 0);
    for (const item of lowStock.slice(0, 3)) {
      anomalies.push({
        severity: 'warning',
        title: `Low stock: ${item.name}`,
        detail: `Current: ${item.currentStock} ${item.unit}, minimum: ${item.minimumStock} ${item.unit}`,
        suggestion: `Create a purchase order to restock`,
      });
    }

    // Pending attendance approvals > 2 days old
    const oldPending = await this.prisma.client.attendanceRecord.count({
      where: {
        factoryOrgId: orgId, approvedBy: null,
        date: { lt: new Date(Date.now() - 2 * 86_400_000) },
      },
    });
    if (oldPending > 0) {
      anomalies.push({
        severity: 'critical',
        title: `${oldPending} attendance records overdue`,
        detail: `Workers waiting for wage approval older than 2 days`,
        suggestion: `Approve in /factory/people/attendance — wages will auto-post`,
      });
    }

    // Overdue invoices
    const overdue = await this.prisma.client.invoice.findMany({
      where: {
        orgId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
      include: { customer: { select: { name: true } } },
      take: 3,
    });
    for (const inv of overdue) {
      const days = Math.floor((Date.now() - (inv.dueDate?.getTime() ?? 0)) / 86_400_000);
      anomalies.push({
        severity: 'warning',
        title: `Overdue payment: ${inv.customer.name}`,
        detail: `Invoice ${inv.invoiceNumber} is ${days} days overdue. ₹${(Number(inv.totalAmount - inv.paidAmount) / 100).toLocaleString('en-IN')} outstanding.`,
        suggestion: `Send a payment reminder via WhatsApp`,
      });
    }

    return anomalies;
  }

  // ============================================================
  // Internals
  // ============================================================

  private async callClaude(prompt: string): Promise<{ text: string; tokens?: { in: number; out: number } }> {
    if (!this.apiKey) {
      this.logger.warn('[DEV] ANTHROPIC_API_KEY not set — returning stub response');
      return {
        text: `[DEV STUB — set ANTHROPIC_API_KEY in .env to enable real AI]\n\nYour question: ${prompt.slice(0, 200)}...`,
      };
    }

    try {
      const messages: ClaudeMessage[] = [{ role: 'user', content: prompt }];
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1500,
          messages,
        }),
      });
      if (!res.ok) {
        throw new Error(`Claude API ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as ClaudeResponse;
      return {
        text: data.content[0]?.text ?? '',
        tokens: data.usage ? { in: data.usage.input_tokens, out: data.usage.output_tokens } : undefined,
      };
    } catch (err) {
      this.logger.error(`Claude call failed: ${err}`);
      return { text: 'Sorry, I could not process that. Please try again.' };
    }
  }

  private async logInteraction(orgId: string, userId: string | null, type: string, prompt: string, response: string): Promise<void> {
    await this.prisma.client.aIInteraction.create({
      data: {
        orgId, userId,
        type: type as never,
        prompt: prompt.slice(0, 4000),
        response: response.slice(0, 8000),
        model: this.model,
      },
    });
  }

  private async factoryStats(orgId: string): Promise<Record<string, number>> {
    const [ordersInProduction, pendingJobCards, totalEmployees, monthSales] = await Promise.all([
      this.prisma.client.order.count({ where: { orgId, status: 'IN_PRODUCTION' } }),
      this.prisma.client.jobCard.count({ where: { orgId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      this.prisma.client.user.count({ where: { orgId, isActive: true } }),
      this.prisma.client.journalEntry.aggregate({
        where: {
          orgId, creditLedger: '4100',
          date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
    ]);
    return {
      ordersInProduction, pendingJobCards, totalEmployees,
      monthSalesRupees: Number(monthSales._sum.amount ?? 0n) / 100,
    };
  }
}
