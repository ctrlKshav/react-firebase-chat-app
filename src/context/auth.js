import React from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { loginWithGoogle } from '../services/firebase';

const AuthContext = React.createContext();

function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Clean up subscription
        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            await loginWithGoogle();
            // No need to setUser here as onAuthStateChanged will handle it
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const logout = async () => {
        const auth = getAuth();
        try {
            await auth.signOut();
            // No need to setUser(null) here as onAuthStateChanged will handle it
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const value = { user, login, logout, loading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export { AuthContext, AuthProvider, useAuth };