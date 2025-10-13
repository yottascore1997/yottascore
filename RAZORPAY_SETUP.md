# Razorpay Integration Setup Guide

## Overview
This guide will help you set up Razorpay payment gateway integration with your wallet system.

## Prerequisites
1. Razorpay account (https://razorpay.com/)
2. Razorpay API keys (Key ID and Key Secret)
3. Webhook endpoint configured

## Setup Steps

### 1. Install Dependencies
```bash
npm install razorpay
```

### 2. Environment Variables
Add the following environment variables to your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
```

### 3. Get Razorpay Credentials

#### From Razorpay Dashboard:
1. Login to your Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate API Keys (Test/Live mode)
4. Copy the Key ID and Key Secret

#### Webhook Setup:
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy the webhook secret

### 4. Database Migration
Run the following command to update your database schema:

```bash
npx prisma migrate dev --name add_razorpay_fields_to_transaction
```

### 5. Test the Integration

#### Test Mode:
- Use Razorpay test credentials
- Test with Razorpay test cards:
  - Success: 4111 1111 1111 1111
  - Failure: 4000 0000 0000 0002

#### Live Mode:
- Use Razorpay live credentials
- Ensure SSL certificate is installed
- Update webhook URL to production domain

## Features Implemented

### 1. Payment Flow
- Create Razorpay order
- Handle payment verification
- Update wallet balance
- Transaction history tracking

### 2. Security Features
- Payment signature verification
- Webhook signature validation
- Transaction status tracking
- Amount validation (₹1 - ₹1,00,000)

### 3. User Experience
- Modern payment UI
- Real-time payment status
- Payment history
- Error handling

## API Endpoints

### Create Order
```
POST /api/razorpay/create-order
```
Creates a Razorpay order for wallet deposit.

### Verify Payment
```
POST /api/razorpay/verify-payment
```
Verifies payment signature and updates wallet.

### Webhook
```
POST /api/razorpay/webhook
```
Handles Razorpay webhook events.

## Testing

### Test Cards (Test Mode)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test Amounts
- Minimum: ₹1
- Maximum: ₹1,00,000
- Test with different amounts to verify functionality

## Troubleshooting

### Common Issues

1. **Payment not verified**
   - Check webhook URL configuration
   - Verify webhook secret
   - Check server logs for errors

2. **Order creation failed**
   - Verify API keys
   - Check amount limits
   - Ensure proper authentication

3. **Database errors**
   - Run database migration
   - Check Prisma schema
   - Verify database connection

### Debug Steps

1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Verify Razorpay dashboard for webhook events
4. Test with different payment methods

## Production Deployment

### Security Checklist
- [ ] Use HTTPS for all endpoints
- [ ] Validate all inputs
- [ ] Implement rate limiting
- [ ] Log all transactions
- [ ] Monitor webhook events

### Performance Optimization
- [ ] Implement caching for frequently accessed data
- [ ] Optimize database queries
- [ ] Use CDN for static assets
- [ ] Monitor API response times

## Support

For issues related to:
- **Razorpay**: Contact Razorpay support
- **Integration**: Check this documentation
- **Database**: Check Prisma documentation

## Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Webhook Documentation](https://razorpay.com/docs/webhooks/)
