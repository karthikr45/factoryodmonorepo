'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

type Kind = 'customers' | 'vendors' | 'employees';

interface ImportResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

const TABS: Array<{ key: Kind; label: string; help: string }> = [
  { key: 'customers', label: 'Customers', help: 'Required columns: name, phone. Optional: email, gstin, address, creditLimitRupees.' },
  { key: 'vendors', label: 'Vendors', help: 'Required columns: name, phone. Optional: gstin, address.' },
  { key: 'employees', label: 'Direct employees', help: 'Required columns: name, phone, role (WORKER or MANAGER). Optional: designation, department, monthlySalaryRupees, email.' },
];

export default function ImportsPage(): JSX.Element {
  const [kind, setKind] = useState<Kind>('customers');
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => setCsv(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsText(file);
  };

  const run = (): void => {
    setError(null); setResult(null);
    if (!csv.trim()) { setError('Paste a CSV or pick a file first'); return; }
    start(async () => {
      try {
        const res = await apiCall<ImportResult>({
          url: `/imports/${kind}`,
          method: 'POST',
          data: { csv },
        });
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
      }
    });
  };

  const downloadTemplate = (): void => {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/imports/template/${kind}`;
    window.open(url, '_blank', 'noopener');
  };

  const tab = TABS.find((t) => t.key === kind)!;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Bulk import</h1>
      <p className="mt-1 text-neutral-600">Bring your existing customer / vendor / staff data into FactoryOS in a single upload.</p>

      <div className="mt-6 flex gap-2 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setKind(t.key); setResult(null); setError(null); }}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              kind === t.key ? 'border-brand-700 text-brand-900' : 'border-transparent text-neutral-500 hover:text-brand-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-brand-900">Import {tab.label.toLowerCase()}</h2>
            <p className="mt-1 text-sm text-neutral-600">{tab.help}</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>Download template</Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Pick a CSV file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-700 hover:file:bg-brand-100"
            />
          </label>
          <div className="text-sm text-neutral-500">
            <span className="font-semibold">Tip:</span> rows where <code>phone</code> already exists in this org will be UPDATED, not duplicated.
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-neutral-700">…or paste CSV directly</span>
          <textarea
            rows={10}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="name,phone,email,gstin,address,creditLimitRupees&#10;Tata Steel,9876543210,..."
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>

        <div className="mt-4 flex gap-2">
          <Button onClick={run} disabled={pending || !csv.trim()}>
            {pending ? 'Importing…' : `Import ${tab.label.toLowerCase()}`}
          </Button>
          {csv && (
            <Button variant="outline" onClick={() => { setCsv(''); setResult(null); setError(null); }}>Clear</Button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
        )}

        {result && (
          <div className="mt-6 rounded-lg border border-neutral-200 p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <Stat label="Total rows" value={result.total} />
              <Stat label="Created" value={result.inserted} colour="text-success-700" />
              <Stat label="Updated" value={result.updated} colour="text-brand-700" />
              <Stat label="Skipped" value={result.skipped} colour={result.skipped ? 'text-warning-700' : 'text-neutral-500'} />
            </div>
            {result.errors.length > 0 && (
              <details className="mt-3" open>
                <summary className="cursor-pointer text-sm font-semibold text-danger-700">
                  {result.errors.length} row{result.errors.length === 1 ? '' : 's'} skipped
                </summary>
                <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-xs text-neutral-700">
                  {result.errors.map((e, i) => (
                    <li key={i} className="font-mono">Row {e.row}: {e.reason}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, colour = 'text-brand-900' }: { label: string; value: number; colour?: string }): JSX.Element {
  return (
    <div>
      <div className={`text-2xl font-bold ${colour}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
    </div>
  );
}
