// server.js
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Helper function to send email
async function sendEmail(to, subject, html) {
    const mailOptions = {
        from: `"ZielManager" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

// Generate email content based on notification type
function generateEmailContent(notification) {
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';

    let actionUrl = baseUrl;
    if (notification.goalId) {
        actionUrl = `${baseUrl}/goals/${notification.goalId}`;
    } else if (notification.type === 'goal_reminder') {
        actionUrl = `${baseUrl}/goals/create`;
    } else if (notification.type === 'supervisor_request_result') {
        actionUrl = `${baseUrl}/profile`;
    }

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0033A1;">ZielManager</h1>
      </div>
      <div style="margin-bottom: 20px;">
        <h2 style="color: #333;">${notification.message}</h2>
        <p style="color: #666; line-height: 1.5;">You have a new notification in your ZielManager account.</p>
      </div>
      <div style="margin-top: 30px; text-align: center;">
        <a href="${actionUrl}" style="background-color: #0033A1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View in ZielManager</a>
      </div>
      <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
        <p>If you don't want to receive these emails anymore, you can disable email notifications in your profile settings.</p>
      </div>
    </div>
  `;
}

// API endpoint to test email sending
app.post('/api/test-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const result = await sendEmail(
        email,
        'Test Email from ZielManager',
        '<h1>This is a test email</h1><p>If you received this, your email notification system is working!</p>'
    );

    if (result.success) {
        res.json({ success: true, messageId: result.messageId });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Notification processing logic
// This is just for reference - actual Cloud Function will be deployed separately

// Function to process a notification and send email if needed
async function processNotification(notification, notificationId) {
    try {
        // Get the recipient user
        const userDoc = await db.collection('users').doc(notification.recipientId).get();

        if (!userDoc.exists) {
            console.error(`User ${notification.recipientId} not found`);
            return { success: false, error: 'User not found' };
        }

        const userData = userDoc.data();

        // Check if user wants email notifications
        if (userData.emailNotifications === false) {
            console.log(`User ${notification.recipientId} has disabled email notifications`);
            return { success: false, error: 'Email notifications disabled' };
        }

        // Send email
        const emailContent = generateEmailContent(notification);
        const result = await sendEmail(
            userData.email,
            `ZielManager: ${notification.message}`,
            emailContent
        );

        // Update notification with email status
        await db.collection('notifications').doc(notificationId).update({
            emailSent: result.success,
            emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            emailError: result.success ? null : result.error
        });

        console.log(`Email notification ${result.success ? 'sent' : 'failed'} for notification ${notificationId}`);

        return result;
    } catch (error) {
        console.error(`Error processing notification ${notificationId}:`, error);
        return { success: false, error: error.message };
    }
}

// Route to manually process a notification (for testing)
app.post('/api/process-notification/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;

        // Get the notification from Firestore
        const notificationDoc = await db.collection('notifications').doc(notificationId).get();

        if (!notificationDoc.exists) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const notification = notificationDoc.data();

        // Process the notification
        const result = await processNotification(notification, notificationId);

        if (result.success) {
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error('Error processing notification:', error);
        res.status(500).json({ error: 'Failed to process notification' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});