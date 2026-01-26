// App.tsx
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
    return (
        <AuthProvider>
            <FavoritesProvider>
                <AppNavigator />
            </FavoritesProvider>
        </AuthProvider>
    );
};

export default App;