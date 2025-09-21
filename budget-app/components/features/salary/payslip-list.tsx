'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { FilePenLine } from 'lucide-react';
import { deleteSalaryEntry, updatePayslip } from '@/lib/actions';
import { DeleteButton } from '@/components/features/expense/delete-button';
import { format } from 'date-fns';
import type { Prisma, Expense, Salary } from '@prisma/client';

// Helper function to format currency
function formatCurrency(amount: number | Prisma.Decimal) {
  const number = typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number);
}

type PlainExpense = Omit<Expense, 'amount'> & { amount: number };
type PlainSalary = Omit<Salary, 'amount'> & { amount: number };

export type PayslipData = PlainSalary & {
  deductions: PlainExpense[];
  totalDeductions: number;
  net: number;
};

function EditPayslipSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

function EditPayslip({ payslip }: { payslip: PayslipData }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleUpdate = async (formData: FormData) => {
    await updatePayslip(formData);
    setIsOpen(false);
  };

  const getDeductionAmount = (description: string) => {
    const deduction = payslip.deductions.find(d => d.description === description);
    return deduction ? deduction.amount : '';
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="p-1.5 text-blue-600 rounded-md hover:bg-blue-100 hover:text-blue-800"
        aria-label="Edit payslip"
      >
        <FilePenLine className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Edit Payslip</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={payslip.id} />

              {/* Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`month-${payslip.id}`} className="block text-sm font-medium text-gray-700">Month</label>
                  <select id={`month-${payslip.id}`} name="month" required defaultValue={(new Date(payslip.date).getMonth() + 1).toString().padStart(2, '0')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`year-${payslip.id}`} className="block text-sm font-medium text-gray-700">Year</label>
                  <select id={`year-${payslip.id}`} name="year" required defaultValue={new Date(payslip.date).getFullYear()} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary */}
              <div>
                <label htmlFor={`gross-pay-${payslip.id}`} className="block text-sm font-medium text-gray-700">Gross Salary</label>
                <input type="number" id={`gross-pay-${payslip.id}`} name="gross-pay" step="0.01" required defaultValue={payslip.amount} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>

              {/* Taxes */}
              <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                <h3 className="text-lg font-medium text-gray-800">Taxes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`federal-tax-${payslip.id}`} className="block text-sm font-medium text-gray-700">Federal Income Tax</label>
                    <input type="number" id={`federal-tax-${payslip.id}`} name="federal-tax" step="0.01" defaultValue={getDeductionAmount('Federal Income Tax')} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor={`social-security-tax-${payslip.id}`} className="block text-sm font-medium text-gray-700">Social Security Tax</label>
                    <input type="number" id={`social-security-tax-${payslip.id}`} name="social-security-tax" step="0.01" defaultValue={getDeductionAmount('Social Security Tax')} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor={`medicare-tax-${payslip.id}`} className="block text-sm font-medium text-gray-700">Medicare Tax</label>
                    <input type="number" id={`medicare-tax-${payslip.id}`} name="medicare-tax" step="0.01" defaultValue={getDeductionAmount('Medicare Tax')} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor={`ca-state-tax-${payslip.id}`} className="block text-sm font-medium text-gray-700">CA State Income Tax</label>
                    <input type="number" id={`ca-state-tax-${payslip.id}`} name="ca-state-tax" step="0.01" defaultValue={getDeductionAmount('CA State Income Tax')} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor={`ca-sdi-tax-${payslip.id}`} className="block text-sm font-medium text-gray-700">CA SDI Tax</label>
                    <input type="number" id={`ca-sdi-tax-${payslip.id}`} name="ca-sdi-tax" step="0.01" defaultValue={getDeductionAmount('CA SDI Tax')} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                <h3 className="text-lg font-medium text-gray-800">Benefits</h3>
                <div>
                  <label htmlFor={`medical-pre-tax-${payslip.id}`} className="block text-sm font-medium text-gray-700">Medical Pre Tax</label>
                  <input type="number" id={`medical-pre-tax-${payslip.id}`} name="medical-pre-tax" step="0.01" defaultValue={getDeductionAmount('Medical Pre Tax')} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              {/* Retirement */}
              <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                <h3 className="text-lg font-medium text-gray-800">Retirement</h3>
                <div>
                  <label htmlFor={`401k-${payslip.id}`} className="block text-sm font-medium text-gray-700">401K</label>
                  <input type="number" id={`401k-${payslip.id}`} name="401k" step="0.01" defaultValue={getDeductionAmount('401K')} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              {/* Other */}
              <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                <h3 className="text-lg font-medium text-gray-800">Other</h3>
                <div>
                  <label htmlFor={`other-${payslip.id}`} className="block text-sm font-medium text-gray-700">Other Deductions</label>
                  <input type="number" id={`other-${payslip.id}`} name="other" step="0.01" defaultValue={getDeductionAmount('Other')} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancel
                </button>
                <EditPayslipSubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function PayslipItem({ payslip, title }: { payslip: PayslipData; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isBonus = payslip.source === 'Bonus';

  return (
    <li className="p-4">
      <div
        onClick={() => !isBonus && setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center text-left ${!isBonus && 'cursor-pointer'
          }`}
      >
        <div>
          <p className="font-semibold text-gray-800">{title}</p>
          <p className="text-sm text-gray-500">
            {isBonus ? `Amount: ${formatCurrency(payslip.amount)}` : `Gross: ${formatCurrency(payslip.amount)} | Deductions: ${formatCurrency(payslip.totalDeductions)}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-semibold text-green-600 text-lg">{formatCurrency(payslip.net)}</p>
          <div className="flex items-center gap-2">
            {!isBonus && <EditPayslip payslip={payslip} />}
            <form action={deleteSalaryEntry} onClick={(e) => e.stopPropagation()}>
              <input type="hidden" name="id" value={payslip.id} />
              <DeleteButton />
            </form>
          </div>
          {!isBonus && (
            <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </span>
          )}
        </div>
      </div>
      {!isBonus && isOpen && (
        <div className="mt-4 pl-4 border-l-2 border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">Deductions:</h4>
          <ul className="space-y-1">
            {payslip.deductions.map((deduction) => (
              <li key={deduction.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{deduction.description}</span>
                <span className="text-red-600">{formatCurrency(deduction.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function PayslipList({ payslips }: { payslips: PayslipData[] }) {
  const payslipEntries = payslips.filter((p) => p.source === 'Payslip');

  return (
    <div className="bg-white rounded-lg shadow-md">
      <ul className="divide-y divide-gray-200">
        {payslips.length === 0 ? (
          <li className="p-4 text-center text-gray-500">
            No payslips found for this period.
          </li>
        ) : (
          payslips.map((payslip) => {
            let title = payslip.source;
            if (payslip.source === 'Payslip' && payslipEntries.length > 1) {
              const payslipIndex = payslipEntries.findIndex(
                (p) => p.id === payslip.id
              );
              // Since payslips are sorted descending by date, we reverse the index for display
              title = `Payslip #${payslipEntries.length - payslipIndex}`;
            }
            return <PayslipItem key={payslip.id} payslip={payslip} title={title} />;
          })
        )}
      </ul>
    </div>
  );
}
