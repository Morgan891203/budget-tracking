import { prisma } from '@/lib/db';
import { ExpenseForm } from '@/components/features/expense/expense-form';
import { deleteExpense, deleteMomDebtTransaction } from '@/lib/actions';
import { MomDebtForm } from '@/components/features/expense/mom-debt-form';
import { EditExpense } from '@/components/features/expense/edit-expense';
import { DeleteButton } from '@/components/features/expense/delete-button';
import { Prisma, type Expense } from '@prisma/client';
import { format } from 'date-fns';
import {
  Home,
  Heart,
  CreditCard,
  Fuel,
  Send,
  Car,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

// Helper function to format currency
function formatCurrency(amount: number | Prisma.Decimal) {
  const number = typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number);
}

const categoryIcons: Record<string, LucideIcon> = {
  Rent: Home,
  'Capital One': CreditCard,
  Bilt: CreditCard,
  Discover: CreditCard,
  "Mom&apos;s Account": Heart,
  Gasoline: Fuel,
  Venmo: Send,
  Car: Car,
  Default: Receipt,
};

type ExpensePageProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
  searchParams: { [key: string]: string | string[] | undefined };
};

async function ExpensePage(props: ExpensePageProps) {
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

  const [momDebtTransactions, expensesByCategory, allExpenses] = await Promise.all([
    prisma.debt.findMany({
      where: {
        person: 'Mom',
        date: { gte: startDate, lt: endDate },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: {
        date: { gte: startDate, lt: endDate },
        NOT: {
          category: { in: ['Taxes', 'Benefits', 'Retirement', 'Other', 'Gasoline'] },
        },
      },
      _sum: { amount: true },
      orderBy: { category: 'asc' },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        NOT: {
          category: { in: ['Taxes', 'Benefits', 'Retirement', 'Other', 'Gasoline'] },
        },
      },
      orderBy: [{ category: 'asc' }, { date: 'desc' }],
    }),
  ]);

  const { iOwe, theyOwe } = momDebtTransactions.reduce(
    (acc, t) => {
      // Assuming 'iOwe' and 'theyOwe' are types in the new schema
      if (t.type === 'iOwe') {
        acc.iOwe += t.amount.toNumber();
      } else if (t.type === 'theyOwe') {
        acc.theyOwe += t.amount.toNumber();
      }
      return acc;
    },
    { iOwe: 0, theyOwe: 0 },
  );

  const momBalance = theyOwe - iOwe;

  const grandTotal = expensesByCategory.reduce(
    (total, category) => total + (category._sum.amount?.toNumber() ?? 0),
    0,
  ) + (iOwe - theyOwe);

  const expensesByCategoryForDisplay = [...expensesByCategory];
  const momAccountNet = iOwe - theyOwe;
  if (momAccountNet !== 0) {
    expensesByCategoryForDisplay.push({
      category: "Mom&apos;s Account",
      _sum: { amount: new Prisma.Decimal(momAccountNet) },
    });
    expensesByCategoryForDisplay.sort((a, b) =>
      a.category.localeCompare(b.category),
    );
  }

  const plainExpenses = allExpenses.map((expense) => ({
    ...expense,
    amount: expense.amount.toNumber(),
  }));

  const plainMomDebtTransactions = momDebtTransactions.map((t) => ({
    ...t,
    amount: t.amount.toNumber(),
  }));

  const expensesGrouped = plainExpenses.reduce(
    (acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(expense);
      return acc;
    },
    {} as Record<string, typeof plainExpenses>,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-8">
        <ExpenseForm />
        <MomDebtForm selectedMonth={selectedMonth} selectedYear={selectedYear} />
      </div>
      <div className="md:col-span-2 space-y-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
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
            <button type="submit" className="h-10 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Filter
            </button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Heart className="h-7 w-7 text-pink-500" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Mom&apos;s Account - {format(startDate, 'MMMM yyyy')}
              </h2>
            </div>
            <div className="text-center pt-3">
              <p className="text-sm text-gray-500">Current Month Balance</p>
              <p
                className={`text-2xl font-bold ${
                  momBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(momBalance)}
              </p>
              <p className="text-xs text-gray-400">
                {momBalance >= 0 ? 'She owes me' : 'I owe her'}
              </p>
            </div>
          </div>
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {plainMomDebtTransactions.length === 0 ? (
              <li className="p-4 text-center text-gray-500">
                No transactions for this month.
              </li>
            ) : (
              plainMomDebtTransactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${transaction.type === 'iOwe' ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(transaction.amount)}</p>
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
        <div>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Expenses by Category - {format(startDate, 'MMMM yyyy')}
            </h2>
            <div className="text-right">
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(grandTotal)}
              </p>
              <p className="text-sm text-gray-500">Grand Total</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md">
            <ul className="divide-y divide-gray-200">
              {expensesByCategoryForDisplay.length === 0 ? (
                <li className="p-4 text-center text-gray-500">
                  No expenses found. Add one to get started!
                </li>
              ) : (
                expensesByCategoryForDisplay.map((group) => {
                  const Icon = categoryIcons[group.category] || categoryIcons.Default;
                  const amount = group._sum.amount?.toNumber() ?? 0;
                  return (
                    <li
                      key={group.category}
                      className="p-4 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-500" />
                        <p className="font-semibold text-gray-800">
                          {group.category}
                        </p>
                      </div>
                      <p
                        className={`font-semibold ${
                          amount >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(amount)}
                      </p>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Expense Details - {format(startDate, 'MMMM yyyy')}
          </h2>
          <div className="space-y-6">
            {Object.keys(expensesGrouped).length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
                No expenses found for this period.
              </div>
            ) : (
              Object.entries(expensesGrouped).map(([category, expenses]) => {
                const categoryTotal = expenses.reduce(
                  (sum, exp) => sum + exp.amount,
                  0,
                );
                return (
                  <div key={category} className="bg-white rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 p-4 border-b border-gray-200">
                      {category}
                    </h3>
                    <ul className="divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <li
                          key={expense.id}
                          className="p-4 flex justify-between items-center"
                        >
                          <div className="flex-grow pr-4">
                            <p className="font-semibold text-gray-800">
                              {expense.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <p className="font-semibold text-red-600 w-24 text-right">
                              {formatCurrency(expense.amount)}
                            </p>
                            <div className="flex items-center gap-2">
                              <EditExpense expense={expense} />
                              <form action={deleteExpense}>
                                <input type="hidden" name="id" value={expense.id} />
                                <DeleteButton itemType="expense" />
                              </form>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                      <div className="flex justify-between items-center font-semibold">
                        <p className="text-gray-800">Total</p>
                        <p className="text-red-600 text-lg">
                          {formatCurrency(categoryTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpensePage;
