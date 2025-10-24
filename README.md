# Topiko.online Digital Assessment

This is the standalone deployment of the Digital Readiness Assessment for topiko.online domain.

## Features
- Complete digital readiness assessment
- Real-time OTP validation
- Schedule call functionality
- WhatsApp sharing
- Supabase integration
- Mobile and desktop responsive

## API Endpoints
- `/api/send-otp` - OTP sending functionality

## Routes
- `/` - Main assessment (default)
- `/register` - Assessment (redirect from topikopartner.com)
- `/digitalcheck` - Alternative URL for assessment

## Deployment
Deploy to Vercel and connect to topiko.online domain.

## Configuration
- Supabase URL and keys are configured in index.html
- SMS API integration included
- All assets and dependencies included