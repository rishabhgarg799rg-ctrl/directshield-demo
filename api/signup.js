// Vercel Serverless Function to handle DirectShield signup form submissions
// This sends form data to admin@directshield.io via email

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

    // Prepare email content
    const emailContent = `
New DirectShield Trial Signup

Property Details:
- Property Name: ${propertyName}
- Location: ${location}
- Primary OTA: ${otaPlatform}
- Website: ${website}

Contact Information:
- Email: ${email}

Submission Details:
- Source: ${source}
- Timestamp: ${timestamp}

---
This is an automated message from DirectShield signup form.
    `.trim();

    // Use Resend or SendGrid (if configured)
    // For now, we'll use a simple approach with environment variables
    
    // Option 1: Using Resend (recommended for Vercel)
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const result = await resend.emails.send({
        from: 'DirectShield <noreply@directshield.io>',
        to: 'admin@directshield.io',
        subject: `New Trial Signup: ${propertyName}`,
        html: `
          <h2>New DirectShield Trial Signup</h2>
          <h3>Property Details</h3>
          <ul>
            <li><strong>Property Name:</strong> ${propertyName}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Primary OTA:</strong> ${otaPlatform}</li>
            <li><strong>Website:</strong> ${website}</li>
          </ul>
          <h3>Contact Information</h3>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
          </ul>
          <h3>Submission Details</h3>
          <ul>
            <li><strong>Source:</strong> ${source}</li>
            <li><strong>Timestamp:</strong> ${timestamp}</li>
          </ul>
        `
      });

      if (result.error) {
        console.error('Resend error:', result.error);
        return res.status(500).json({ error: 'Failed to send email' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Signup received. Check your email for next steps.',
        id: result.data?.id 
      });
    }

    // Option 2: Using SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: 'admin@directshield.io',
        from: 'noreply@directshield.io',
        subject: `New Trial Signup: ${propertyName}`,
        html: `
          <h2>New DirectShield Trial Signup</h2>
          <h3>Property Details</h3>
          <ul>
            <li><strong>Property Name:</strong> ${propertyName}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Primary OTA:</strong> ${otaPlatform}</li>
            <li><strong>Website:</strong> ${website}</li>
          </ul>
          <h3>Contact Information</h3>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
          </ul>
          <h3>Submission Details</h3>
          <ul>
            <li><strong>Source:</strong> ${source}</li>
            <li><strong>Timestamp:</strong> ${timestamp}</li>
          </ul>
        `
      };

      await sgMail.send(msg);

      return res.status(200).json({ 
        success: true, 
        message: 'Signup received. Check your email for next steps.' 
      });
    }

    // Option 3: Fallback - Log to console (for development)
    console.log('Signup form submission:', {
      email,
      propertyName,
      location,
      otaPlatform,
      website,
      timestamp,
      source
    });

    // Return success even without email service (for testing)
    return res.status(200).json({ 
      success: true, 
      message: 'Signup received. Check your email for next steps.',
      note: 'Email service not configured. Contact admin@directshield.io to complete setup.'
    });

  } catch (error) {
    console.error('Signup API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
