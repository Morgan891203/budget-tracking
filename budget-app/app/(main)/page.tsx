import {
  CreditCard,
  FileMinus,
  Heart,
  PiggyBank,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { deleteMomDebtTransaction } from '@/lib/actions';
import { Pagination } from './pagination';
import { DeleteButton } from '@/components/features/expense/delete-button';

type DashboardPageProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchParams?: any;
};

async function DashboardPage(props: DashboardPageProps) {
  const { searchParams = {} } = props;
  const ITEMS_PER_PAGE = 5;
  const summaryPageParam = searchParams.summaryPage;
  const summaryPage = parseInt(
    (Array.isArray(summaryPageParam) ? summaryPageParam[0] : summaryPageParam) ??
      '1',
    10,
  );
  const expensesPageParam = searchParams.expensesPage;
  const expensesPage = parseInt(
    (Array.isArray(expensesPageParam) ? expensesPageParam[0] : expensesPageParam) ??
      '1',
    10,
  );
  const deductionsPageParam = searchParams.deductionsPage;
  const deductionsPage = parseInt(
    (Array.isArray(deductionsPageParam) ? deductionsPageParam[0] : deductionsPageParam) ??
      '1',
    10,
  );

  const [salaries, allExpenses, momDebts] = await Promise.all([
    prisma.salary.findMany({ orderBy: { date: 'asc' } }),
    prisma.expense.findMany({ orderBy: { date: 'asc' } }),
    prisma.debt.findMany({
      where: { person: 'Mom' },
      orderBy: { date: 'desc' },
    }),
  ]);

  const overallMomDebtBalance = momDebts.reduce((acc, debt) => {
    if (debt.type === 'theyOwe') {
      return acc + debt.amount.toNumber();
    } else {
      return acc - debt.amount.toNumber();
    }
  }, 0);

  const deductionCategories = ['Taxes', 'Benefits', 'Retirement', 'Other'];
  const deductions = allExpenses.filter((exp) =>
    deductionCategories.includes(exp.category)
  );
  const otherExpenses = allExpenses.filter(
    (exp) => !deductionCategories.includes(exp.category) && exp.category !== 'Gasoline'
  );

  const monthlySummary: { [key: string]: { gross: number; deductions: number } } = {};
  salaries.forEach((salary) => {
    const monthKey = format(salary.date, 'yyyy-MM');
    if (!monthlySummary[monthKey]) {
      monthlySummary[monthKey] = { gross: 0, deductions: 0 };
    }
    monthlySummary[monthKey].gross += salary.amount.toNumber();
  });

  deductions.forEach((expense) => {
    const monthKey = format(expense.date, 'yyyy-MM');
    if (!monthlySummary[monthKey]) {
      monthlySummary[monthKey] = { gross: 0, deductions: 0 };
    }
    monthlySummary[monthKey].deductions += expense.amount.toNumber();
  });

  const monthlyExpenseSummary: { [key: string]: { total: number } } = {};
  otherExpenses.forEach((expense) => {
    const monthKey = format(expense.date, 'yyyy-MM');
    if (!monthlyExpenseSummary[monthKey]) {
      monthlyExpenseSummary[monthKey] = { total: 0 };
    }
    monthlyExpenseSummary[monthKey].total += expense.amount.toNumber();
  });

  const monthlyMomDebtSummary: { [key: string]: { balance: number } } = {};
  momDebts.forEach((debt) => {
    const monthKey = format(debt.date, 'yyyy-MM');
    if (!monthlyMomDebtSummary[monthKey]) {
      monthlyMomDebtSummary[monthKey] = { balance: 0 };
    }
    if (debt.type === 'theyOwe') {
      monthlyMomDebtSummary[monthKey].balance += debt.amount.toNumber();
    } else {
      monthlyMomDebtSummary[monthKey].balance -= debt.amount.toNumber();
    }
  });

  const monthlyDeductionDetails: { [key: string]: { total: number; breakdown: { [key: string]: number } } } = {};
  deductions.forEach((expense) => {
    const monthKey = format(expense.date, 'yyyy-MM');
    if (!monthlyDeductionDetails[monthKey]) {
      monthlyDeductionDetails[monthKey] = { total: 0, breakdown: {} };
    }
    const amount = expense.amount.toNumber();
    monthlyDeductionDetails[monthKey].total += amount;
    const category = expense.category;
    if (!monthlyDeductionDetails[monthKey].breakdown[category]) {
      monthlyDeductionDetails[monthKey].breakdown[category] = 0;
    }
    monthlyDeductionDetails[monthKey].breakdown[category] += amount;
  });

  const allMonthKeys = [
    ...new Set([
      ...Object.keys(monthlySummary),
      ...Object.keys(monthlyExpenseSummary),
      ...Object.keys(monthlyMomDebtSummary),
    ]),
  ];

  const summaryList = allMonthKeys
    .map((monthKey) => {
      const [year, month] = monthKey.split('-');
      const incomeData = monthlySummary[monthKey] || { gross: 0, deductions: 0 };
      const expenseData = monthlyExpenseSummary[monthKey] || { total: 0 };
      const momDebtData = monthlyMomDebtSummary[monthKey] || { balance: 0 };
      const netIncome = incomeData.gross - incomeData.deductions;
      const totalExpenses = expenseData.total - momDebtData.balance;
      return {
        date: new Date(parseInt(year), parseInt(month) - 1, 1),
        gross: incomeData.gross,
        deductions: incomeData.deductions,
        net: netIncome,
        totalExpenses: totalExpenses,
        netBalance: netIncome - totalExpenses,
        momDebtBalance: momDebtData.balance,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalNetBalance = summaryList.reduce(
    (acc, summary) => acc + summary.netBalance,
    0
  );

  const totalSummaryPages = Math.ceil(summaryList.length / ITEMS_PER_PAGE);
  const paginatedSummaryList = summaryList.slice(
    (summaryPage - 1) * ITEMS_PER_PAGE,
    summaryPage * ITEMS_PER_PAGE
  );

  const expenseSummaryList = allMonthKeys
    .map((monthKey) => {
      const [year, month] = monthKey.split('-');
      const expenseData = monthlyExpenseSummary[monthKey] || { total: 0 };
      const momDebtData = monthlyMomDebtSummary[monthKey] || { balance: 0 };
      // Total expenses = other expenses + (what I owe mom) - (what she owes me)
      const total = expenseData.total - momDebtData.balance;
      return {
        date: new Date(parseInt(year), parseInt(month) - 1, 1),
        total,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalExpenseSummaryPages = Math.ceil(expenseSummaryList.length / ITEMS_PER_PAGE);
  const paginatedExpenseSummaryList = expenseSummaryList.slice(
    (expensesPage - 1) * ITEMS_PER_PAGE,
    expensesPage * ITEMS_PER_PAGE
  );

  const deductionDetailsList = Object.entries(monthlyDeductionDetails)
    .map(([monthKey, summary]) => {
      const [year, month] = monthKey.split('-');
      return {
        date: new Date(parseInt(year), parseInt(month) - 1, 1),
        ...summary,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalDeductionPages = Math.ceil(deductionDetailsList.length / ITEMS_PER_PAGE);
  const paginatedDeductionDetailsList = deductionDetailsList.slice(
    (deductionsPage - 1) * ITEMS_PER_PAGE,
    deductionsPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center gap-4 p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <PiggyBank className="h-8 w-8 text-green-500" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Financial Summary
              </h2>
            </div>
            <div className="text-right">
              <p
                className={`font-semibold text-2xl ${
                  totalNetBalance >= 0 ? 'text-indigo-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(totalNetBalance)}
              </p>
              <p className="text-sm text-gray-500">Total Net Balance</p>
            </div>
          </div>
          <ul className="divide-y divide-gray-200">
            {paginatedSummaryList.length === 0 ? (
              <li className="p-6 text-center text-gray-500">
                No financial data found. Add a salary or an expense to get started.
              </li>
            ) : (
              paginatedSummaryList.map((summary) => (
                <li
                  key={summary.date.toISOString()}
                  className="p-6 flex justify-between items-center"
                >
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800 text-lg">
                      {format(summary.date, 'MMMM yyyy')}
                    </p>
                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Gross: <span className="font-medium text-gray-700">{formatCurrency(summary.gross)}</span></span>
                      <span>Deductions: <span className="font-medium text-gray-700">{formatCurrency(summary.deductions)}</span></span>
                      <span>Net Income: <span className="font-medium text-green-700">{formatCurrency(summary.net)}</span></span>
                      <span>Expenses: <span className="font-medium text-red-600">{formatCurrency(summary.totalExpenses)}</span></span>
                      <span>
                        Mom&apos;s Account (Monthly):{' '}
                        <span className={`font-medium ${summary.momDebtBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {formatCurrency(summary.momDebtBalance)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className={`font-semibold text-xl ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.netBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Net Balance</p>
                  </div>
                </li>
              ))
            )}
          </ul>
          <Pagination currentPage={summaryPage} totalPages={totalSummaryPages} paramName="summaryPage" searchParams={searchParams} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <Heart className="h-7 w-7 text-pink-500" />
              <h2 className="text-2xl font-semibold text-gray-800">Mom&apos;s Account</h2>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">Overall Balance</p>
              <p className={`text-3xl font-bold ${overallMomDebtBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(overallMomDebtBalance)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {overallMomDebtBalance > 0
                  ? 'She owes you'
                  : overallMomDebtBalance < 0
                  ? 'You owe her'
                  : 'Settled up'}
              </p>
            </div>
            <div className="border-t border-gray-200">
              <h3 className="p-4 text-lg font-semibold text-gray-700">
                Transaction History
              </h3>
              <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {momDebts.length === 0 ? (
                  <li className="p-4 text-center text-gray-500">
                    No transactions found.
                  </li>
                ) : (
                  momDebts.map((transaction) => (
                    <li
                      key={transaction.id}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{format(transaction.date, 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${transaction.type === 'iOwe' ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(transaction.amount)}
                        </p>
                        <form action={deleteMomDebtTransaction}>
                          <input type="hidden" name="id" value={transaction.id} />
                          <DeleteButton itemType="transaction" />
                        </form>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex items-center gap-4 p-6 border-b border-gray-200">
              <CreditCard className="h-8 w-8 text-red-500" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Total Expenses Summary
              </h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {paginatedExpenseSummaryList.length === 0 ? (
                <li className="p-6 text-center text-gray-500">
                  No expense data found. Add an expense to get started.
                </li>
              ) : (
                paginatedExpenseSummaryList.map((summary) => (
                  <li key={summary.date.toISOString()}>
                    <Link
                      href={`/expense?year=${format(
                        summary.date,
                        'yyyy',
                      )}&month=${format(summary.date, 'MM')}`}
                      className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-semibold text-gray-800 text-lg">
                        {format(summary.date, 'MMMM yyyy')}
                      </p>
                      <p className="font-semibold text-red-600 text-xl">
                        {formatCurrency(summary.total)}
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <Pagination
              currentPage={expensesPage}
              totalPages={totalExpenseSummaryPages}
              paramName="expensesPage"
              searchParams={searchParams}
            />
          </div>
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex items-center gap-4 p-6 border-b border-gray-200">
              <FileMinus className="h-8 w-8 text-orange-500" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Deductions Summary
              </h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {paginatedDeductionDetailsList.length === 0 ? (
                <li className="p-6 text-center text-gray-500">
                  No deduction data found.
                </li>
              ) : (
                paginatedDeductionDetailsList.map((summary) => (
                  <li key={summary.date.toISOString()}>
                    <Link
                      href={`/salary?year=${format(
                        summary.date,
                        'yyyy',
                      )}&month=${format(summary.date, 'MM')}`}
                      className="block p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-800 text-lg">
                          {format(summary.date, 'MMMM yyyy')}
                        </p>
                        <p className="font-semibold text-orange-600 text-xl">
                          {formatCurrency(summary.total)}
                        </p>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-gray-600">
                        {Object.entries(summary.breakdown).map(
                          ([category, amount]) => (
                            <li key={category} className="flex justify-between">
                              <span>{category}</span>
                              <span>{formatCurrency(amount)}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <Pagination
              currentPage={deductionsPage}
              totalPages={totalDeductionPages}
              paramName="deductionsPage"
              searchParams={searchParams}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;