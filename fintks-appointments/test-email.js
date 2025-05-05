import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing email configuration...');
console.log(`Host: ${process.env.EMAIL_HOST}`);
console.log(`Port: ${process.env.EMAIL_PORT}`);
console.log(`Secure: ${process.env.EMAIL_SECURE}`);
console.log(`User: ${process.env.EMAIL_USER}`);
// Don't log the password for security reasons

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify connection configuration
transporter.verify()
  .then(success => {
    console.log('Server is ready to take our messages');
  })
  .catch(err => {
    console.error('Error connecting to email server:');
    console.error(err);
    
    if (err.message.includes('535-5.7.8') || err.message.includes('Invalid login')) {
      console.log('\nThis is likely due to one of these issues:');
      console.log('1. You need to use an App Password instead of your regular Gmail password');
      console.log('2. 2-Factor Authentication is enabled on your Gmail account');
      console.log('3. Less secure app access is disabled in your Google account');
      console.log('\nTo fix this:');
      console.log('1. Go to https://myaccount.google.com/apppasswords');
      console.log('2. Sign in with your Google account');
      console.log('3. Select "App" and choose "Other (Custom name)"');
      console.log('4. Enter a name like "Fintks Appointments"');
      console.log('5. Click "Generate"');
      console.log('6. Copy the 16-character password');
      console.log('7. Update your .env file with this password in the EMAIL_PASSWORD field');
    }
  });