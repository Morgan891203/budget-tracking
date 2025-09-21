'use server';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createExpense(formData: FormData) {
  const expenseCategories = [
    'Rent',
    'Capital One',
    'Discover',
    'Gasoline',
    'Venmo',
    'Car',
  ];
  const monthString = formData.get('month') as string;
  const yearString = formData.get('year') as string;
  if (!monthString || !yearString) {
    // Handle error: month and year are required
    return;
  }
  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);
  const date = new Date(year, month - 1, 2);

  const expensesToCreate: Prisma.ExpenseCreateManyInput[] = [];

  for (const category of expenseCategories) {
    const amountValue = formData.get(category);
    if (amountValue) {
      const amount = parseFloat(amountValue as string);
      if (amount > 0) {
        expensesToCreate.push({
          amount,
          category,
          description: category,
          date: date,
        });
      }
    }
  }

  // Handle Bilt category items
  const biltItemCount = parseInt(
    (formData.get('bilt-item-count') as string) ?? '0',
    10
  );
  for (let i = 0; i < biltItemCount; i++) {
    let description = formData.get(`bilt-item-${i}`) as string;
    const price = parseFloat(formData.get(`bilt-price-${i}`) as string);

    if (description === 'Others') {
      description = formData.get(`bilt-other-detail-${i}`) as string;
    }

    if (description && price > 0) {
      expensesToCreate.push({
        amount: price,
        category: 'Bilt',
        description: description,
        date: date,
      });
    }
  }

  // Save the validated data to the database
  if (expensesToCreate.length > 0) {
    await prisma.expense.createMany({
      data: expensesToCreate,
    });
  }

  // Revalidate the cache for the expense page to show the new entry
  revalidatePath('/expense');
  // Redirect the user back to the expense page
  redirect('/expense');
}

export async function deleteExpense(formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    // Or handle with an error message
    return;
  }

  await prisma.expense.delete({
    where: { id },
  });

  revalidatePath('/expense');
}

export async function createBonus(formData: FormData) {
  const monthString = formData.get('month') as string;
  const yearString = formData.get('year') as string;
  const bonusAmountValue = formData.get('bonus-amount') as string;

  if (!monthString || !yearString || !bonusAmountValue) {
    // In a real app, you'd want to return an error message.
    return;
  }

  const amount = parseFloat(bonusAmountValue);
  if (isNaN(amount) || amount <= 0) {
    return;
  }

  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);

  // Use the 28th for bonuses to avoid date conflicts with payslips
  const date = new Date(year, month - 1, 28);

  await prisma.salary.create({
    data: {
      amount,
      source: 'Bonus',
      date,
    },
  });

  revalidatePath('/salary');
  redirect('/salary');
}

export async function createPayslip(formData: FormData) {
  const monthString = formData.get('month') as string;
  const yearString = formData.get('year') as string;
  const grossPayValue = formData.get('gross-pay') as string;

  if (!monthString || !yearString || !grossPayValue) {
    // In a real app, you'd want to return an error message.
    return;
  }

  const grossPay = parseFloat(grossPayValue);
  if (isNaN(grossPay) || grossPay <= 0) {
    return;
  }

  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const existingPayslipsCount = await prisma.salary.count({
    where: {
      source: 'Payslip',
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  // Use a unique day for each payslip in the same month to avoid conflicts
  const day = 15 + existingPayslipsCount;
  const date = new Date(year, month - 1, day);

  const expenseFields = [
    { name: 'federal-tax', description: 'Federal Income Tax', category: 'Taxes' },
    { name: 'social-security-tax', description: 'Social Security Tax', category: 'Taxes' },
    { name: 'medicare-tax', description: 'Medicare Tax', category: 'Taxes' },
    { name: 'ca-state-tax', description: 'CA State Income Tax', category: 'Taxes' },
    { name: 'ca-sdi-tax', description: 'CA SDI Tax', category: 'Taxes' },
    { name: 'medical-pre-tax', description: 'Medical Pre Tax', category: 'Benefits' },
    { name: '401k', description: '401K', category: 'Retirement' },
    { name: 'other', description: 'Other', category: 'Other' },
  ];

  const expensesToCreate: Prisma.ExpenseCreateManyInput[] = [];
  for (const field of expenseFields) {
    const amountValue = formData.get(field.name) as string;
    if (amountValue) {
      const amount = parseFloat(amountValue);
      if (amount > 0) {
        expensesToCreate.push({
          amount,
          category: field.category,
          description: field.description,
          date,
        });
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.salary.create({
        data: {
          amount: grossPay,
          source: 'Payslip',
          date,
        },
      });

      if (expensesToCreate.length > 0) {
        await tx.expense.createMany({
          data: expensesToCreate,
        });
      }
    });
  } catch (error) {
    console.error('Failed to create payslip:', error);
    // Handle transaction error, maybe return a message
    return;
  }

  revalidatePath('/salary');
  revalidatePath('/expense');
  redirect('/salary');
}

export async function updatePayslip(formData: FormData) {
  const id = formData.get('id') as string;
  const monthString = formData.get('month') as string;
  const yearString = formData.get('year') as string;
  const grossPayValue = formData.get('gross-pay') as string;

  if (!id || !monthString || !yearString || !grossPayValue) {
    return; // Or return an error
  }

  const grossPay = parseFloat(grossPayValue);
  if (isNaN(grossPay) || grossPay <= 0) {
    return;
  }

  const originalSalary = await prisma.salary.findUnique({ where: { id } });
  if (!originalSalary) {
    return; // Salary not found
  }

  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);
  // We need to preserve the unique day to avoid conflicts if the month/year doesn't change
  const day = originalSalary.date.getDate();
  const newDate = new Date(year, month - 1, day);

  const expenseFields = [
    { name: 'federal-tax', description: 'Federal Income Tax', category: 'Taxes' },
    { name: 'social-security-tax', description: 'Social Security Tax', category: 'Taxes' },
    { name: 'medicare-tax', description: 'Medicare Tax', category: 'Taxes' },
    { name: 'ca-state-tax', description: 'CA State Income Tax', category: 'Taxes' },
    { name: 'ca-sdi-tax', description: 'CA SDI Tax', category: 'Taxes' },
    { name: 'medical-pre-tax', description: 'Medical Pre Tax', category: 'Benefits' },
    { name: '401k', description: '401K', category: 'Retirement' },
    { name: 'other', description: 'Other', category: 'Other' },
  ];

  const newExpensesToCreate: Prisma.ExpenseCreateManyInput[] = [];
  for (const field of expenseFields) {
    const amountValue = formData.get(field.name) as string;
    if (amountValue) {
      const amount = parseFloat(amountValue);
      if (amount > 0) {
        newExpensesToCreate.push({
          amount,
          category: field.category,
          description: field.description,
          date: newDate,
        });
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete old deductions
      await tx.expense.deleteMany({
        where: {
          date: originalSalary.date,
          category: { in: ['Taxes', 'Benefits', 'Retirement', 'Other'] },
        },
      });

      // 2. Update salary record
      await tx.salary.update({
        where: { id },
        data: { amount: grossPay, date: newDate },
      });

      // 3. Create new deductions
      if (newExpensesToCreate.length > 0) {
        await tx.expense.createMany({ data: newExpensesToCreate });
      }
    });
  } catch (error) {
    console.error('Failed to update payslip:', error);
    return;
  }

  revalidatePath('/salary');
  revalidatePath('/expense');
}

export async function updateExpense(formData: FormData) {
  const id = formData.get('id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const dateString = formData.get('date') as string;

  if (!id || isNaN(amount) || !dateString || !description) {
    // In a real app, you'd want to return an error message.
    return;
  }

  // The date from the form is in 'yyyy-MM-dd' format.
  // To avoid timezone issues, we construct the date from its parts.
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  await prisma.expense.update({
    where: { id },
    data: {
      amount,
      description,
      date,
    },
  });

  revalidatePath('/expense');
}

export async function deleteSalaryEntry(formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return;
  }

  const salary = await prisma.salary.findUnique({
    where: { id },
  });

  if (!salary) {
    // In a real app, you'd want to return an error message.
    return;
  }

  if (salary.source === 'Payslip') {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete associated expenses for a payslip
        await tx.expense.deleteMany({
          where: {
            date: salary.date,
            category: { in: ['Taxes', 'Benefits', 'Retirement', 'Other'] },
          },
        });

        // Delete the salary record
        await tx.salary.delete({ where: { id } });
      });
    } catch (error) {
      console.error('Failed to delete payslip:', error);
      return;
    }
  } else {
    // For Bonus or other types, just delete the salary record.
    await prisma.salary.delete({ where: { id } });
  }

  revalidatePath('/salary');
  revalidatePath('/expense');
}

export async function createMomDebtTransaction(
  prevState: { message: string | null },
  formData: FormData,
) {
  const description = formData.get('description') as string;
  const amountValue = formData.get('amount') as string;
  const type = formData.get('type') as 'iOwe' | 'theyOwe';
  const monthString = formData.get('month') as string;
  const yearString = formData.get('year') as string;

  if (!description || !amountValue || !type || !monthString || !yearString) {
    return { message: 'Missing required fields.' };
  }

  const amount = parseFloat(amountValue);
  if (isNaN(amount) || amount <= 0) {
    return { message: 'Invalid amount.' };
  }

  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);
  // Let's use the 1st of the month for these transactions.
  const date = new Date(year, month - 1, 1);

  try {
    await prisma.debt.create({
      data: {
        person: 'Mom',
        description,
        amount,
        type,
        date,
      },
    });
  } catch (error) {
    console.error('Failed to create debt transaction:', error);
    return { message: 'Database error: Failed to create transaction.' };
  }

  revalidatePath('/expense');
  redirect(`/expense?month=${monthString}&year=${yearString}`);
}

export async function deleteMomDebtTransaction(formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return;
  }

  await prisma.debt.delete({
    where: { id },
  });

  revalidatePath('/expense');
}
