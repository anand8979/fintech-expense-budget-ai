import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, transactionAPI } from '../services/api';
import Layout from '../components/common/Layout';
import { format } from 'date-fns';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, summaryRes] = await Promise.all([
        analyticsAPI.getOverview({ period: 'month' }),
        transactionAPI.getSummary({
          startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd'),
        }),
      ]);
      setOverview(overviewRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your financial overview.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(overview?.current.income || 0)}
                </p>
                {overview?.change.income !== undefined && (
                  <p className={`text-sm mt-1 ${getChangeColor(overview.change.income)}`}>
                    {overview.change.income > 0 ? '+' : ''}
                    {overview.change.income.toFixed(1)}% from last {overview.period}
                  </p>
                )}
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(overview?.current.expenses || 0)}
                </p>
                {overview?.change.expenses !== undefined && (
                  <p className={`text-sm mt-1 ${getChangeColor(overview.change.expenses)}`}>
                    {overview.change.expenses > 0 ? '+' : ''}
                    {overview.change.expenses.toFixed(1)}% from last {overview.period}
                  </p>
                )}
              </div>
              <div className="text-4xl">💸</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (overview?.current.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(overview?.current.balance || 0)}
                </p>
                {overview?.change.balance !== undefined && (
                  <p className={`text-sm mt-1 ${getChangeColor(overview.change.balance)}`}>
                    {overview.change.balance > 0 ? '+' : ''}
                    {overview.change.balance.toFixed(1)}% from last {overview.period}
                  </p>
                )}
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Income Transactions</span>
                <span className="font-semibold">{summary?.income.count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expense Transactions</span>
                <span className="font-semibold">{summary?.expenses.count || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/transactions"
                className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Transaction
              </Link>
              <Link
                to="/budgets"
                className="block w-full text-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Manage Budgets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
