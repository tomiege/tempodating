# OTP Authentication Setup Guide

This application uses **OTP (One-Time Password)** magic link authentication instead of traditional passwords.

## How It Works

### For Existing Users:
1. **Enter email** → System detects email exists
2. **OTP sent** → 6-digit code emailed
3. **Enter code** → Verify and login
4. **Proceed to payment**

### For New Users:
1. **Enter email** → System detects new email
2. **Provide details** → Name, age, gender
3. **OTP sent** → 6-digit code emailed
4. **Enter code** → Verify and create account
5. **Proceed to payment**

## Supabase Dashboard Configuration

### 1. Enable OTP Authentication

Go to **Authentication** → **Providers** → **Email**:
- ✅ Enable Email provider
- ✅ Enable "Confirm email" (optional - can disable for faster signup)
- ✅ Enable "Secure email change"

### 2. Configure OTP Email Template

Go to **Authentication** → **Email Templates** → **Magic Link**

**Subject:**
```
Your {{ .SiteURL }} Login Code
```

**Body (HTML):**
```html
<h2>Your Login Code</h2>
<p>Enter this code to sign in to {{ .SiteURL }}:</p>
<div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
  <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #333;">{{ .Token }}</h1>
</div>
<p style="color: #666; font-size: 14px;">This code expires in 60 minutes.</p>
<p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
<p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
  Sent from {{ .SiteURL }}
</p>
```

**IMPORTANT:** Use `{{ .Token }}` (not `{{ .TokenHash }}`) to display the 6-digit OTP code.

### 3. OTP Settings

Go to **Authentication** → **Settings** → **Auth Providers**:
- **OTP Expiry**: 3600 seconds (1 hour)
- **OTP Length**: 6 digits
- **Minimum Interval**: 60 seconds

### 4. Production Email Setup

Configure **Authentication** → **Settings** → **SMTP Settings**

Recommended providers:
- SendGrid, Postmark, AWS SES, or Mailgun
