import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Check if a user has at least 3 goals and send a reminder notification if not
 *
 * @param {Object} user - The Firebase user object
 * @param {Object} userProfile - The user profile data
 * @returns {Promise<Object>} - Object containing count of goals and whether a notification was sent
 */
export const checkUserGoals = async (user, userProfile) => {
    try {
        // Only check for apprentices
        if (userProfile?.role !== 'apprentice') {
            return { goalCount: 0, notificationSent: false };
        }

        // Get user's goals
        const goalsQuery = query(
            collection(db, 'goals'),
            where('apprenticeId', '==', user.uid)
        );

        const goalSnapshot = await getDocs(goalsQuery);
        const goalCount = goalSnapshot.size;

        // If they have fewer than 3 goals, send a reminder notification / Email!
        if (goalCount < 3) {
            await createGoalReminderNotification({
                userId: user.uid,
                userName: userProfile.firstName,
                currentGoalCount: goalCount
            });

            return { goalCount, notificationSent: true };
        }

        return { goalCount, notificationSent: false };
    } catch (error) {
        console.error('Error checking user goals:', error);
        return { goalCount: 0, notificationSent: false, error };
    }
};

export default {
    checkUserGoals
};