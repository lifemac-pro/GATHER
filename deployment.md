# Deployment Guide for GatherEase

This guide provides instructions for deploying the GatherEase application to production environments.

## Prerequisites

- Node.js 18.x or later
- MongoDB database (Atlas recommended for production)
- Clerk account for authentication
- (Optional) Stripe account for payments

## Environment Setup

1. Create a `.env` file based on the `.env.example` template
2. Update all environment variables with your production values:
   - `DATABASE_URL`: Your MongoDB connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: Your Clerk API keys
   - Other environment variables as needed

## Build Process

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Start the production server
pnpm start
```

## Deployment Options

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy using the Vercel dashboard or CLI

```bash
# Using Vercel CLI
vercel --prod
```

### Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
# Build the Docker image
docker build -t gatherease .

# Run the container
docker run -p 3000:3000 --env-file .env gatherease
```

### Traditional Hosting

1. Build the application as described above
2. Transfer the built files to your hosting environment
3. Set up a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start npm --name "gatherease" -- start

# Ensure PM2 restarts on system reboot
pm2 startup
pm2 save
```

## Database Considerations

- Ensure your MongoDB instance has proper security measures
- Set up database backups
- Consider using MongoDB Atlas for managed database services

## Monitoring and Logging

- Set up application monitoring using services like Sentry or New Relic
- Configure proper logging for production
- Set up alerts for critical errors

## Security Considerations

- Ensure all API keys and secrets are properly secured
- Set up proper CORS configuration
- Enable HTTPS for all traffic
- Regularly update dependencies

## Performance Optimization

- Enable caching where appropriate
- Use a CDN for static assets
- Optimize images and assets
- Configure proper HTTP caching headers

## Scaling

- Consider using a load balancer for horizontal scaling
- Implement database connection pooling
- Use Redis for session storage and caching in high-traffic scenarios

## Maintenance

- Set up a CI/CD pipeline for automated deployments
- Regularly update dependencies
- Monitor for security vulnerabilities
- Perform regular backups

## Troubleshooting

If you encounter issues during deployment:

1. Check application logs
2. Verify environment variables are correctly set
3. Ensure database connection is working
4. Check for network/firewall issues
5. Verify Clerk authentication is properly configured

For additional help, refer to the project documentation or contact support.







# MongoDB Connection
# Original MongoDB URI
DATABASE_URL=mongodb+srv://devdc:dev123@cluster0.v8rw266.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c29jaWFsLWhhd2stMTIuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_SQ2sfojKQomFgwe247VcWG1vAanmqNeYAgsoY5g56j
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_OUT_URL=/sign-out
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/admin/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/admin/dashboard


# MongoDB connection
# DATABASE_URL=mongodb://localhost:27017/gatherease

# NextAuth.js configuration
NEXTAUTH_SECRET=EMVSyIURwdbZHaBvODuS7I9X6ErzuULcmfs8tfUddNE=

NEXTAUTH_URL=http://localhost:3000

# Email configuration
EMAIL_SERVER=smtp://localhost:1025
EMAIL_FROM=no-reply@gatherease.com

# Stripe configuration (for payment processing)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# WhatsApp Business API configuration
# For testing, you can use a mock API URL and token
WHATSAPP_API_URL=https://mock-whatsapp-api.example.com
WHATSAPP_API_TOKEN=mock_whatsapp_token

# Application URLs
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug

# Cron job security
CRON_SECRET=your_cron_secret_key