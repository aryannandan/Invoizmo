import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatMoney, toMajorUnits, toMinorUnits } from '../../lib/utils';
import type { LineItem } from '../../types';

interface LineItemsTableProps {
  items: LineItem[];
  currency: string;
  readOnly?: boolean;
  onChange: (items: LineItem[]) => void;
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items,
  currency,
  readOnly,
  onChange,
}) => {
  const handleAddItem = () => {
    const newItem: LineItem = {
      description: '',
      quantity: 1,
      unit: 'hrs',
      unitPriceMinor: 0,
      amountMinor: 0,
    };
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (index: number, patch: Partial<LineItem>) => {
    const next = [...items];
    const item = { ...next[index], ...patch } as LineItem;
    // Calculate preview amount
    item.amountMinor = Math.round(item.quantity * item.unitPriceMinor);
    next[index] = item;
    onChange(next);
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 tracking-tight">Line Items</h4>
        {!readOnly && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddItem}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Line Item
          </Button>
        )}
      </div>

      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-subtle">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 font-medium">Description</th>
              <th className="py-2.5 px-3 font-medium w-24">Qty</th>
              <th className="py-2.5 px-3 font-medium w-24">Unit</th>
              <th className="py-2.5 px-3 font-medium w-32">Price ({currency})</th>
              <th className="py-2.5 px-3 font-medium text-right w-32">Amount</th>
              {!readOnly && <th className="py-2.5 px-3 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 text-sm">
                  No line items yet. Click &ldquo;Add Line Item&rdquo; to start.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const majorPrice = toMajorUnits(item.unitPriceMinor, currency);
                return (
                  <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={readOnly}
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                        placeholder="Description of product or service..."
                        className="w-full px-2.5 py-1.5 text-sm bg-transparent border border-transparent rounded-lg hover:border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        disabled={readOnly}
                        min="0"
                        step="any"
                        value={item.quantity || ''}
                        onChange={(e) =>
                          handleUpdateItem(index, { quantity: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent rounded-lg hover:border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none transition-all tabular-nums"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={readOnly}
                        value={item.unit || ''}
                        onChange={(e) => handleUpdateItem(index, { unit: e.target.value })}
                        placeholder="hrs, pcs"
                        className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent rounded-lg hover:border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none transition-all text-slate-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        disabled={readOnly}
                        min="0"
                        step="any"
                        value={majorPrice || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleUpdateItem(index, { unitPriceMinor: toMinorUnits(val, currency) });
                        }}
                        className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent rounded-lg hover:border-slate-200 focus:border-brand-500 focus:bg-white focus:outline-none transition-all tabular-nums"
                      />
                    </td>
                    <td className="p-2 text-right font-medium text-slate-900 tabular-nums">
                      {formatMoney(item.amountMinor, currency)}
                    </td>
                    {!readOnly && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition-all"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
