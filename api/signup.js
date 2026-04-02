// Vercel Serverless Function to handle DirectShield signup form submissions
// Uses Google Workspace SMTP to send form data to admin@directshield.io

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, propertyName, location, otaPlatform, website, timestamp, source } = req.body;

    // Validate required fields
    if (!email || !propertyName || !location || !otaPlatform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create Nodemailer transporter using Google Workspace SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.GOOGLE_WORKSPACE_EMAIL, // admin@directshield.io
        pass: process.env.GOOGLE_WORKSPACE_APP_PASSWORD, // 16-character app password
      },
    });

    // Prepare email content for admin notification
    const emailContent = `
      <h2>New DirectShield Trial Signup</h2>
      <p>A new property owner has signed up for DirectShield trial:</p>
      
      <h3>Property Details:</h3>
      <ul>
        <li><strong>Property Name:</strong> ${propertyName}</li>
        <li><strong>Location:</strong> ${location}</li>
        <li><strong>Primary OTA:</strong> ${otaPlatform}</li>
        <li><strong>Website:</strong> ${website || 'Not provided'}</li>
      </ul>
      
      <h3>Contact Information:</h3>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
      </ul>
      
      <h3>Submission Details:</h3>
      <ul>
        <li><strong>Timestamp:</strong> ${timestamp}</li>
        <li><strong>Source:</strong> ${source || 'Direct signup'}</li>
      </ul>
      
      <hr>
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Review the property details</li>
        <li>Send trial activation link to ${email}</li>
        <li>Follow up within 24 hours</li>
      </ol>
    `;

    // Send email to admin
    const result = await transporter.sendMail({
      from: `DirectShield <${process.env.GOOGLE_WORKSPACE_EMAIL}>`,
      to: process.env.GOOGLE_WORKSPACE_EMAIL, // admin@directshield.io
      subject: `New Trial Signup: ${propertyName}`,
      html: emailContent,
    });

    // Also send confirmation email to the user
    const userConfirmationEmail = `
      <h2>Welcome to DirectShield!</h2>
      <p>Thank you for signing up for your 14-day free trial.</p>
      
      <h3>Your Trial Details:</h3>
      <ul>
        <li><strong>Property:</strong> ${propertyName}</li>
        <li><strong>Location:</strong> ${location}</li>
        <li><strong>Trial Duration:</strong> 14 days</li>
      </ul>
      
      <h3>What's Next:</h3>
      <ol>
        <li>We'll send you a setup guide within 24 hours</li>
        <li>Installation takes just 10 minutes</li>
        <li>Start capturing direct bookings immediately</li>
      </ol>
      
      <p><strong>Need help?</strong> Reply to this email or visit our documentation.</p>
      
      <hr>
      <p>Best regards,  
The DirectShield Team</p>
    `;

    await transporter.sendMail({
      from: `DirectShield <${process.env.GOOGLE_WORKSPACE_EMAIL}>`,
      to: email,
      subject: 'Welcome to DirectShield - Your 14-Day Free Trial Starts Now',
      html: userConfirmationEmail,
    });

    return res.status(200).json({
      success: true,
      message: 'Signup received. Check your email for next steps.',
      id: result.messageId,
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}
