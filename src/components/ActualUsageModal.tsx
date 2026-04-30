"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Subscription } from "@/types";
import { formatCurrency } from "@/lib/constants";

interface Props {
  sub: Subscription;
  onConfirm: (actualUsage: number) => void;
  onCancel: () => void;
}

export default function ActualUsageModal({ sub, onConfirm, onCancel }: Props) {
  const [usage, setUsage] = useState<string>(sub.amount.toString());

  const usageNum = parseFloat(usage) || 0;
  const minCharge = sub.minimumCharge ?? 0;
  const billed = Math.max(minCharge, usageNum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-full">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Mark as Paid</h2>
            <p className="text-sm text-gray-500">{sub.name}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actual Usage Amount (₹)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {minCharge > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Minimum charge: {formatCurrency(minCharge, 2)} — you&apos;ll be billed the higher amount
            </p>
          )}
        </div>

        <div className="bg-indigo-50 rounded-lg px-4 py-3 mb-4 text-sm">
          <span className="text-gray-600">Amount to be logged as expense: </span>
          <span className="font-semibold text-indigo-700">{formatCurrency(billed, 2)}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(usageNum)}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}
