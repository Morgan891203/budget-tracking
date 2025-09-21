import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Wallet, Receipt, LineChart } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 p-4">
        <Link href="/" className="block mb-6">
          <h2 className="text-xl font-bold text-gray-800 transition-colors hover:text-blue-700">Budget App</h2>
        </Link>
        <nav className="flex flex-col space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/salary" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <Wallet className="h-5 w-5" />
            <span>Salary</span>
          </Link>
          <Link href="/expense" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <Receipt className="h-5 w-5" />
            <span>Expenses</span>
          </Link>
          <Link href="/analysis" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <LineChart className="h-5 w-5" />
            <span>Analysis</span>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
