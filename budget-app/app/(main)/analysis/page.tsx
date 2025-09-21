import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { TrendsChart } from '@/components/features/analysis/trends-chart';
import { ExpenseCategoryChart } from '@/components/features/analysis/expense-category-chart';

type AnalysisPageProps = {
  params: Record<string, never>;
  searchParams: { month?: string; year?: string };
};

export default async function AnalysisPage({ params, searchParams }: AnalysisPageProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const selectedYear = searchParams.year ?? currentYear.toString();
  const selectedMonth =
    searchParams.month ?? (new Date().getMonth() + 1).toString().padStart(2, '0');

  const year = parseInt(selectedYear, 10);
  const month = parseInt(selectedMonth, 10);

  // Date ranges for queries
  const yearStartDate = new Date(year, 0, 1);
  const nextYearStartDate = new Date(year + 1, 0, 1);
  const monthStartDate = new Date(year, month - 1, 1);
  const nextMonthStartDate = new Date(year, month, 1);

  const deductionCategories = ['Taxes', 'Benefits', 'Retirement', 'Other'];

  // --- Run all data queries in parallel for better performance ---
  const [
    yearlySalaries,
    yearlyExpenses,
    yearlyMomDebts,
    monthlyExpenses,
    monthlyMomDebts,
  ] = await Promise.all([
    prisma.salary.findMany({
      where: { date: { gte: yearStartDate, lt: nextYearStartDate } },
      orderBy: { date: 'asc' },
    }),
    prisma.expense.findMany({
      where: { date: { gte: yearStartDate, lt: nextYearStartDate } },
      orderBy: { date: 'asc' },
    }),
    prisma.debt.findMany({
      where: {
        person: 'Mom',
        date: { gte: yearStartDate, lt: nextYearStartDate },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: monthStartDate, lt: nextMonthStartDate },
        NOT: { category: { in: [...deductionCategories, 'Gasoline'] } },
      },
    }),
    prisma.debt.findMany({
      where: {
        person: 'Mom',
        date: { gte: monthStartDate, lt: nextMonthStartDate },
      },
    }),
  ]);

  const yearlyDeductions = yearlyExpenses.filter((exp) =>
    deductionCategories.includes(exp.category)
  );
  const yearlyOtherExpenses = yearlyExpenses.filter(
    (exp) => !deductionCategories.includes(exp.category) && exp.category !== 'Gasoline'
  );

  const monthlySummary: Record<
    string,
    { gross: number; deductions: number; expenses: number }
  > = {};

  // Initialize all 12 months for the selected year
  for (let i = 0; i < 12; i++) {
    const monthKey = format(new Date(year, i, 1), 'yyyy-MM');
    monthlySummary[monthKey] = { gross: 0, deductions: 0, expenses: 0 };
  }

  const allYearlyData = [
    ...yearlySalaries.map((item) => ({ type: 'gross' as const, date: item.date, value: item.amount.toNumber() })),
    ...yearlyDeductions.map((item) => ({ type: 'deductions' as const, date: item.date, value: item.amount.toNumber() })),
    ...yearlyOtherExpenses.map((item) => ({ type: 'expenses' as const, date: item.date, value: item.amount.toNumber() })),
    ...yearlyMomDebts.map((item) => ({
      type: 'expenses' as const,
      date: item.date,
      value: item.type === 'iOwe' ? item.amount.toNumber() : -item.amount.toNumber(),
    })),
  ];

  for (const dataPoint of allYearlyData) {
    const monthKey = format(dataPoint.date, 'yyyy-MM');
    if (monthlySummary[monthKey]) {
      monthlySummary[monthKey][dataPoint.type] += dataPoint.value;
    }
  }

  const trendsChartData = Object.entries(monthlySummary)
    .map(([monthKey, summary]) => {
      const netIncome = summary.gross - summary.deductions;
      const netBalance = netIncome - summary.expenses;
      return {
        // Use a consistent date for formatting to avoid timezone issues
        date: new Date(monthKey + '-02'),
        'Net Income': netIncome,
        Expenses: summary.expenses,
        'Net Balance': netBalance,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime()) // sort ascending for chart
    .map((item) => ({
      name: format(item.date, 'MMM'),
      'Net Income': item['Net Income'],
      Expenses: item.Expenses,
      'Net Balance': item['Net Balance'],
    }));

  const momAccountNet = monthlyMomDebts.reduce((acc, debt) => {
    const amount = debt.amount.toNumber();
    return acc + (debt.type === 'iOwe' ? amount : -amount);
  }, 0);

  const expenseByCategory: Record<string, number> = {};
  monthlyExpenses.forEach((expense) => {
    if (!expenseByCategory[expense.category]) {
      expenseByCategory[expense.category] = 0;
    }
    expenseByCategory[expense.category] += expense.amount.toNumber();
  });

  // Only add Mom's account to expenses if it's a net expense for the month
  if (momAccountNet > 0) {
    expenseByCategory["Mom's Account"] =
      (expenseByCategory["Mom's Account"] || 0) + momAccountNet;
  }

  const expenseChartData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analysis</h1>
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <form method="get" className="flex items-end gap-4">
          <div>
            <label
              htmlFor="month"
              className="block text-sm font-medium text-gray-700"
            >
              Month
            </label>
            <select
              id="month"
              name="month"
              required
              defaultValue={selectedMonth}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
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
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700"
            >
              Year
            </label>
            <select
              id="year"
              name="year"
              required
              defaultValue={selectedYear}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-10 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Filter
          </button>
        </form>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Monthly Trends ({selectedYear})
          </h2>
          <TrendsChart data={trendsChartData} />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Expenses by Category ({format(monthStartDate, 'MMMM yyyy')})
          </h2>
          <ExpenseCategoryChart data={expenseChartData} />
        </div>
      </div>
    </div>
  );
}
