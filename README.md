# FinTech Expense & Budget Management SaaS

A production-grade MERN-based financial management platform with an Intelligent Financial Insights Engine for expense tracking, budget planning, and financial insights. **All intelligence features use free, local processing - no paid APIs required!**

## 🚀 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Expense & Income Tracking**: Comprehensive transaction management with categories
- **Category Management**: Default categories auto-created on signup (Food, Rent, Transport, Shopping, Bills, Entertainment, Health, Education for expenses; Salary, Freelance, Business, Investment, Other for income)
- **Budget Planning**: Monthly and yearly budget creation and tracking with duplicate prevention
- **Financial Analytics**: Advanced dashboards with real-time charts (Pie, Bar, Line charts) showing spending trends and comparisons
- **Export Functionality**: PDF and CSV report generation
- **Secure REST APIs**: Production-ready API with validation and security

### Intelligent Financial Insights (Free, Local Processing)
- **Smart Categorization**: Keyword-based expense categorization with confidence scoring
- **Financial Insights**: Statistical analysis and rule-based insights generation with actionable recommendations
- **Budget Optimization**: Pattern-based budget suggestions using historical data
- **Spending Prediction**: Moving averages and trend analysis for future spending
- **AI Chat Assistant**: Interactive rule-based financial advice engine with real-time insights
- **Overspending Detection**: Automatic detection of budget exceedances and unusual spending spikes
- **Savings Tips**: Personalized suggestions based on user spending patterns

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Custom Intelligence Engine (rule-based, statistical analysis, keyword matching)
- PDF/CSV Export

### Frontend
- React.js with Vite
- React Router
- Recharts for visualizations
- Tailwind CSS
- Axios for API calls

## 📁 Project Structure

```
fintech-expense-budget-ai/
├── backend/
│   ├── config/          # Database, JWT configs
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (intelligence, analytics, export)
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.jsx      # Main app component
│   └── package.json
└── ARCHITECTURE.md      # Detailed architecture documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- **No external API keys required!** All intelligence features are free and local.

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fintech-expense-budget
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=http://localhost:3000

# Note: No OpenAI or external paid API keys required!
# All intelligence features use free, local processing.
```

4. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get transaction summary

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/tracking` - Get budget tracking data

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/spending-by-category` - Spending by category
- `GET /api/analytics/trends` - Spending/income trends
- `GET /api/analytics/comparison` - Period comparison

### Intelligence Features (Free, Local Processing)
- `POST /api/ai/categorize` - Smart expense categorization using keyword matching
- `GET /api/ai/insights` - Generate financial insights using statistical analysis
- `GET /api/ai/budget-suggestions` - Budget optimization suggestions based on patterns
- `GET /api/ai/predict-spending` - Spending prediction using moving averages
- `POST /api/ai/chat` - Rule-based financial advice engine

### Export
- `GET /api/export/pdf` - Generate PDF report
- `GET /api/export/csv` - Generate CSV export

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Input validation on all endpoints
- Rate limiting (especially on auth and AI endpoints)
- CORS configuration
- Helmet security headers
- Data isolation (all queries filtered by userId)

## 🎯 Implementation Phases

### ✅ Phase 1: Core Foundation
- Project setup and structure
- Database models
- Authentication system
- Basic transaction CRUD

### ✅ Phase 2: Budget Management
- Budget CRUD operations
- Budget tracking and alerts
- Category management

### ✅ Phase 3: Analytics & Reporting
- Dashboard analytics
- MongoDB aggregations
- Export functionality (PDF/CSV)

### ✅ Phase 4: AI Integration
- OpenAI service setup
- Smart categorization
- Financial insights
- Budget suggestions
- Spending prediction
- AI chat assistant

### 🚧 Phase 5: Frontend Development (In Progress)
- React app setup
- Authentication UI
- Transaction management UI
- Budget management UI
- Analytics dashboards with charts
- AI features UI

### 📋 Phase 6: Polish & Production
- Error handling
- Loading states
- Responsive design
- Performance optimization
- Security audit
- Documentation

## 📝 Notes

- Default categories are automatically created for new users
- **All intelligence features are free and use local processing** - no external APIs required
- All API endpoints require authentication except `/api/auth/*`
- Rate limiting is applied to prevent abuse
- Intelligence engine uses deterministic, explainable logic

## 🤝 Contributing

This is a production-ready application built with best practices in mind. Feel free to extend and customize as needed.

## 📄 License

ISC
