/**
 * Pre-made workflow templates for common manufacturing verticals.
 * These are seeded per org on first login, and shown in the "Pick a template" step
 * of the workflow designer.
 */

export interface SeedStage {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sequence: number;
  slaHours?: number;
  qcRequired?: boolean;
  qcChecklist?: Array<{ parameter: string; expected: string }>;
  isOutsourced?: boolean;
  parallelGroupId?: string;
}

export interface SeedTemplate {
  name: string;
  description: string;
  industry: 'TEXTILE' | 'AUTO_COMPONENTS' | 'PHARMA' | 'FOOD_PROCESSING' | 'JOB_WORK' | 'PACKAGING' | 'ELECTRONICS' | 'GENERAL';
  icon: string;
  stages: SeedStage[];
}

export const SYSTEM_TEMPLATES: SeedTemplate[] = [
  {
    name: 'General Manufacturing',
    description: 'A simple 6-stage default workflow that works for most small factories.',
    industry: 'GENERAL',
    icon: '🏭',
    stages: [
      { name: 'Cutting', icon: '✂️', color: '#6366f1', sequence: 1, slaHours: 8 },
      { name: 'Machining', icon: '⚙️', color: '#8b5cf6', sequence: 2, slaHours: 16 },
      { name: 'Assembly', icon: '🔧', color: '#ec4899', sequence: 3, slaHours: 8 },
      { name: 'Quality Check', icon: '🔍', color: '#f59e0b', sequence: 4, slaHours: 4, qcRequired: true,
        qcChecklist: [
          { parameter: 'Dimensional accuracy', expected: 'As per drawing' },
          { parameter: 'Surface finish', expected: 'Ra 3.2' },
          { parameter: 'Count verification', expected: 'Matches order quantity' },
        ] },
      { name: 'Packing', icon: '📦', color: '#10b981', sequence: 5, slaHours: 4 },
      { name: 'Dispatch', icon: '🚚', color: '#06b6d4', sequence: 6, slaHours: 2 },
    ],
  },
  {
    name: 'Textile — Cotton Garments',
    description: 'Full cotton garment workflow: cutting → printing → stitching → finishing → packing.',
    industry: 'TEXTILE',
    icon: '👕',
    stages: [
      { name: 'Fabric Receipt', icon: '📥', sequence: 1, slaHours: 2 },
      { name: 'Cutting', icon: '✂️', sequence: 2, slaHours: 12, qcRequired: true,
        qcChecklist: [{ parameter: 'Cut size accuracy', expected: '±1mm' }, { parameter: 'Piece count', expected: 'Matches BOM' }] },
      { name: 'Printing / Dyeing', icon: '🎨', sequence: 3, slaHours: 24, isOutsourced: true,
        qcChecklist: [{ parameter: 'Color accuracy', expected: 'Pass Pantone match' }] },
      { name: 'Stitching', icon: '🪡', sequence: 4, slaHours: 48 },
      { name: 'Finishing', icon: '✨', sequence: 5, slaHours: 8 },
      { name: 'Quality Check', icon: '🔍', sequence: 6, slaHours: 4, qcRequired: true,
        qcChecklist: [
          { parameter: 'Stitch quality', expected: 'No loose threads' },
          { parameter: 'Measurements', expected: 'As per tech pack' },
          { parameter: 'Label placement', expected: 'Correct size and brand' },
        ] },
      { name: 'Ironing & Folding', icon: '👔', sequence: 7, slaHours: 6 },
      { name: 'Packing', icon: '📦', sequence: 8, slaHours: 4 },
      { name: 'Dispatch', icon: '🚚', sequence: 9, slaHours: 2 },
    ],
  },
  {
    name: 'Auto Components — Machined Parts',
    description: 'Precision machined parts: raw material → forging → machining → heat treatment → finish.',
    industry: 'AUTO_COMPONENTS',
    icon: '⚙️',
    stages: [
      { name: 'Raw Material Receipt', icon: '📥', sequence: 1, slaHours: 4, qcRequired: true,
        qcChecklist: [{ parameter: 'Material certificate', expected: 'Original with batch #' }, { parameter: 'Hardness test', expected: 'As per spec' }] },
      { name: 'Cutting / Forging', icon: '🔨', sequence: 2, slaHours: 16 },
      { name: 'Rough Machining', icon: '⚙️', sequence: 3, slaHours: 24 },
      { name: 'Heat Treatment', icon: '🔥', sequence: 4, slaHours: 12, isOutsourced: true,
        qcChecklist: [{ parameter: 'Hardness HRC', expected: '55-60 HRC' }] },
      { name: 'Finish Machining', icon: '🔧', sequence: 5, slaHours: 20 },
      { name: 'Grinding', icon: '💠', sequence: 6, slaHours: 8 },
      { name: 'Plating / Coating', icon: '🎨', sequence: 7, slaHours: 16, isOutsourced: true },
      { name: 'Final Inspection', icon: '🔍', sequence: 8, slaHours: 4, qcRequired: true,
        qcChecklist: [
          { parameter: 'CMM report', expected: 'All dimensions within tolerance' },
          { parameter: 'Surface finish', expected: 'Ra 0.8' },
          { parameter: 'PPAP documents', expected: 'Signed off' },
        ] },
      { name: 'Packing', icon: '📦', sequence: 9, slaHours: 4 },
      { name: 'Dispatch', icon: '🚚', sequence: 10, slaHours: 2 },
    ],
  },
  {
    name: 'Pharma — Tablet Manufacturing',
    description: 'GMP-compliant tablet workflow: dispensing → granulation → compression → coating → packing.',
    industry: 'PHARMA',
    icon: '💊',
    stages: [
      { name: 'Raw Material Dispensing', icon: '⚖️', sequence: 1, slaHours: 4, qcRequired: true,
        qcChecklist: [
          { parameter: 'Active ingredient purity', expected: '≥ 99%' },
          { parameter: 'Batch number recorded', expected: 'Yes' },
          { parameter: 'Weight accuracy', expected: '±0.1%' },
        ] },
      { name: 'Granulation', icon: '🧪', sequence: 2, slaHours: 8 },
      { name: 'Drying', icon: '☀️', sequence: 3, slaHours: 6 },
      { name: 'Lubrication & Blending', icon: '🌀', sequence: 4, slaHours: 2 },
      { name: 'Compression', icon: '💊', sequence: 5, slaHours: 12, qcRequired: true,
        qcChecklist: [
          { parameter: 'Tablet weight', expected: 'Average ± 5%' },
          { parameter: 'Hardness', expected: '4-8 kp' },
          { parameter: 'Disintegration time', expected: '< 15 min' },
        ] },
      { name: 'Coating', icon: '🎨', sequence: 6, slaHours: 8 },
      { name: 'Blister Packing', icon: '📦', sequence: 7, slaHours: 6 },
      { name: 'Secondary Packing', icon: '📦', sequence: 8, slaHours: 4 },
      { name: 'Batch Release QC', icon: '✅', sequence: 9, slaHours: 24, qcRequired: true,
        qcChecklist: [
          { parameter: 'Assay', expected: '95-105%' },
          { parameter: 'Dissolution', expected: 'As per USP' },
          { parameter: 'Microbial limit', expected: 'Within limits' },
        ] },
      { name: 'Dispatch', icon: '🚚', sequence: 10, slaHours: 4 },
    ],
  },
  {
    name: 'Food Processing — Packaged Snacks',
    description: 'Raw receipt → cleaning → cooking → cooling → packaging → cold storage → dispatch.',
    industry: 'FOOD_PROCESSING',
    icon: '🥨',
    stages: [
      { name: 'Raw Material Receipt', icon: '📥', sequence: 1, slaHours: 2, qcRequired: true,
        qcChecklist: [{ parameter: 'Freshness check', expected: 'No spoilage' }, { parameter: 'Weight verification', expected: 'Matches PO' }] },
      { name: 'Cleaning & Sorting', icon: '🧺', sequence: 2, slaHours: 4 },
      { name: 'Processing', icon: '🍳', sequence: 3, slaHours: 6 },
      { name: 'Cooking / Frying', icon: '🔥', sequence: 4, slaHours: 4 },
      { name: 'Cooling', icon: '❄️', sequence: 5, slaHours: 2 },
      { name: 'Seasoning', icon: '🧂', sequence: 6, slaHours: 2 },
      { name: 'Quality Check', icon: '🔍', sequence: 7, slaHours: 2, qcRequired: true,
        qcChecklist: [{ parameter: 'Taste test', expected: 'As per standard' }, { parameter: 'Texture', expected: 'Crisp' }] },
      { name: 'Packaging', icon: '📦', sequence: 8, slaHours: 6 },
      { name: 'Cold Storage', icon: '🧊', sequence: 9, slaHours: 12 },
      { name: 'Dispatch', icon: '🚚', sequence: 10, slaHours: 2 },
    ],
  },
  {
    name: 'Job Work / CNC Workshop',
    description: 'Simple job work workflow for CNC / VMC / turning operations.',
    industry: 'JOB_WORK',
    icon: '🔩',
    stages: [
      { name: 'Drawing Approval', icon: '📐', sequence: 1, slaHours: 2 },
      { name: 'Material Arrangement', icon: '📦', sequence: 2, slaHours: 8 },
      { name: 'Programming', icon: '💻', sequence: 3, slaHours: 4 },
      { name: 'Setup', icon: '🔧', sequence: 4, slaHours: 2 },
      { name: 'Machining', icon: '⚙️', sequence: 5, slaHours: 24 },
      { name: 'Inspection', icon: '🔍', sequence: 6, slaHours: 2, qcRequired: true,
        qcChecklist: [{ parameter: 'Dimensional check', expected: 'Within tolerance' }] },
      { name: 'Delivery', icon: '🚚', sequence: 7, slaHours: 2 },
    ],
  },
  {
    name: 'Packaging Manufacturer',
    description: 'Corrugated boxes, cartons, labels — from raw paper to finished product.',
    industry: 'PACKAGING',
    icon: '📦',
    stages: [
      { name: 'Paper Receipt', icon: '📥', sequence: 1, slaHours: 2 },
      { name: 'Die Preparation', icon: '🛠️', sequence: 2, slaHours: 4 },
      { name: 'Printing', icon: '🖨️', sequence: 3, slaHours: 8 },
      { name: 'Lamination', icon: '📄', sequence: 4, slaHours: 6 },
      { name: 'Die Cutting', icon: '✂️', sequence: 5, slaHours: 6 },
      { name: 'Pasting / Folding', icon: '🗃️', sequence: 6, slaHours: 8 },
      { name: 'Quality Check', icon: '🔍', sequence: 7, slaHours: 2, qcRequired: true,
        qcChecklist: [{ parameter: 'Print quality', expected: 'No smudges' }, { parameter: 'Crease accuracy', expected: 'Within 1mm' }] },
      { name: 'Packing', icon: '📦', sequence: 8, slaHours: 4 },
      { name: 'Dispatch', icon: '🚚', sequence: 9, slaHours: 2 },
    ],
  },
  {
    name: 'Electronics Assembly (PCBA)',
    description: 'SMT + through-hole assembly, testing, and packing for electronic boards.',
    industry: 'ELECTRONICS',
    icon: '🔌',
    stages: [
      { name: 'Component Kitting', icon: '📥', sequence: 1, slaHours: 4 },
      { name: 'Solder Paste Application', icon: '🧴', sequence: 2, slaHours: 2 },
      { name: 'SMT Placement', icon: '🤖', sequence: 3, slaHours: 8 },
      { name: 'Reflow Soldering', icon: '🔥', sequence: 4, slaHours: 2 },
      { name: 'Through-Hole Assembly', icon: '🔧', sequence: 5, slaHours: 6 },
      { name: 'Wave Soldering', icon: '🌊', sequence: 6, slaHours: 2 },
      { name: 'Visual Inspection', icon: '👁️', sequence: 7, slaHours: 2, qcRequired: true,
        qcChecklist: [{ parameter: 'No cold joints', expected: 'Visual pass' }] },
      { name: 'Functional Testing', icon: '⚡', sequence: 8, slaHours: 4, qcRequired: true,
        qcChecklist: [{ parameter: 'Power-on test', expected: 'Pass' }, { parameter: 'I/O test', expected: 'All channels OK' }] },
      { name: 'Conformal Coating', icon: '🎨', sequence: 9, slaHours: 6 },
      { name: 'Packing', icon: '📦', sequence: 10, slaHours: 2 },
      { name: 'Dispatch', icon: '🚚', sequence: 11, slaHours: 2 },
    ],
  },
];
