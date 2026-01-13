import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import Layout from '../components/common/Layout';
import { formatCurrency } from '../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startDate = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

      const [overviewRes, categoryRes, trendsRes] = await Promise.all([
        analyticsAPI.getOverview({ period: 'month' }),
        analyticsAPI.getSpendingByCategory({ startDate, endDate }),
        analyticsAPI.getTrends({ type: 'expense', period: 'month', months: 6 }),
      ]);

      setOverview(overviewRes.data.data);
      setSpendingByCategory(categoryRes.data.data.spending || []);
      setTrends(trendsRes.data.data.trends || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const pieData = spendingByCategory.map((item) => ({
    name: item.category.name,
    value: Math.round(item.total * 100) / 100,
    icon: item.category.icon,
  }));

  const barData = overview
    ? [
        {
          name: 'Income',
          amount: overview.current.income,
        },
        {
          name: 'Expenses',
          amount: overview.current.expenses,
        },
        {
          name: 'Balance',
          amount: overview.current.balance,
        },
      ]
    : [];

  const lineData = trends.map((trend) => ({
    month: trend.period,
    amount: Math.round(trend.total * 100) / 100,
  }));

  // Colors for pie chart
  const COLORS = [
    '#ef4444',
    '#f59e0b',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#10b981',
    '#06b6d4',
    '#6366f1',
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-primary-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
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

  const hasData = spendingByCategory.length > 0 || trends.length > 0 || overview;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Financial insights and trends</p>
        </div>

        {!hasData ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No data available yet</p>
            <p className="text-sm text-gray-400">
              Start adding transactions to see your financial analytics
            </p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(overview.current.income)}
                  </p>
                  {overview.change.income !== 0 && (
                    <p
                      className={`text-sm mt-1 ${
                        overview.change.income > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {overview.change.income > 0 ? '+' : ''}
                      {overview.change.income.toFixed(1)}% from last month
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(overview.current.expenses)}
                  </p>
                  {overview.change.expenses !== 0 && (
                    <p
                      className={`text-sm mt-1 ${
                        overview.change.expenses > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {overview.change.expenses > 0 ? '+' : ''}
                      {overview.change.expenses.toFixed(1)}% from last month
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Balance</p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      overview.current.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(overview.current.balance)}
                  </p>
                  {overview.change.balance !== 0 && (
                    <p
                      className={`text-sm mt-1 ${
                        overview.change.balance > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {overview.change.balance > 0 ? '+' : ''}
                      {overview.change.balance.toFixed(1)}% from last month
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Spending by Category */}
              {spendingByCategory.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Spending by Category
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar Chart - Income vs Expenses */}
              {barData.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Income vs Expenses
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="amount"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Line Chart - Spending Trend */}
              {trends.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Spending Trend (Last 6 Months)
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category Breakdown Table */}
            {spendingByCategory.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Category Breakdown
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Transactions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {spendingByCategory.map((item) => (
                        <tr key={item.category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="mr-2">{item.category.icon}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {item.category.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
