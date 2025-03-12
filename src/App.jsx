import React from 'react';
import { AuthenticatedApp } from './components/AuthenticatedApp';
import { UnauthenticatedApp } from './components/UnauthenticatedApp';
import { useAuth } from './context/auth';
import './App.css';

function App() {
    const { user, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="container">
                <h1>💬 Chat Room</h1>
                <div className="loading-container">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header>
                <h1>💬 Chat Room</h1>
                {user && (
                    <button 
                        className="logout-button" 
                        onClick={logout}
                    >
                        Logout
                    </button>
                )}
            </header>
            {user ? <AuthenticatedApp /> : <UnauthenticatedApp />}
        </div>
    );
}

export default App;