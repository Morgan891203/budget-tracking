'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { FilePlus2 } from 'lucide-react';
import { createBonus, createPayslip } from '@/lib/actions';

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Adding...' : text}
    </button>
  );
}

export function SalaryForm() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const [formType, setFormType] = useState<'payslip' | 'bonus'>('payslip');

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <div className="flex items-center gap-3">
        <FilePlus2 className="h-7 w-7 text-blue-600" />
        <h2 className="text-2xl font-semibold text-gray-800">Add New Entry</h2>
      </div>

      <div className="flex gap-4 border-b border-gray-200 pb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="entryType"
            value="payslip"
            checked={formType === 'payslip'}
            onChange={() => setFormType('payslip')}
            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="font-medium text-gray-700">Payslip</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="entryType"
            value="bonus"
            checked={formType === 'bonus'}
            onChange={() => setFormType('bonus')}
            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="font-medium text-gray-700">Bonus</span>
        </label>
      </div>

      {formType === 'payslip' ? (
        <form action={createPayslip} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month</label>
              <select id="month" name="month" required defaultValue={(new Date().getMonth() + 1).toString().padStart(2, '0')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
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
            <div className="md:col-span-1">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
              <select id="year" name="year" required defaultValue={currentYear} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="gross-pay" className="block text-sm font-medium text-gray-700">Gross Salary</label>
            <input type="number" id="gross-pay" name="gross-pay" step="0.01" required placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <h3 className="text-lg font-medium text-gray-800">Taxes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="federal-tax" className="block text-sm font-medium text-gray-700">Federal Income Tax</label>
                <input type="number" id="federal-tax" name="federal-tax" step="0.01" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="social-security-tax" className="block text-sm font-medium text-gray-700">Social Security Tax</label>
                <input type="number" id="social-security-tax" name="social-security-tax" step="0.01" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="medicare-tax" className="block text-sm font-medium text-gray-700">Medicare Tax</label>
                <input type="number" id="medicare-tax" name="medicare-tax" step="0.01" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="ca-state-tax" className="block text-sm font-medium text-gray-700">CA State Income Tax</label>
                <input type="number" id="ca-state-tax" name="ca-state-tax" step="0.01" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="ca-sdi-tax" className="block text-sm font-medium text-gray-700">CA SDI Tax</label>
                <input type="number" id="ca-sdi-tax" name="ca-sdi-tax" step="0.01" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <h3 className="text-lg font-medium text-gray-800">Benefits</h3>
            <div>
              <label htmlFor="medical-pre-tax" className="block text-sm font-medium text-gray-700">Medical Pre Tax</label>
              <input type="number" id="medical-pre-tax" name="medical-pre-tax" step="0.01" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <h3 className="text-lg font-medium text-gray-800">Retirement</h3>
            <div>
              <label htmlFor="401k" className="block text-sm font-medium text-gray-700">401K</label>
              <input type="number" id="401k" name="401k" step="0.01" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <h3 className="text-lg font-medium text-gray-800">Other</h3>
            <div>
              <label htmlFor="other" className="block text-sm font-medium text-gray-700">Other Deductions</label>
              <input type="number" id="other" name="other" step="0.01" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="pt-2">
            <SubmitButton text="Add Payslip" />
          </div>
        </form>
      ) : (
        <form action={createBonus} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month</label>
              <select id="month" name="month" required defaultValue={(new Date().getMonth() + 1).toString().padStart(2, '0')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
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
            <div className="md:col-span-1">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
              <select id="year" name="year" required defaultValue={currentYear} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="bonus-amount" className="block text-sm font-medium text-gray-700">Bonus Amount</label>
            <input type="number" id="bonus-amount" name="bonus-amount" step="0.01" required placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="pt-2">
            <SubmitButton text="Add Bonus" />
          </div>
        </form>
      )}
    </div>
  );
}
