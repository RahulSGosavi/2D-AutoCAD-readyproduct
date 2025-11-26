// src/components/modern/ItemsListPanel.tsx
import React, { useMemo } from 'react';
import { X, List, DollarSign, Package, Printer, Download } from 'lucide-react';
import { useEditorStore } from '../../state/useEditorStore';

interface ItemsListPanelProps {
  onClose: () => void;
}

interface ItemSummary {
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  items: any[];
}

export const ItemsListPanel: React.FC<ItemsListPanelProps> = ({ onClose }) => {
  const { elements, drawingSettings } = useEditorStore();
  const unit = drawingSettings.unit || 'mm';

  // Group and summarize items
  const itemsSummary = useMemo(() => {
    const grouped: Record<string, ItemSummary> = {};
    
    elements.forEach((el) => {
      const elem = el as any;
      // Skip dimension lines and basic shapes
      if (['dimension', 'line', 'free', 'polyline'].includes(el.type)) return;
      
      const key = elem.blockId || elem.name || el.type;
      const name = elem.name || elem.label || el.type;
      const price = elem.price || 0;
      
      if (!grouped[key]) {
        grouped[key] = {
          type: el.type,
          name: name,
          quantity: 0,
          unitPrice: price,
          totalPrice: 0,
          items: [],
        };
      }
      
      grouped[key].quantity += 1;
      grouped[key].totalPrice += price;
      grouped[key].items.push(elem);
    });
    
    return Object.values(grouped).sort((a, b) => a.type.localeCompare(b.type));
  }, [elements]);

  const totalItems = itemsSummary.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotal = itemsSummary.reduce((sum, item) => sum + item.totalPrice, 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Items List - KAB Studio</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e293b; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          .total-row { background: #f8fafc; font-weight: 600; }
          .price { text-align: right; }
          .quantity { text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Items List</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th class="quantity">Qty</th>
              <th class="price">Unit Price</th>
              <th class="price">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsSummary.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td class="quantity">${item.quantity}</td>
                <td class="price">$${item.unitPrice.toFixed(2)}</td>
                <td class="price">$${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Total</td>
              <td class="quantity">${totalItems}</td>
              <td></td>
              <td class="price">$${grandTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const headers = ['Item', 'Type', 'Quantity', 'Unit Price', 'Total'];
    const rows = itemsSummary.map(item => [
      item.name,
      item.type,
      item.quantity,
      item.unitPrice.toFixed(2),
      item.totalPrice.toFixed(2),
    ]);
    rows.push(['Total', '', totalItems, '', grandTotal.toFixed(2)]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items-list.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <List size={16} className="text-cyan-400" />
          <h3 className="text-white font-semibold text-sm">Items List</h3>
          <span className="text-xs text-slate-400">({totalItems} items)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrint}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            title="Print"
          >
            <Printer size={14} />
          </button>
          <button
            onClick={handleExportCSV}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            title="Export CSV"
          >
            <Download size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1 overflow-y-auto p-3">
        {itemsSummary.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Package size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items in design</p>
            <p className="text-xs mt-1">Add cabinets or furniture to see them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {itemsSummary.map((item, index) => (
              <div
                key={index}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{item.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{item.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    {item.unitPrice > 0 && (
                      <p className="text-sm text-emerald-400 font-medium">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Total */}
      {grandTotal > 0 && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              <span className="text-sm text-slate-300">Grand Total</span>
            </div>
            <span className="text-lg font-bold text-emerald-400">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

