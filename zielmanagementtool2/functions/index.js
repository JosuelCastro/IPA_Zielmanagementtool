// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Create Nodemailer transporter
let transporter = nodemailer.createTransport({
    host: functions.config().email.host,
    port: functions.config().email.port,
    secure: functions.config().email.secure === "true",
    auth: {
        user: functions.config().email.user,
        pass: functions.config().email.password,
    },
});

// Helper function to send email
async function sendEmail(to, subject, html) {
    const mailOptions = {
        from: `"ZielManager" <${functions.config().email.user}>`,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return {success: true, messageId: info.messageId};
    } catch (error) {
        console.error("Error sending email:", error);
        return {success: false, error: error.message};
    }
}

// Generate email content based on notification type
function generateEmailContent(notification) {
    const baseUrl = functions.config().app.url || "http://localhost:5173";

    let actionUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash if exists
    if (notification.goalId) {
        actionUrl = `${actionUrl}/goals/${notification.goalId}`;
    } else if (notification.type === "goal_reminder") {
        actionUrl = `${actionUrl}/goals/create`;
    } else if (notification.type === "supervisor_request_result") {
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
        ${notification.goalTitle ? `<p style="color: #666; line-height: 1.5;"><strong>Goal:</strong> ${notification.goalTitle}</p>` : ""}
        ${notification.senderName && notification.senderName !== "ZielManager System" ? `<p style="color: #666; line-height: 1.5;"><strong>From:</strong> ${notification.senderName}</p>` : ""}
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

// Cloud Function triggered when a new notification is created
exports.sendNotificationEmails = functions.firestore
    .document("notifications/{notificationId}")
    .onCreate(async (snapshot, context) => {
        const notification = snapshot.data();
        const notificationId = context.params.notificationId;

        try {
            // Get the recipient user
            const userDoc = await db.collection("users").doc(notification.recipientId).get();

            if (!userDoc.exists) {
                console.error(`User ${notification.recipientId} not found`);
                return null;
            }

            const userData = userDoc.data();

            // Check if user wants email notifications
            if (userData.emailNotifications === false) {
                console.log(`User ${notification.recipientId} has disabled email notifications`);
                return null;
            }

            // Send email
            const emailContent = generateEmailContent(notification);
            const result = await sendEmail(
                userData.email,
                `ZielManager: ${notification.message}`,
                emailContent
            );

            // Update notification with email status
            await snapshot.ref.update({
                emailSent: result.success,
                emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
                emailError: result.success ? null : result.error,
            });

            console.log(`Email notification ${result.success ? "sent" : "failed"} for notification ${notificationId}`);

            return result;
        } catch (error) {
            console.error(`Error processing notification ${notificationId}:`, error);
            return null;
        }
    });

// Function to update a user's email notification preference
exports.updateEmailPreference = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }

    const {enableEmails} = data;
    const userId = context.auth.uid;

    try {
        await db.collection("users").doc(userId).update({
            emailNotifications: enableEmails === true ? true : false,
            emailPreferenceUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {success: true};
    } catch (error) {
        console.error("Error updating email preference:", error);
        throw new functions.https.HttpsError("internal", "Failed to update email preference");
    }
});