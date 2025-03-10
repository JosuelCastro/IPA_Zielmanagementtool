import {
    collection,
    addDoc,
    serverTimestamp,
    getDoc,
    doc,
    getFirestore,
    writeBatch,
    query,
    where,
    getDocs,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Create a new notification in Firestore
 *
 * @param {Object} notification - The notification data
 * @param {string} notification.recipientId - User ID of the recipient
 * @param {string} notification.senderId - User ID of the sender
 * @param {string} notification.senderName - Name of the sender
 * @param {string} notification.senderRole - Role of the sender (apprentice or supervisor)
 * @param {string} notification.recipientRole - Role of the recipient
 * @param {string} notification.type - Type of notification (comment, approval, submission, etc.)
 * @param {string} notification.goalId - ID of the related goal
 * @param {string} notification.goalTitle - Title of the goal
 * @param {string} notification.message - Notification message
 * @returns {Promise<string>} - ID of the created notification
 */
export const createNotification = async (notification) => {
    try {
        const notificationData = {
            ...notification,
            read: false,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'notifications'), notificationData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Get all supervisors from the users collection
 *
 * @returns {Promise<Array>} - Array of supervisor user objects
 */
export const getSupervisors = async () => {
    try {
        const supervisorQuery = query(
            collection(db, 'users'),
            where('role', '==', 'supervisor')
        );

        const supervisorSnapshot = await getDocs(supervisorQuery);
        const supervisors = [];

        supervisorSnapshot.forEach((doc) => {
            supervisors.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return supervisors;
    } catch (error) {
        console.error('Error fetching supervisors:', error);
        throw error;
    }
};

/**
 * Create a comment notification
 *
 * @param {Object} params - Parameters for creating a comment notification
 * @param {string} params.goalId - ID of the goal
 * @param {string} params.senderId - ID of the comment author
 * @param {string} params.senderName - Name of the comment author
 * @param {string} params.senderRole - Role of the comment author
 * @param {string} params.recipientId - ID of the notification recipient (optional)
 * @param {string} params.recipientRole - Role of the recipient
 * @returns {Promise<string>} - ID of the created notification
 */
export const createCommentNotification = async ({
                                                    goalId,
                                                    senderId,
                                                    senderName,
                                                    senderRole,
                                                    recipientId,
                                                    recipientRole
                                                }) => {
    try {
        // Get goal details
        const goalDoc = await getDoc(doc(db, 'goals', goalId));
        if (!goalDoc.exists()) {
            throw new Error('Goal not found');
        }

        const goalData = goalDoc.data();
        const goalTitle = goalData.title;

        // If no specific recipient ID was provided and the sender is an apprentice,
        // we need to find supervisors to notify
        if (!recipientId && senderRole === 'apprentice') {
            // If the goal has a specific supervisor assigned, notify them
            if (goalData.approvedBy) {
                recipientId = goalData.approvedBy;
                await createNotification({
                    recipientId,
                    recipientRole: 'supervisor',
                    senderId,
                    senderName,
                    senderRole,
                    type: 'comment',
                    goalId,
                    goalTitle,
                    message: `${senderName} commented on a goal`,
                });
            } else {
                // Otherwise, notify all supervisors
                const supervisors = await getSupervisors();
                const notificationPromises = supervisors.map(supervisor =>
                    createNotification({
                        recipientId: supervisor.id,
                        recipientRole: 'supervisor',
                        senderId,
                        senderName,
                        senderRole,
                        type: 'comment',
                        goalId,
                        goalTitle,
                        message: `${senderName} commented on a goal`,
                    })
                );

                await Promise.all(notificationPromises);
            }

            return "Notifications sent to supervisors";
        } else if (recipientId) {
            // Create notification for a specific recipient
            return await createNotification({
                recipientId,
                recipientRole,
                senderId,
                senderName,
                senderRole,
                type: 'comment',
                goalId,
                goalTitle,
                message: `${senderName} commented on a goal`,
            });
        }
    } catch (error) {
        console.error('Error creating comment notification:', error);
        throw error;
    }
};

/**
 * Create a goal submission notification for all supervisors
 *
 * @param {Object} params - Parameters for creating a submission notification
 * @param {string} params.goalId - ID of the goal
 * @param {string} params.apprenticeId - ID of the apprentice
 * @param {string} params.apprenticeName - Name of the apprentice
 * @returns {Promise<string>} - Result message
 */
export const createSubmissionNotification = async ({
                                                       goalId,
                                                       apprenticeId,
                                                       apprenticeName
                                                   }) => {
    try {
        // Get goal details
        const goalDoc = await getDoc(doc(db, 'goals', goalId));
        if (!goalDoc.exists()) {
            throw new Error('Goal not found');
        }

        const goalData = goalDoc.data();
        const goalTitle = goalData.title;

        // Get all supervisors
        const supervisors = await getSupervisors();

        // Create a notification for each supervisor
        const notificationPromises = supervisors.map(supervisor =>
            createNotification({
                recipientId: supervisor.id,
                recipientRole: 'supervisor',
                senderId: apprenticeId,
                senderName: apprenticeName,
                senderRole: 'apprentice',
                type: 'submission',
                goalId,
                goalTitle,
                message: `${apprenticeName} submitted a goal for review`,
            })
        );

        await Promise.all(notificationPromises);
        return "Notifications sent to all supervisors";
    } catch (error) {
        console.error('Error creating submission notification:', error);
        throw error;
    }
};

/**
 * Create a goal approval notification
 *
 * @param {Object} params - Parameters for creating an approval notification
 * @param {string} params.goalId - ID of the goal
 * @param {string} params.supervisorId - ID of the supervisor
 * @param {string} params.supervisorName - Name of the supervisor
 * @param {string} params.apprenticeId - ID of the apprentice
 * @param {number} params.rating - Rating given to the goal
 * @returns {Promise<string>} - ID of the created notification
 */
export const createApprovalNotification = async ({
                                                     goalId,
                                                     supervisorId,
                                                     supervisorName,
                                                     apprenticeId,
                                                     rating
                                                 }) => {
    try {
        // Get goal details
        const goalDoc = await getDoc(doc(db, 'goals', goalId));
        if (!goalDoc.exists()) {
            throw new Error('Goal not found');
        }

        const goalData = goalDoc.data();
        const goalTitle = goalData.title;

        // Create notification
        return await createNotification({
            recipientId: apprenticeId,
            recipientRole: 'apprentice',
            senderId: supervisorId,
            senderName: supervisorName,
            senderRole: 'supervisor',
            type: 'approval',
            goalId,
            goalTitle,
            message: `Your goal was approved with ${rating} stars`,
        });
    } catch (error) {
        console.error('Error creating approval notification:', error);
        throw error;
    }
};

/**
 * Create a goal reminder notification for users with fewer than 3 goals
 *
 * @param {Object} params - Parameters for creating a goal reminder notification
 * @param {string} params.userId - ID of the user
 * @param {string} params.userName - Name of the user
 * @param {number} params.currentGoalCount - Current number of goals the user has
 * @returns {Promise<string>} - ID of the created notification
 */
export const createGoalReminderNotification = async ({
                                                         userId,
                                                         userName,
                                                         currentGoalCount
                                                     }) => {
    try {
        const goalsNeeded = 3 - currentGoalCount;
        const message = goalsNeeded === 1
            ? `You're almost there, ${userName}! Just 1 more goal to reach the recommended minimum.`
            : `Welcome back, ${userName}! Don't forget to create ${goalsNeeded} more goals to reach the recommended minimum.`;

        // Create notification for the user
        return await createNotification({
            recipientId: userId,
            recipientRole: 'apprentice',
            senderId: 'system',
            senderName: 'ZielManager System',
            senderRole: 'system',
            type: 'goal_reminder',
            goalId: null, // No specific goal associated
            goalTitle: null,
            message: message,
            actionLink: '/goals/create' // Direct to goal creation page
        });
    } catch (error) {
        console.error('Error creating goal reminder notification:', error);
        throw error;
    }
};

/**
 * Create a supervisor request notification that will be sent to all existing supervisors
 *
 * @param {Object} params - Parameters for creating a supervisor request notification
 * @param {string} params.requesterId - ID of the user requesting supervisor status
 * @param {string} params.requesterName - Name of the user requesting supervisor status
 * @param {string} params.requesterEmail - Email of the user requesting supervisor status
 * @returns {Promise<Array>} - Array of created notification IDs
 */
export const createSupervisorRequestNotification = async ({
                                                              requesterId,
                                                              requesterName,
                                                              requesterEmail
                                                          }) => {
    try {
        // Get all supervisors
        const supervisors = await getSupervisors();

        if (supervisors.length === 0) {
            console.warn('No supervisors found to notify about supervisor request');
            return [];
        }

        // Create a notification for each supervisor
        const notificationPromises = supervisors.map(supervisor =>
            createNotification({
                recipientId: supervisor.id,
                recipientRole: 'supervisor',
                senderId: requesterId,
                senderName: requesterName,
                senderRole: 'apprentice',
                type: 'supervisor_request',
                goalId: null,
                goalTitle: null,
                message: `${requesterName} (${requesterEmail}) has requested supervisor access`,
                // Additional data needed for processing the request
                additionalData: {
                    requesterId,
                    requesterName,
                    requesterEmail,
                    requestStatus: 'pending'
                }
            })
        );

        const results = await Promise.all(notificationPromises);
        return results;
    } catch (error) {
        console.error('Error creating supervisor request notifications:', error);
        throw error;
    }
};

/**
 * Process a supervisor request (approve or deny)
 *
 * @param {Object} params - Parameters for processing the request
 * @param {string} params.notificationId - ID of the notification
 * @param {string} params.requesterId - ID of the user requesting supervisor status
 * @param {string} params.action - Action to take (approve or deny)
 * @param {string} params.processedBy - ID of the supervisor processing the request
 * @param {string} params.processorName - Name of the supervisor processing the request
 * @returns {Promise<Object>} - Result of the action
 */
export const processSupervisorRequest = async ({
                                                   notificationId,
                                                   requesterId,
                                                   action,
                                                   processedBy,
                                                   processorName
                                               }) => {
    try {
        console.log("Processing supervisor request", { notificationId, requesterId, action, processedBy });

        // Step 1: Mark the notification as read and processed
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true,
            'additionalData.requestStatus': action === 'approve' ? 'approved' : 'denied',
            'additionalData.processedBy': processedBy,
            'additionalData.processedAt': serverTimestamp()
        });

        console.log("Updated notification status");

        // Step 2: Update the user's role if approved
        if (action === 'approve') {
            const userRef = doc(db, 'users', requesterId);
            await updateDoc(userRef, {
                role: 'supervisor',
                supervisorRequestStatus: 'approved',
                roleUpdatedAt: serverTimestamp(),
                roleUpdatedBy: processedBy
            });

            console.log("Updated user role to supervisor");
        } else {
            // If denied, just update the request status
            const userRef = doc(db, 'users', requesterId);
            await updateDoc(userRef, {
                supervisorRequestStatus: 'denied',
                supervisorRequestProcessedAt: serverTimestamp(),
                supervisorRequestProcessedBy: processedBy
            });

            console.log("Updated user request status to denied");
        }

        // Step 3: Send a notification to the requester
        await addDoc(collection(db, 'notifications'), {
            recipientId: requesterId,
            recipientRole: action === 'approve' ? 'supervisor' : 'apprentice',
            senderId: processedBy,
            senderName: processorName,
            senderRole: 'supervisor',
            type: 'supervisor_request_result',
            goalId: null,
            goalTitle: null,
            message: action === 'approve'
                ? `Your request for supervisor access has been approved by ${processorName}`
                : `Your request for supervisor access has been denied by ${processorName}`,
            read: false,
            createdAt: serverTimestamp()
        });

        console.log("Sent result notification to requester");

        return {
            success: true,
            action,
            message: action === 'approve' ? "User promoted to supervisor" : "Request denied"
        };
    } catch (error) {
        console.error('Error processing supervisor request:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
};

export default {
    createNotification,
    createCommentNotification,
    createApprovalNotification,
    createSubmissionNotification,
    createGoalReminderNotification,
    createSupervisorRequestNotification,
    processSupervisorRequest,
    getSupervisors
};