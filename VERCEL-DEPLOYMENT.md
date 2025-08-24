# Vercel Deployment Guide

This guide will help you deploy your crypto trading dashboard to Vercel.

## Prerequisites

1. GitHub account with your repository: https://github.com/xenoxavier/crypto-trading-interface
2. Vercel account (free tier available)
3. Firebase project setup
4. OpenRouter API account (optional, for AI features)

## Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" to link your GitHub account

## Step 2: Deploy from GitHub

1. After signing in to Vercel, click "New Project"
2. Import your repository: `xenoxavier/crypto-trading-interface`
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `crypto-dashboard`
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty (Next.js default)
   - **Install Command**: `npm install`

## Step 3: Environment Variables

Click on "Environment Variables" and add these required variables:

### Firebase Configuration (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### OpenRouter API (Optional - for AI features)
```
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### How to get Firebase credentials:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Click the gear icon → Project settings
4. Scroll down to "Your apps" section
5. Click "Add app" → Web app (if not done already)
6. Copy the config values from the script tag

### How to get OpenRouter API key:

1. Go to [OpenRouter](https://openrouter.ai)
2. Create an account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key

## Step 4: Firebase Setup for Production

1. In Firebase Console, go to "Authentication"
2. Enable Email/Password and Google sign-in methods
3. Go to "Authentication" → "Settings" → "Authorized domains"
4. Add your Vercel domain (will be provided after deployment)

## Step 5: Deploy

1. Click "Deploy" button in Vercel
2. Wait for build to complete (3-5 minutes)
3. Your app will be available at: `https://your-project-name.vercel.app`

## Step 6: Configure Firebase Authorized Domains

1. After deployment, copy your Vercel URL
2. Go back to Firebase Console → Authentication → Settings → Authorized domains
3. Add your Vercel domain (e.g., `your-project-name.vercel.app`)

## Step 7: Test Your Deployment

1. Visit your deployed app
2. Try creating an account with email/password
3. Try signing in with Google
4. Test the dashboard features
5. Test AI analysis (if OpenRouter API key is configured)

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `OPENROUTER_API_KEY` | No | OpenRouter API key for AI features |

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Ensure Firebase configuration is valid
- Check Vercel build logs for specific errors

### Authentication Not Working
- Verify Firebase authorized domains include your Vercel URL
- Check that authentication methods are enabled in Firebase Console
- Verify environment variables are correct

### AI Features Not Working
- Check if `OPENROUTER_API_KEY` is set
- Verify the API key is valid
- Check if you have credits in your OpenRouter account

## Features Available

✅ Firebase Authentication (Email/Password + Google OAuth)  
✅ User-specific data isolation  
✅ Hybrid tier system (Free/Premium/Unlimited)  
✅ Real-time crypto data  
✅ Portfolio management  
✅ Trading signals  
✅ AI-powered chart analysis (with OpenRouter API)  
✅ Dark theme design  
✅ Responsive mobile design  

## Support

If you encounter any issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure Firebase project is properly configured

Your crypto trading dashboard is production-ready and includes enterprise-grade security features!