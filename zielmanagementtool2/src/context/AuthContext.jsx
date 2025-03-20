import { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
// Import the goal checking service
import { checkUserGoals } from '../services/goalCheckService';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    async function register(email, password, firstName, lastName) {
        // Check if email is from Cognizant
         if (!email.endsWith('@cognizant.com')) {
             throw new Error('Registration requires a Cognizant email address');
         }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            firstName,
            lastName,
            email,
            role: 'apprentice', // Default role
            createdAt: new Date()
        });

        // Send verification email
        await sendEmailVerification(userCredential.user);

        return { user: userCredential.user };
    }

    async function login(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Force reload user to get latest emailVerified status
        await userCredential.user.reload();
        setIsEmailVerified(userCredential.user.emailVerified);

        // Get user profile
        const profile = await fetchUserProfile(userCredential.user.uid);

        // Check if user has created at least 3 goals and send notification if needed
        if (profile && userCredential.user.emailVerified) {
            try {
                await checkUserGoals(userCredential.user, profile);
            } catch (error) {
                console.error("Error checking goals:", error);
            }
        }

        return userCredential.user;
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    function logout() {
        return signOut(auth);
    }

    function resendVerificationEmail() {
        if (currentUser && !currentUser.emailVerified) {
            return sendEmailVerification(currentUser);
        }
        throw new Error("No user to send verification email to");
    }

    async function fetchUserProfile(userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Force reload to get latest emailVerified status
                await user.reload();
                setCurrentUser(user);
                setIsEmailVerified(user.emailVerified);

                const profile = await fetchUserProfile(user.uid);
                setUserProfile(profile);

                // If user's email is verified, check their goals and send notification if needed
                if (user.emailVerified && profile) {
                    try {
                        await checkUserGoals(user, profile);
                    } catch (error) {
                        console.error("Error checking goals on auth state change:", error);
                    }
                }
            } else {
                setCurrentUser(null);
                setUserProfile(null);
                setIsEmailVerified(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        isEmailVerified,
        register,
        login,
        resetPassword,
        logout,
        resendVerificationEmail,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}