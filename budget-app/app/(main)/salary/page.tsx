import { format } from 'date-fns';
import { prisma } from '@/lib/db';
import { SalaryForm } from '@/components/features/salary/salary-form';
import PayslipList from '@/components/features/salary/payslip-list';

type SalaryPageProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
  searchParams: { [key: string]: string | string[] | undefined };
};

async function SalaryPage(props: SalaryPageProps) {
  const { searchParams } = props;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const yearParam = searchParams.year;
  const selectedYear =
    (Array.isArray(yearParam) ? yearParam[0] : yearParam) ??
    currentYear.toString();
  const monthParam = searchParams.month;
  const selectedMonth =
    (Array.isArray(monthParam) ? monthParam[0] : monthParam) ??
    (new Date().getMonth() + 1).toString().padStart(2, '0');

  const year = parseInt(selectedYear, 10);
  const month = parseInt(selectedMonth, 10);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const [salaries, expenses] = await Promise.all([
    prisma.salary.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      orderBy: { date: 'desc' },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        category: { in: ['Taxes', 'Benefits', 'Retirement', 'Other'] },
      },
      orderBy: { date: 'desc' },
    }),
  ]);

  const expensesByDate = expenses.reduce((acc, expense) => {
    const dateKey = expense.date.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(expense);
    return acc;
  }, {} as Record<string, typeof expenses>);

  const payslips = salaries.map((salary) => {
    const dateKey = salary.date.toISOString().split('T')[0];
    const deductions = expensesByDate[dateKey] || [];
    const totalDeductions = deductions.reduce((sum, exp) => sum + exp.amount.toNumber(), 0);
    const netPay = salary.amount.toNumber() - totalDeductions;

    return {
      ...salary,
      amount: salary.amount.toNumber(),
      deductions: deductions.map((d) => ({ ...d, amount: d.amount.toNumber() })),
      totalDeductions,
      net: netPay,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <SalaryForm />
      </div>
      <div className="md:col-span-2 space-y-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <form method="get" className="flex items-end gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month</label>
              <select id="month" name="month" required defaultValue={selectedMonth} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
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
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
              <select id="year" name="year" required defaultValue={selectedYear} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-10 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Filter
            </button>
          </form>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Payslips - {format(startDate, 'MMMM yyyy')}
          </h2>
          <PayslipList payslips={payslips} />
        </div>
      </div>
    </div>
  );
}

export default SalaryPage;