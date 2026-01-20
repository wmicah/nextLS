# Development Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm 8+
- PostgreSQL database

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd nextLS

# Install dependencies
pnpm install

# Set up environment variables
cp env.example .env
# Edit .env with your actual values

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests in CI mode
pnpm test:ci

# Update snapshots
pnpm test:update

# Debug tests
pnpm test:debug
```

### Test Structure
- **Unit Tests**: `src/**/__tests__/*.test.{ts,tsx}`
- **Component Tests**: Use `@/lib/test-utils` for custom render
- **API Tests**: Test API utilities and handlers
- **Coverage**: Minimum 80% coverage required

### Writing Tests
```typescript
import { render, screen } from '@/lib/test-utils';
import { createMockUser } from '@/lib/test-utils';

describe('ComponentName', () => {
  it('renders correctly', () => {
    const user = createMockUser({ name: 'Test User' });
    render(<Component user={user} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
```

## 🔍 Code Quality

### Linting
```bash
# Check for linting issues
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Strict linting (no warnings allowed)
pnpm lint:strict
```

### Formatting
```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

### Type Checking
```bash
# Basic type checking
pnpm type-check

# Strict type checking
pnpm type-check:strict
```

### Quality Checks
```bash
# Run all quality checks
pnpm quality

# Fix quality issues
pnpm quality:fix
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   └── __tests__/        # Component tests
├── contexts/              # React contexts
├── lib/                   # Utility functions
│   ├── __tests__/        # Utility tests
│   ├── api-utils.ts      # API route utilities
│   ├── validation.ts     # Input validation
│   ├── monitoring.ts     # Error tracking
│   └── test-utils.tsx    # Test utilities
├── trpc/                  # tRPC configuration
└── styles/                # Global styles
```

## 🔧 API Development

### Creating API Routes
```typescript
import { withApiHandlers, withValidation, createApiResponse } from '@/lib/api-utils';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const POST = withApiHandlers(
  withValidation(schema),
  async (request, { validatedData }) => {
    // Your API logic here
    return createApiResponse({
      data: validatedData,
      message: 'Created successfully',
    });
  }
);
```

### API Utilities
- **`withApiSecurity`**: Adds security headers and validation
- **`withValidation`**: Validates request data with Zod
- **`withRateLimit`**: Applies rate limiting
- **`withAuth`**: Handles authentication
- **`withApiHandlers`**: Combines multiple handlers

## 🚨 Error Handling

### Error Boundaries
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Page() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Monitoring
```typescript
import { captureError, captureMetric } from '@/lib/monitoring';

try {
  // Your code
} catch (error) {
  captureError(error, { context: 'API Route' });
}

// Track performance
const result = await captureMetric('api_call', async () => {
  return await yourApiCall();
});
```

## 📊 Performance

### Bundle Analysis
```bash
# Analyze bundle size
pnpm build:analyze

# View analysis reports in .next/analyze/
```

### Web Vitals
The app automatically tracks Core Web Vitals:
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **INP** (Interaction to Next Paint)
- **LCP** (Largest Contentful Paint)
- **TTFB** (Time to First Byte)

## 🔐 Security

### Input Validation
All user inputs are validated using Zod schemas:
```typescript
import { sanitizeHtml, sanitizeText } from '@/lib/validation';

const cleanHtml = sanitizeHtml(userInput);
const cleanText = sanitizeText(userInput);
```

### Security Headers
Automatically applied via middleware:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Referrer-Policy

### Rate Limiting
API routes are automatically rate-limited based on IP address.

## 🚀 Deployment

### Production Build
```bash
# Build for production
pnpm build

# Start production server
pnpm start:prod
```

### Environment Variables
Ensure all required environment variables are set in production:
- Database connection
- Authentication secrets
- API keys
- Security configurations

## 📝 Contributing

### Pre-commit Hooks
Quality checks run automatically before commits:
- Linting
- Type checking
- Tests

### Code Review Checklist
- [ ] Tests pass
- [ ] Code is linted and formatted
- [ ] Types are correct
- [ ] Documentation is updated
- [ ] Security considerations addressed

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

#### Test Failures
```bash
# Clear Jest cache
pnpm test --clearCache
pnpm test
```

#### Type Errors
```bash
# Check types
pnpm type-check

# Regenerate Prisma client
pnpm db:generate
```

### Getting Help
1. Check the error logs
2. Review the test output
3. Verify environment variables
4. Check TypeScript configuration
5. Review ESLint rules

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
