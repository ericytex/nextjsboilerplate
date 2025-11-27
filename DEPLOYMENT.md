# Deployment Guide

## Local Testing First

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Test locally** at `http://localhost:3000`

## Deploy to Vercel

### Option 1: Using Vercel CLI

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   
   Or for production:
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard (Recommended for first-time)

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

## After Deployment

Once deployed, you'll get:
- **Production URL**: `https://your-project.vercel.app`
- **Preview URLs**: For each branch/PR

All your pages will be available at:
- `/pricing` - Pricing page
- `/success?plan=basic` - Success page
- `/cancel` - Cancellation page
- `/contact` - Contact form
- `/api/checkout/*` - API routes

