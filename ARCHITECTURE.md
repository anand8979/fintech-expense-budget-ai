# System Architecture

## Overview
Production-grade MERN-based FinTech Expense & Budget Management SaaS application with an Intelligent Financial Insights Engine powered by free, local intelligence techniques (rule-based logic, statistical analysis, and pattern recognition).

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi/express-validator
- **Security**: bcrypt, helmet, cors, rate limiting
- **Intelligence Engine**: Custom free intelligence service (rule-based, statistical analysis, keyword matching)
- **File Export**: pdfkit, csv-writer

### Frontend
- **Framework**: React.js with React Router
- **State Management**: React Context API / Redux (optional)
- **Charts**: Recharts
- **UI Components**: Material-UI or Tailwind CSS
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Architecture Layers

### Backend Structure
```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── jwt.js               # JWT configuration
├── models/
│   ├── User.js
│   ├── Transaction.js
│   ├── Budget.js
│   └── Category.js
├── routes/
│   ├── auth.routes.js
│   ├── transaction.routes.js
│   ├── budget.routes.js
│   ├── analytics.routes.js
│   ├── export.routes.js
│   └── ai.routes.js
├── controllers/
│   ├── auth.controller.js
│   ├── transaction.controller.js
│   ├── budget.controller.js
│   ├── analytics.controller.js
│   ├── export.controller.js
│   └── ai.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   ├── error.middleware.js
│   └── rateLimiter.middleware.js
├── services/
│   ├── intelligence.service.js  # Free intelligence engine (rule-based, statistical)
│   ├── analytics.service.js    # Complex aggregations
│   └── export.service.js        # PDF/CSV generation
├── utils/
│   ├── logger.js
│   └── helpers.js
└── server.js
```

### Frontend Structure
```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── auth/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── analytics/
│   │   └── ai/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Transactions.jsx
│   │   ├── Budgets.jsx
│   │   ├── Analytics.jsx
│   │   └── AIChat.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── hooks/
│   └── App.jsx
└── package.json
```

## Database Schema

### User Model
- `_id`: ObjectId
- `email`: String (unique, required)
- `password`: String (hashed, required)
- `firstName`: String
- `lastName`: String
- `currency`: String (default: 'USD')
- `createdAt`: Date
- `updatedAt`: Date

### Category Model
- `_id`: ObjectId
- `name`: String (required)
- `type`: Enum ['expense', 'income'] (required)
- `icon`: String
- `color`: String
- `userId`: ObjectId (reference to User)
- `isDefault`: Boolean

### Transaction Model
- `_id`: ObjectId
- `userId`: ObjectId (reference to User)
- `type`: Enum ['expense', 'income'] (required)
- `amount`: Number (required, > 0)
- `category`: ObjectId (reference to Category)
- `description`: String
- `date`: Date (required)
- `tags`: [String]
- `paymentMethod`: String
- `location`: String
- `createdAt`: Date
- `updatedAt`: Date

### Budget Model
- `_id`: ObjectId
- `userId`: ObjectId (reference to User)
- `category`: ObjectId (reference to Category)
- `amount`: Number (required, > 0)
- `period`: Enum ['monthly', 'yearly'] (required)
- `startDate`: Date (required)
- `endDate`: Date
- `isActive`: Boolean (default: true)
- `createdAt`: Date
- `updatedAt`: Date

## API Design

### Authentication APIs
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout (optional)

### Transaction APIs
- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get transaction summary

### Budget APIs
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get single budget
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/tracking` - Get budget tracking data

### Analytics APIs
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/spending-by-category` - Spending by category
- `GET /api/analytics/trends` - Spending/income trends
- `GET /api/analytics/comparison` - Period comparison

### Export APIs
- `GET /api/export/pdf` - Generate PDF report
- `GET /api/export/csv` - Generate CSV export

### Intelligence APIs (Free, Local Processing)
- `POST /api/ai/categorize` - Smart expense categorization using keyword matching
- `GET /api/ai/insights` - Generate financial insights using statistical analysis
- `GET /api/ai/budget-suggestions` - Budget optimization suggestions based on patterns
- `GET /api/ai/predict-spending` - Spending prediction using moving averages
- `POST /api/ai/chat` - Rule-based financial advice engine

## Security Measures

1. **Authentication**: JWT tokens with refresh token mechanism
2. **Password**: bcrypt hashing (salt rounds: 10)
3. **Validation**: Input validation on all endpoints
4. **Rate Limiting**: Prevent abuse on auth and AI endpoints
5. **CORS**: Configured for frontend origin
6. **Helmet**: Security headers
7. **Data Isolation**: All queries filtered by userId

## Intelligent Financial Insights Engine

### Service Layer Pattern
- Centralized intelligence service (`services/intelligence.service.js`)
- Rate limiting on intelligence endpoints
- Deterministic and explainable logic
- Error handling and fallbacks
- **NO external paid APIs** - all processing is local and free

### Intelligence Features (Free Implementation)

1. **Smart Categorization**:
   - Keyword-based matching with confidence scoring
   - Amount-based heuristics
   - Fallback to most frequently used category
   - Explainable reasoning

2. **Financial Insights**:
   - Statistical analysis of spending patterns
   - Period-over-period comparisons
   - Budget compliance checking
   - Savings rate calculations
   - Rule-based insight generation

3. **Budget Suggestions**:
   - Historical pattern analysis (6-month average)
   - Standard deviation calculations
   - Confidence scoring based on transaction count
   - 20% buffer with 2x cap methodology

4. **Spending Prediction**:
   - Moving averages (last 3 months)
   - Linear regression trend analysis
   - Weighted prediction model (70% moving avg + 30% trend)
   - Confidence levels based on data variance

5. **Financial Advice Engine**:
   - Rule-based question answering
   - Context-aware responses using user's financial data
   - Budget status analysis
   - Savings recommendations
   - Spending pattern insights

## Implementation Phases

### Phase 1: Core Foundation
- Project setup and structure
- Database models
- Authentication system
- Basic transaction CRUD

### Phase 2: Budget Management
- Budget CRUD operations
- Budget tracking and alerts
- Category management

### Phase 3: Analytics & Reporting
- Dashboard analytics
- MongoDB aggregations
- Export functionality (PDF/CSV)

### Phase 4: Intelligence Engine Integration
- Custom intelligence service implementation
- Keyword-based categorization engine
- Statistical analysis for insights
- Pattern recognition for budget suggestions
- Moving average predictions
- Rule-based financial advice engine

### Phase 5: Frontend Development
- React app setup
- Authentication UI
- Transaction management UI
- Budget management UI
- Analytics dashboards with charts
- AI features UI

### Phase 6: Polish & Production
- Error handling
- Loading states
- Responsive design
- Performance optimization
- Security audit
- Documentation
