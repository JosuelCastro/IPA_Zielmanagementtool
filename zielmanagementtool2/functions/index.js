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

// ===== GOAL REVIEW REMINDER FUNCTIONS =====

/**
 * Calculate days remaining until the review deadline (October 25th)
 */
function getDaysUntilDeadline() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const deadline = new Date(currentYear, 9, 25); // Month is 0-indexed (9 = October)

    // If today is past October 25th, use next year's date
    if (today > deadline) {
        deadline.setFullYear(currentYear + 1);
    }

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Generate HTML for goal review reminder email
 */
function generateGoalReviewEmailContent(data) {
    const baseUrl = functions.config().app.url || "http://localhost:5173";
    const { recipientName, daysRemaining, goalCount, goals } = data;

    // Format the list of goals
    const goalList = goals.map(goal => {
        const submittedDate = goal.submittedAt
            ? new Date(goal.submittedAt).toLocaleDateString()
            : 'Unknown date';

        return `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${goal.title}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${goal.apprenticeName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${submittedDate}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <a href="${baseUrl}/goals/${goal.id}/review" 
                    style="background-color: #000048; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Review
                    </a>
                </td>
            </tr>
        `;
    }).join('');

    // Create urgency message based on days remaining
    let urgencyMessage = '';
    if (daysRemaining <= 7) {
        urgencyMessage = `<p style="color: #B81F2D; font-weight: bold;">URGENT: Only ${daysRemaining} days remaining until the review deadline!</p>`;
    } else if (daysRemaining <= 14) {
        urgencyMessage = `<p style="color: #E9C71D; font-weight: bold;">Important: ${daysRemaining} days remaining until the review deadline.</p>`;
    } else {
        urgencyMessage = `<p style="color: #000048;">${daysRemaining} days remaining until the October 25th review deadline.</p>`;
    }

    // Return the complete HTML
    return `
        <div style="font-family: 'Gellix', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #000048; padding: 20px; text-align: center;">
                <img src="${baseUrl}/Cognizant.png" alt="Cognizant Logo" style="height: 50px;" />
                <h1 style="color: white; margin-top: 10px;">Goal Review Reminder</h1>
            </div>
            
            <div style="padding: 20px; background-color: #fff; border: 1px solid #eee;">
                <p>Hello ${recipientName},</p>
                
                <p>You have <strong>${goalCount}</strong> submitted ${goalCount === 1 ? 'goal' : 'goals'} waiting for your review.</p>
                
                ${urgencyMessage}

                <h2 style="color: #000048; margin-top: 30px;">Goals To Review:</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #000048;">Goal Title</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #000048;">Apprentice</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #000048;">Submitted On</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #000048;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${goalList}
                    </tbody>
                </table>
                
                <div style="margin-top: 40px; text-align: center;">
                    <a href="${baseUrl}/apprentices" 
                        style="background-color: #000048; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                        Review All Goals
                    </a>
                </div>
            </div>
            
            <div style="padding: 15px; background-color: #f5f5f5; font-size: 12px; text-align: center; color: #666;">
                <p>This is an automated reminder from ZielManager. All goals must be reviewed by October 25th.</p>
                <p>If you believe you received this email in error, please contact support.</p>
            </div>
        </div>
    `;
}

/**
 * Send a goal review reminder email
 */
exports.sendGoalReviewReminder = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }

    const { recipientEmail, recipientName, goals } = data;

    if (!recipientEmail || !goals || !Array.isArray(goals)) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function requires valid recipient and goals data."
        );
    }

    try {
        // Calculate days remaining
        const daysRemaining = getDaysUntilDeadline();

        // Log the reminder for tracking purposes
        await db.collection("reminderLogs").add({
            supervisorId: data.supervisorId || null,
            supervisorEmail: recipientEmail,
            supervisorName: recipientName,
            unreviewedGoalCount: goals.length,
            daysRemaining: daysRemaining,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            type: 'goal_review_reminder',
            triggeredBy: context.auth.uid
        });

        // Generate email content
        const emailContent = generateGoalReviewEmailContent({
            recipientName,
            daysRemaining,
            goalCount: goals.length,
            goals
        });

        // Send the email
        const subject = `Action Required: ${goals.length} ${goals.length === 1 ? 'Goal' : 'Goals'} Awaiting Your Review (${daysRemaining} days remaining)`;
        const result = await sendEmail(recipientEmail, subject, emailContent);

        return result;
    } catch (error) {
        console.error('Error sending goal review reminder:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Scheduled function to send weekly reminders
 * This runs every Monday at 9:00 AM
 */
exports.weeklyGoalReviewReminders = functions.pubsub
    .schedule('0 9 * * 1')  // Every Monday at 9:00 AM
    .timeZone('Europe/Berlin')  // Replace with your timezone
    .onRun(async (context) => {
        try {
            // Get all unreviewed goals
            const goalsSnapshot = await db
                .collection('goals')
                .where('submitted', '==', true)
                .where('approved', '==', false)
                .get();

            if (goalsSnapshot.empty) {
                console.log('No unreviewed goals found');
                return null;
            }

            const unreviewedGoals = [];
            goalsSnapshot.forEach(doc => {
                unreviewedGoals.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Get all supervisors
            const supervisorsSnapshot = await db
                .collection('users')
                .where('role', '==', 'supervisor')
                .get();

            if (supervisorsSnapshot.empty) {
                console.log('No supervisors found');
                return null;
            }

            const supervisors = [];
            supervisorsSnapshot.forEach(doc => {
                supervisors.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Calculate days until deadline
            const daysRemaining = getDaysUntilDeadline();

            // Send email to each supervisor
            for (const supervisor of supervisors) {
                // Skip supervisors who have disabled email notifications
                if (supervisor.emailNotifications === false) {
                    console.log(`Supervisor ${supervisor.id} has disabled email notifications`);
                    continue;
                }

                // Create a record of this reminder
                await db.collection('reminderLogs').add({
                    supervisorId: supervisor.id,
                    supervisorEmail: supervisor.email,
                    supervisorName: `${supervisor.firstName} ${supervisor.lastName}`,
                    unreviewedGoalCount: unreviewedGoals.length,
                    daysRemaining: daysRemaining,
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    type: 'weekly_goal_review_reminder'
                });

                // Prepare formatted goals for email
                const goalData = unreviewedGoals.map(goal => ({
                    id: goal.id,
                    title: goal.title,
                    apprenticeName: goal.apprenticeName,
                    submittedAt: goal.submittedAt ? goal.submittedAt.toDate().toISOString() : null
                }));

                // Generate email content
                const emailContent = generateGoalReviewEmailContent({
                    recipientName: `${supervisor.firstName} ${supervisor.lastName}`,
                    daysRemaining,
                    goalCount: unreviewedGoals.length,
                    goals: goalData
                });

                // Send the email
                const subject = `Weekly Reminder: ${unreviewedGoals.length} Goals Awaiting Review (${daysRemaining} days remaining)`;
                await sendEmail(supervisor.email, subject, emailContent);

                console.log(`Sent weekly reminder email to supervisor ${supervisor.id}`);
            }

            console.log(`Sent weekly reminder emails to ${supervisors.length} supervisors for ${unreviewedGoals.length} goals`);
            return null;
        } catch (error) {
            console.error('Error in weekly reminder function:', error);
            return null;
        }
    });