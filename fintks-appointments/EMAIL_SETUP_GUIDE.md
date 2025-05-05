# Email Setup Guide for Fintks Appointments

## Problem: Gmail Authentication Error

You're seeing this error because Gmail has rejected the login credentials:

```
Failed to send appointment email: Invalid login: 535-5.7.8 Username and Password not accepted.
For more information, go to 535 5.7.8 https://support.google.com/mail/?p=BadCredentials
```

## Why This Happens

This error occurs because of Google's security policies. When an application tries to access Gmail using regular password authentication, Google blocks it for security reasons, especially if:

1. You have 2-Factor Authentication enabled on your Google account
2. The application is considered "less secure" by Google standards
3. You're using your regular Gmail password instead of an app-specific password

## Solution: Generate an App Password

An App Password is a 16-character code that gives a less secure app or device permission to access your Google Account. App passwords are more secure than using your regular password for third-party applications.

### Step-by-Step Instructions

1. **Go to your Google Account**
   - Visit [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Sign in with your Google account credentials

2. **Generate an App Password**
   - In the "Select app" dropdown, choose "Other (Custom name)"
   - Enter a name like "Fintks Appointments"
   - Click "Generate"

3. **Copy the App Password**
   - Google will display a 16-character password (without spaces)
   - Copy this password

4. **Update Your .env File**
   - Open the `.env` file in your project
   - Replace the value for `EMAIL_PASSWORD` with your new app password
   - Save the file

   ```
   EMAIL_PASSWORD=your16characterapppassword
   ```

5. **Test the Email Configuration**
   - Run the test script: `node test-email.js`
   - If successful, you should see: "Server is ready to take our messages"

## Important Notes

- App passwords can only be used if you have 2-Step Verification enabled on your Google Account
- Each app password can only be viewed once when it's created
- If you need to generate a new app password, you'll need to revoke the old one first
- Keep your app passwords secure, as they provide access to your account

## Additional Resources

- [Google Support: Sign in with App Passwords](https://support.google.com/accounts/answer/185833)
- [Google Support: Less secure apps & your Google Account](https://support.google.com/accounts/answer/6010255)