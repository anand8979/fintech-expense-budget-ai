import { useEffect, useState } from 'react';
import { budgetAPI, categoryAPI } from '../services/api';
import Layout from '../components/common/Layout';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, trackingRes, categoriesRes] = await Promise.all([
        budgetAPI.getAll({ isActive: 'true' }),
        budgetAPI.getTracking(),
        categoryAPI.getAll({ type: 'expense' }),
      ]);
      setBudgets(budgetsRes.data.data.budgets);
      setTracking(trackingRes.data.data.tracking);
      setCategories(categoriesRes.data.data.categories);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate category is selected
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const startDate = new Date(formData.startDate);
      let endDate = null;
      
      if (formData.period === 'monthly') {
        endDate = endOfMonth(startDate);
      } else {
        endDate = endOfYear(startDate);
      }

      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount),
        endDate: format(endDate, 'yyyy-MM-dd'),
      };

      if (editingBudget) {
        await budgetAPI.update(editingBudget._id, budgetData);
        toast.success('Budget updated successfully');
      } else {
        await budgetAPI.create(budgetData);
        toast.success('Budget created successfully');
      }
      setShowModal(false);
      setEditingBudget(null);
      resetForm();
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error saving budget';
      toast.error(errorMessage);
      console.error('Error saving budget:', error);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category._id,
      amount: budget.amount,
      period: budget.period,
      startDate: format(new Date(budget.startDate), 'yyyy-MM-dd'),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await budgetAPI.delete(id);
      toast.success('Budget deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      period: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingBudget(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600 mt-1">Plan and track your spending</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Create Budget
          </button>
        </div>

        {/* Budget Tracking Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracking.map((item) => (
            <div key={item.budget.id} className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{item.budget.category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.budget.category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.budget.period === 'monthly' ? 'Monthly' : 'Yearly'} Budget
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Spent</span>
                  <span className="font-semibold">
                    {formatCurrency(item.spent)} / {formatCurrency(item.budget.amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">{item.percentage.toFixed(1)}% used</span>
                  <span className={item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {item.remaining >= 0 ? '+' : ''}
                    {formatCurrency(item.remaining)} remaining
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const budgetToEdit = budgets.find(b => b._id === item.budget.id);
                    if (budgetToEdit) {
                      handleEdit(budgetToEdit);
                    }
                  }}
                  className="flex-1 text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.budget.id)}
                  className="flex-1 text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Budgets List */}
        {budgets.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No budgets created yet</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Create Your First Budget
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={categories.length === 0}
                  >
                    <option value="">
                      {categories.length === 0 ? 'No categories available' : 'Select a category'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Please create expense categories first
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700"
                  >
                    {editingBudget ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Budgets;
