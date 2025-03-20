import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Initialize Firebase Functions
const functions = getFunctions();

/**
 * Update a user's email notification preference
 *
 * @param {string} userId - The user ID
 * @param {boolean} enableEmails - Whether to enable email notifications
 * @returns {Promise<Object>} - Result of the operation
 */
export const updateEmailPreference = async (userId, enableEmails) => {
    try {
        // Call the Cloud Function
        const updateEmailPreferenceFunc = httpsCallable(functions, 'updateEmailPreference');
        const result = await updateEmailPreferenceFunc({ enableEmails });

        // Also update locally for immediate UI feedback
        await updateDoc(doc(db, 'users', userId), {
            emailNotifications: enableEmails
        });

        return { success: true, data: result.data };
    } catch (error) {
        console.error('Error updating email preference:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a test email to verify the email notification system
 *
 * @param {string} email - Email address to send the test to
 * @returns {Promise<Object>} - Result of the operation
 */
export const sendTestEmail = async (email) => {
    try {
        // For testing, we'll use a direct API call to our Express server
        // We'll use a hardcoded URL since process.env isn't available in the browser
        const API_URL = 'http://localhost:3000'; // Change this to match your Express server URL
        const response = await fetch(`${API_URL}/api/test-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send test email');
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error sending test email:', error);
        return { success: false, error: error.message };
    }
};

export default {
    updateEmailPreference,
    sendTestEmail
};