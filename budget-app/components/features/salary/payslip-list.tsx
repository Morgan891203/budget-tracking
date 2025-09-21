
'use client';

import { useState } from 'react';
import { Salary, Expense } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { deleteSalaryEntry } from '@/lib/actions';
import { DeleteButton } from '../expense/delete-button';

type PlainExpense = Omit<Expense, 'amount'> & {
  amount: number;
};

type Payslip = Omit<Salary, 'amount'> & {
  amount: number;
  deductions: PlainExpense[];
  totalDeductions: number;
  net: number;
};

export default function PayslipList({ payslips }: { payslips: Payslip[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (payslips.length === 0) {
    return <p className="text-gray-500">No salary entries for this month.</p>;
  }

  return (
    <ul className="space-y-4">
      {payslips.map((payslip) => (
        <li key={payslip.id} className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(payslip.id)}>
            <div>
              <p className="font-semibold text-lg">{payslip.source}</p>
              <p className="text-sm text-gray-500">
                Gross: {formatCurrency(payslip.amount)} | Deductions:{' '}
                {formatCurrency(payslip.totalDeductions)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">{formatCurrency(payslip.net)}</p>
              <p className="text-xs text-gray-500">Net Pay</p>
            </div>
          </div>
          {expandedId === payslip.id && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between"><span>Gross Pay</span><span>{formatCurrency(payslip.amount)}</span></div>
              <div className="mt-2">
                <h4 className="font-semibold">Deductions:</h4>
                <ul className="text-sm text-gray-600">
                  {payslip.deductions.map(deduction => (
                    <li key={deduction.id} className="flex justify-between">
                      <span>{deduction.description}</span>
                      <span>({formatCurrency(deduction.amount)})</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between font-semibold mt-2">
                <span>Total Deductions</span>
                <span>({formatCurrency(payslip.totalDeductions)})</span>
              </div>
              <div className="mt-4 flex justify-end">
                <form action={deleteSalaryEntry}>
                  <input type="hidden" name="id" value={payslip.id} />
                  <DeleteButton itemType={payslip.source} />
                </form>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}