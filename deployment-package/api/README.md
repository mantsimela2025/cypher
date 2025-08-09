# RAS Dashboard API

A robust Node.js/Express API with PostgreSQL database using Drizzle ORM, featuring authentication, user management, and comprehensive error handling.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: Complete CRUD operations for users
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Input validation with express-validator
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Jest with Supertest
- **Error Handling**: Centralized error handling middleware
- **Logging**: Morgan HTTP request logger

## 📁 Project Structure

```
api/
├── src/
│   ├── config/
│   │   └── index.js           # Environment variables, database config
│   ├── db/
│   │   ├── schema/
│   │   │   ├── users.js       # User schema definition
│   │   │   └── index.js       # Schema exports
│   │   ├── migrations/        # Drizzle migration files
│   │   └── index.js           # Drizzle client initialization
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── userController.js  # User management logic
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication routes
│   │   └── userRoutes.js      # User management routes
│   ├── services/
│   │   ├── authService.js     # Authentication business logic
│   │   └── userService.js     # User business logic
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── notFound.js        # 404 handler
│   │   └── validation.js      # Input validation rules
│   ├── utils/
│   │   ├── helpers.js         # Utility functions
│   │   └── validators.js      # Custom validation functions
│   └── app.js                 # Express app setup
├── tests/
│   ├── auth.test.js           # Authentication tests
│   └── users.test.js          # User management tests
├── .env                       # Environment variables
├── package.json
├── drizzle.config.js          # Drizzle configuration
└── server.js                  # Entry point
```

## 🛠️ Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and navigate to the API directory**
   ```bash
   cd api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Copy the `.env` file and update the values:
   ```bash
   cp .env .env.local
   ```
   
   Update the following variables in `.env`:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # Other configurations...
   ```

4. **Database Setup**
   
   Generate and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the server**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | Logout user | No |
| GET | `/api/v1/auth/profile` | Get current user profile | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users` | Get all users (paginated) | Yes |
| GET | `/api/v1/users/:id` | Get user by ID | Yes |
| POST | `/api/v1/users` | Create new user | Yes |
| PUT | `/api/v1/users/:id` | Update user | Yes |
| DELETE | `/api/v1/users/:id` | Delete user | Yes |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🗄️ Database

### Schema

The API uses Drizzle ORM with PostgreSQL. The main entities include:

- **Users**: User accounts with authentication
- More schemas can be added in `src/db/schema/`

### Migrations

Generate new migration:
```bash
npm run db:generate
```

Apply migrations:
```bash
npm run db:migrate
```

Open Drizzle Studio (database GUI):
```bash
npm run db:studio
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive validation rules
- **Rate Limiting**: Prevent abuse
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Environment Variables**: Sensitive data protection

## 📝 Development

### Code Quality

Lint code:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run format
```

### Adding New Features

1. **Database Schema**: Add new tables in `src/db/schema/`
2. **Services**: Business logic in `src/services/`
3. **Controllers**: Request handlers in `src/controllers/`
4. **Routes**: API endpoints in `src/routes/`
5. **Middleware**: Custom middleware in `src/middleware/`
6. **Tests**: Add tests in `tests/`

## 🚀 Deployment

1. **Environment Variables**: Set production environment variables
2. **Database**: Ensure PostgreSQL is accessible
3. **Build**: No build step required for Node.js
4. **Start**: Use `npm start` or process manager like PM2

## 📄 License

MIT License - see LICENSE file for details.
