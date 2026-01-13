import { useEffect, useState } from 'react';
import { aiAPI } from '../services/api';
import Layout from '../components/common/Layout';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const AIChat = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.getInsights({ period: 'month' });
      if (response.data.success && response.data.data.insights) {
        setInsights(response.data.data.insights);
      } else {
        setInsights([]);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Add user message to chat
    const newMessages = [
      ...chatMessages,
      { role: 'user', content: userMessage },
    ];
    setChatMessages(newMessages);

    try {
      const response = await aiAPI.chat({ message: userMessage });
      const aiResponse = response.data.data;

      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: aiResponse.response,
          type: aiResponse.type,
          suggestions: aiResponse.suggestions || [],
        },
      ]);
    } catch (error) {
      toast.error('Error getting response. Please try again.');
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm having trouble processing your request. Please try again.",
          type: 'error',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Financial Assistant</h1>
          <p className="text-gray-600 mt-1">Get intelligent insights and advice</p>
        </div>

        {/* Financial Insights */}
        {insights.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Financial Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">{getInsightIcon(insight.type)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-700">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Chat with AI Assistant</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ask questions about your finances, budgets, or spending patterns
            </p>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-2">Start a conversation with your AI assistant</p>
                <p className="text-sm">Try asking:</p>
                <ul className="mt-2 text-sm space-y-1">
                  <li>• "How are my budgets doing?"</li>
                  <li>• "What should I save?"</li>
                  <li>• "Where am I spending the most?"</li>
                  <li>• "How can I reduce expenses?"</li>
                </ul>
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : `${getMessageColor(message.type)} text-gray-900`
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <p className="text-xs font-semibold mb-2 text-gray-600">Try asking:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setInputMessage(suggestion);
                                // Auto-scroll to bottom after setting message
                                setTimeout(() => {
                                  const chatContainer = document.querySelector('.overflow-y-auto');
                                  if (chatContainer) {
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                  }
                                }, 100);
                              }}
                              className="text-xs px-3 py-1.5 bg-white rounded-full border border-gray-300 hover:bg-gray-50 hover:border-primary-400 transition-colors cursor-pointer"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-6 border-t">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about your finances..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AIChat;
