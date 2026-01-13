import { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import { adminAPI, categoryAPI } from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  // Overview data
  const [overview, setOverview] = useState(null);
  // Users data
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [usersSearch, setUsersSearch] = useState('');
  // Transactions data
  const [transactions, setTransactions] = useState([]);
  const [transactionsPagination, setTransactionsPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [transactionFilters, setTransactionFilters] = useState({ userId: '', type: '', startDate: '', endDate: '' });
  // Budgets data
  const [budgets, setBudgets] = useState([]);
  const [budgetsPagination, setBudgetsPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [budgetFilters, setBudgetFilters] = useState({ userId: '', period: '', isActive: '' });
  // Categories
  const [categories, setCategories] = useState([]);
  // Per-user analytics
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserAnalytics, setSelectedUserAnalytics] = useState(null);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchOverview(), fetchCategories(), fetchUsers(), fetchTransactions(), fetchBudgets()]);
      setLoading(false);
    };
    init();
  }, []);

  // React to filters/pagination
  useEffect(() => {
    fetchUsers();
  }, [usersSearch, usersPagination.page]);

  useEffect(() => {
    fetchTransactions();
  }, [transactionFilters, transactionsPagination.page]);

  useEffect(() => {
    fetchBudgets();
  }, [budgetFilters, budgetsPagination.page]);

  const fetchOverview = async () => {
    try {
      const [analyticsRes, categoriesRes] = await Promise.all([
        adminAPI.getGlobalAnalytics({ period: 'month' }),
        categoryAPI.getAll(),
      ]);
      setOverview(analyticsRes.data.data);
      setCategories(categoriesRes.data.data.categories || []);
    } catch (error) {
      console.error('Error fetching overview:', error);
      toast.error('Failed to load overview data');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = {
        page: usersPagination.page,
        limit: 20,
      };
      if (usersSearch) params.search = usersSearch;
      
      const response = await adminAPI.getAllUsers(params);
      setUsers(response.data.data.users);
      setUsersPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = {
        page: transactionsPagination.page,
        limit: 50,
      };
      if (transactionFilters.userId) params.userId = transactionFilters.userId;
      if (transactionFilters.type) params.type = transactionFilters.type;
      if (transactionFilters.startDate) params.startDate = transactionFilters.startDate;
      if (transactionFilters.endDate) params.endDate = transactionFilters.endDate;
      
      const response = await adminAPI.getAllTransactions(params);
      setTransactions(response.data.data.transactions);
      setTransactionsPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const fetchBudgets = async () => {
    try {
      const params = {
        page: budgetsPagination.page,
        limit: 50,
      };
      if (budgetFilters.userId) params.userId = budgetFilters.userId;
      if (budgetFilters.period) params.period = budgetFilters.period;
      if (budgetFilters.isActive !== '') params.isActive = budgetFilters.isActive;
      
      const response = await adminAPI.getAllBudgets(params);
      setBudgets(response.data.data.budgets);
      setBudgetsPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will delete all their transactions and budgets.')) {
      return;
    }
    
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fetchUserAnalytics = async (userId) => {
    if (!userId) {
      setSelectedUserAnalytics(null);
      return;
    }
    try {
      const response = await adminAPI.getUserAnalytics(userId, { period: 'month' });
      setSelectedUserAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      toast.error('Failed to load user analytics');
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

  return (
    <Layout>
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            One place for all users’ finance data: overview, users, transactions, budgets, analytics, and categories.
          </p>
        </div>

        {/* Overview / Global health */}
        {overview && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(overview.current.income)}
                    </p>
                    <p className={`text-sm mt-1 ${overview.change.income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {overview.change.income >= 0 ? '+' : ''}
                      {overview.change.income.toFixed(1)}% from last month
                    </p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(overview.current.expenses)}
                    </p>
                    <p className={`text-sm mt-1 ${overview.change.expenses >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {overview.change.expenses >= 0 ? '+' : ''}
                      {overview.change.expenses.toFixed(1)}% from last month
                    </p>
                  </div>
                  <div className="text-4xl">💸</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {overview.users.total}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {overview.users.active} active this month
                    </p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Net Balance</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      overview.current.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(overview.current.balance)}
                    </p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            {overview.topCategories && overview.topCategories.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h2>
                <div className="space-y-3">
                  {overview.topCategories.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{item.category.icon}</span>
                        <div>
                          <p className="font-medium">{item.category.name}</p>
                          <p className="text-sm text-gray-500">{item.count} transactions</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPagination({ ...usersPagination, page: 1 });
                }}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={fetchUsers}
                className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Refresh
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedUserId(val);
                  fetchUserAnalytics(val);
                }}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a user for analytics</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.email} ({u.firstName || ''} {u.lastName || ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {usersPagination.pages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setUsersPagination({ ...usersPagination, page: usersPagination.page - 1 })}
                disabled={usersPagination.page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {usersPagination.page} of {usersPagination.pages}
              </span>
              <button
                onClick={() => setUsersPagination({ ...usersPagination, page: usersPagination.page + 1 })}
                disabled={usersPagination.page === usersPagination.pages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Per-user analytics (driven by selected user) */}
        {selectedUserAnalytics && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Analytics for {selectedUserAnalytics.user.email}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedUserAnalytics.user.firstName} {selectedUserAnalytics.user.lastName}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-gray-50">
                <p className="text-sm text-gray-600">Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedUserAnalytics.overview.current.income)}
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-gray-50">
                <p className="text-sm text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(selectedUserAnalytics.overview.current.expenses)}
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-gray-50">
                <p className="text-sm text-gray-600">Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    selectedUserAnalytics.overview.current.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(selectedUserAnalytics.overview.current.balance)}
                </p>
              </div>
            </div>
            {selectedUserAnalytics.spendingByCategory?.length ? (
              <div className="space-y-2">
                <h3 className="text-md font-semibold text-gray-800">Top Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedUserAnalytics.spendingByCategory.slice(0, 6).map((item) => (
                    <div key={item.category.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{item.category.icon}</span>
                        <div>
                          <p className="font-medium">{item.category.name}</p>
                          <p className="text-xs text-gray-500">{item.count} txns</p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Transactions Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="User ID (optional)"
              value={transactionFilters.userId}
              onChange={(e) => {
                setTransactionFilters({ ...transactionFilters, userId: e.target.value });
                setTransactionsPagination({ ...transactionsPagination, page: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={transactionFilters.type}
              onChange={(e) => {
                setTransactionFilters({ ...transactionFilters, type: e.target.value });
                setTransactionsPagination({ ...transactionsPagination, page: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              type="date"
              value={transactionFilters.startDate}
              onChange={(e) => {
                setTransactionFilters({ ...transactionFilters, startDate: e.target.value });
                setTransactionsPagination({ ...transactionsPagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={transactionFilters.endDate}
              onChange={(e) => {
                setTransactionFilters({ ...transactionFilters, endDate: e.target.value });
                setTransactionsPagination({ ...transactionsPagination, page: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="End Date"
            />
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.userId?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{transaction.category?.icon}</span>
                        <span className="text-sm">{transaction.category?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactionsPagination.pages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() =>
                  setTransactionsPagination({ ...transactionsPagination, page: transactionsPagination.page - 1 })
                }
                disabled={transactionsPagination.page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {transactionsPagination.page} of {transactionsPagination.pages}
              </span>
              <button
                onClick={() =>
                  setTransactionsPagination({ ...transactionsPagination, page: transactionsPagination.page + 1 })
                }
                disabled={transactionsPagination.page === transactionsPagination.pages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Budgets Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="User ID (optional)"
              value={budgetFilters.userId}
              onChange={(e) => {
                setBudgetFilters({ ...budgetFilters, userId: e.target.value });
                setBudgetsPagination({ ...budgetsPagination, page: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={budgetFilters.period}
              onChange={(e) => {
                setBudgetFilters({ ...budgetFilters, period: e.target.value });
                setBudgetsPagination({ ...budgetsPagination, page: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Periods</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select
              value={budgetFilters.isActive}
              onChange={(e) => {
                setBudgetFilters({ ...budgetFilters, isActive: e.target.value });
                setBudgetsPagination({ ...budgetsPagination, page: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((budget) => (
                  <tr key={budget._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {budget.userId?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{budget.category?.icon}</span>
                        <span className="text-sm">{budget.category?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(budget.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {budget.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          budget.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {budget.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(budget.startDate)} - {budget.endDate ? formatDate(budget.endDate) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {budgetsPagination.pages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setBudgetsPagination({ ...budgetsPagination, page: budgetsPagination.page - 1 })}
                disabled={budgetsPagination.page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {budgetsPagination.page} of {budgetsPagination.pages}
              </span>
              <button
                onClick={() => setBudgetsPagination({ ...budgetsPagination, page: budgetsPagination.page + 1 })}
                disabled={budgetsPagination.page === budgetsPagination.pages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Management</h2>
          <p className="text-sm text-gray-600 mb-4">
            Manage global categories available to all users. Total: {categories.length} categories
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category._id}
                className="p-4 border rounded-lg flex items-center space-x-3 hover:bg-gray-50"
              >
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.type}</p>
                  {category.isDefault && <p className="text-xs text-blue-600">Default</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
