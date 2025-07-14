# Refund System Documentation

## Overview

This refund system allows administrators to process refunds for both Stripe and PayPal payments through a secure admin interface.

## Features

- ✅ **Database Tracking**: All refunds are tracked in the `refunds` table
- ✅ **Stripe Integration**: Automatic refund processing via Stripe API
- ✅ **PayPal Support**: Framework for PayPal refunds (manual for now)
- ✅ **Admin Interface**: Web-based admin panel at `/admin`
- ✅ **Security**: API key authentication for admin endpoints
- ✅ **Audit Trail**: Complete refund history with admin notes

## Setup

### 1. Environment Variables

Add these to your environment variables:

```bash
# Required for admin access
ADMIN_API_KEY=your-secure-admin-key-here

# Already configured for payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
```

### 2. Database Migration

The refunds table has been created automatically. It includes:

- `id`: Primary key
- `paymentId`: Reference to original payment
- `amount`: Refund amount
- `currency`: Currency (USD, etc.)
- `reason`: Refund reason (customer request, duplicate, etc.)
- `status`: pending, succeeded, failed, cancelled
- `stripeRefundId`: Stripe refund ID (if applicable)
- `paypalRefundId`: PayPal refund ID (if applicable)
- `adminUserId`: Admin who processed the refund
- `adminNote`: Optional admin note
- `createdAt`: Refund creation time
- `processedAt`: When refund was processed

## Usage

### Admin Interface

1. **Access**: Navigate to `/admin` in your browser
2. **Login**: Enter your `ADMIN_API_KEY`
3. **View Payments**: See all payments with user details
4. **Process Refunds**: Click a payment to initiate refund

### API Endpoints

#### Get All Payments

```bash
GET /api/admin/payments
Headers: x-admin-key: your-admin-key
```

#### Process Refund

```bash
POST /api/admin/refund
Headers:
  x-admin-key: your-admin-key
  Content-Type: application/json
Body:
{
  "paymentId": 123,
  "amount": "19.99",
  "reason": "requested_by_customer",
  "adminNote": "Customer requested refund via email"
}
```

#### Get All Refunds

```bash
GET /api/admin/refunds
Headers: x-admin-key: your-admin-key
```

### Refund Processing

#### Stripe Refunds

- **Automatic**: Refunds are processed immediately via Stripe API
- **Partial**: Supports partial refunds
- **Tracking**: Stripe refund ID is stored automatically

#### PayPal Refunds

- **Current**: Requires manual processing via PayPal dashboard
- **Future**: Could be automated with capture ID tracking
- **Limitation**: PayPal orders need capture IDs for API refunds

### Error Handling

- **Validation**: Amount validation prevents over-refunding
- **Provider Errors**: Payment provider errors are caught and logged
- **Database Safety**: Failed refunds are marked as failed, not deleted
- **Audit Trail**: All refund attempts are logged

## Security

- **API Key**: All admin endpoints require `ADMIN_API_KEY`
- **Input Validation**: Amount and payment ID validation
- **No Sensitive Data**: Payment details are not exposed
- **Audit Logging**: All refund actions are logged with timestamps

## Monitoring

### Logs to Watch

- Refund processing errors
- Payment provider API failures
- Invalid refund attempts
- Database connection issues

### Database Queries

```sql
-- View all refunds
SELECT * FROM refunds ORDER BY created_at DESC;

-- View refunds by status
SELECT * FROM refunds WHERE status = 'succeeded';

-- View total refunded amount
SELECT SUM(amount::decimal) FROM refunds WHERE status = 'succeeded';
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check `ADMIN_API_KEY` environment variable
   - Verify correct API key in admin interface

2. **Stripe Refund Failed**
   - Check Stripe API key configuration
   - Verify payment intent ID exists in Stripe
   - Check if payment was already refunded

3. **PayPal Refund Failed**
   - Currently expected - process manually via PayPal dashboard
   - Future: Implement with capture ID tracking

4. **Database Errors**
   - Check database connection
   - Verify refunds table exists
   - Check foreign key constraints

### Error Codes

- `400`: Invalid request (missing fields, over-refund)
- `401`: Unauthorized (invalid admin key)
- `404`: Payment not found
- `500`: Server error (database, payment provider)

## Future Enhancements

1. **PayPal Automation**: Store capture IDs for automatic PayPal refunds
2. **Admin Users**: Proper admin user system vs API key
3. **Email Notifications**: Automatic refund confirmation emails
4. **Reporting**: Refund analytics and reporting dashboard
5. **Webhook Handling**: Handle refund webhooks from payment providers

## Example Usage

```javascript
// Process a $10 refund for payment #123
const refundData = {
  paymentId: 123,
  amount: "10.00",
  reason: "requested_by_customer",
  adminNote: "Customer contacted support via email",
};

const response = await fetch("/api/admin/refund", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-key": "your-admin-key",
  },
  body: JSON.stringify(refundData),
});

const result = await response.json();
console.log("Refund processed:", result);
```
