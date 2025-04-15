# Deployment Guide

This guide provides instructions for deploying the Gather Events application to production.

## Prerequisites

Before deploying, ensure you have:

1. A MongoDB database (e.g., MongoDB Atlas)
2. A Clerk account for authentication
3. An UploadThing account for image uploads (optional)
4. A Vercel account for hosting (recommended)

## Environment Variables

The following environment variables are required for production:

```
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/gather?retryWrites=true&w=majority

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# UploadThing (optional)
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Node Environment
NODE_ENV=production
```

## Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Connect your repository to Vercel:
   - Go to [Vercel](https://vercel.com) and sign in
   - Click "New Project"
   - Import your repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `pnpm build`
     - Output Directory: .next

3. Configure environment variables:
   - Add all the required environment variables listed above
   - Make sure to mark the appropriate variables as "Production Only"

4. Deploy the project:
   - Click "Deploy"
   - Wait for the build to complete

5. Configure custom domain (optional):
   - Go to the project settings
   - Navigate to "Domains"
   - Add your custom domain

### Option 2: Deploy to a VPS or Dedicated Server

1. Set up a server with Node.js (v18+) and PNPM installed

2. Clone your repository:
   ```bash
   git clone your-repository-url
   cd your-project
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Create a `.env` file with all the required environment variables

5. Build the application:
   ```bash
   pnpm build
   ```

6. Start the application:
   ```bash
   pnpm start
   ```

7. Set up a reverse proxy (Nginx or Apache) to serve the application:

   Example Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. Set up SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

9. Set up a process manager (PM2) to keep the application running:
   ```bash
   npm install -g pm2
   pm2 start npm --name "gather" -- start
   pm2 save
   pm2 startup
   ```

## Post-Deployment Checklist

After deploying, verify the following:

1. **Authentication**: Test sign-up and sign-in functionality
2. **Database Connection**: Verify that events and attendees are being saved
3. **Image Uploads**: Test image upload functionality
4. **Admin Access**: Verify that admin routes are protected
5. **Performance**: Check page load times and optimize if necessary
6. **Security Headers**: Verify that security headers are being applied
7. **Error Handling**: Test error scenarios to ensure proper handling

## Monitoring and Maintenance

For production monitoring, consider setting up:

1. **Error Tracking**: Integrate Sentry or similar service
2. **Performance Monitoring**: Use Vercel Analytics or New Relic
3. **Uptime Monitoring**: Set up UptimeRobot or similar service
4. **Database Backups**: Configure regular backups for MongoDB

## Scaling Considerations

As your application grows, consider:

1. **Database Scaling**: Upgrade MongoDB Atlas plan or implement sharding
2. **Caching**: Implement Redis for more advanced caching
3. **CDN**: Use a CDN for static assets and images
4. **Serverless Functions**: Split high-load operations into separate serverless functions

## Troubleshooting

Common issues and solutions:

1. **Database Connection Errors**:
   - Verify DATABASE_URL is correct
   - Check network access rules in MongoDB Atlas
   - Ensure IP whitelist includes your server IP

2. **Authentication Issues**:
   - Verify Clerk API keys are correct
   - Check Clerk dashboard for error logs

3. **Image Upload Problems**:
   - Verify UploadThing credentials
   - Check file size limits and formats

4. **Performance Issues**:
   - Enable caching for frequently accessed data
   - Optimize database queries
   - Consider server-side rendering for critical pages
