# Integrations Settings Dashboard

This dashboard allows users to configure and manage key integrations for their application without touching code.

## Features

- **Toggle integrations on/off** - Enable or disable integrations with a simple switch
- **API key management** - Securely input and store API keys for each integration
- **Real-time configuration** - Changes are saved and applied immediately
- **Built-in documentation** - Quick access to integration documentation
- **Status indicators** - Visual feedback showing which integrations are active

## Available Integrations

### 1. NextAuth.js (Authentication)
- **Purpose**: User authentication and session management
- **Configuration**:
  - API Key
  - Secret Key
  - Providers (Google, GitHub, etc.)
  - Session Strategy (JWT)
- **Documentation**: https://next-auth.js.org/getting-started/introduction

### 2. Prisma + PostgreSQL (Database)
- **Purpose**: Database ORM and PostgreSQL connection
- **Configuration**:
  - Database URL
  - Connection Pool Size
  - SSL Settings
- **Documentation**: https://www.prisma.io/docs/getting-started

### 3. Stripe (Payments)
- **Purpose**: Payment processing for subscriptions and one-time payments
- **Configuration**:
  - API Key (Publishable Key)
  - Secret Key
  - Webhook Secret
  - Currency
- **Documentation**: https://stripe.com/docs

### 4. Analytics
- **Purpose**: Track user behavior and application metrics
- **Configuration**:
  - Tracking ID
  - Enable Page Views
  - Enable Events
- **Documentation**: https://developers.google.com/analytics

### 5. Algolia Search
- **Purpose**: Powerful search functionality with instant results
- **Configuration**:
  - Application ID
  - API Key
  - Secret Key
  - Index Name
- **Documentation**: https://www.algolia.com/doc/

## How to Use

1. Navigate to **Dashboard → Settings → Integrations**
2. Find the integration you want to configure
3. Toggle the switch to enable/disable the integration
4. If enabled, fill in the required API keys and configuration
5. Click **Save Changes** to apply the configuration
6. The integration will be active immediately

## API Endpoints

### GET `/api/settings/integrations`
Retrieves all integration configurations.

### POST `/api/settings/integrations`
Saves integration configuration.

**Request Body:**
```json
{
  "integrationId": "stripe",
  "config": {
    "enabled": true,
    "apiKey": "pk_test_...",
    "secretKey": "sk_test_...",
    "customSettings": {
      "webhookSecret": "whsec_...",
      "currency": "usd"
    }
  }
}
```

## Security Notes

- API keys are stored securely (in production, use environment variables or a secure vault)
- Sensitive fields are masked in the UI (password input type)
- All API requests should be authenticated in production
- Consider using a secrets management service for production deployments

## Production Considerations

In a production environment, you should:

1. **Use a Database**: Store configurations in PostgreSQL/Prisma instead of in-memory
2. **Environment Variables**: Update `.env` files or use a config service
3. **Validation**: Validate API keys by making test requests
4. **Hot Reload**: Trigger application restart or hot-reload when critical configs change
5. **Audit Logging**: Log all configuration changes for security
6. **Role-Based Access**: Restrict access to settings based on user roles
7. **Encryption**: Encrypt sensitive data at rest

## Extending the System

To add a new integration:

1. Add the integration to the `getDefaultIntegrations()` function in `/app/dashboard/settings/integrations/page.tsx`
2. Add configuration fields in the UI
3. Update the API route to handle the new integration type
4. Add validation logic if needed

Example:
```typescript
{
  id: 'new-integration',
  name: 'New Integration',
  description: 'Description of what it does',
  icon: <IconComponent className="h-5 w-5" />,
  category: 'Category',
  config: {
    enabled: false,
    apiKey: '',
    // ... other config fields
  },
  documentation: 'https://docs.example.com'
}
```

