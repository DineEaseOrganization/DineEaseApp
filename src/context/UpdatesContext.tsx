// src/context/UpdatesContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { updatesService } from '../services/api';
import { useAuth } from './AuthContext';

interface UpdatesContextValue {
    unreadCount: number;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    refreshUnreadCount: () => Promise<void>;
}

const UpdatesContext = createContext<UpdatesContextValue>({
    unreadCount: 0,
    setUnreadCount: () => {},
    refreshUnreadCount: async () => {},
});

export const UpdatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refreshUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        try {
            const count = await updatesService.getUnreadCount();
            setUnreadCount(count);
        } catch {
            // silently ignore — badge will just stay as-is
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        // Fetch immediately on login
        refreshUnreadCount();

        // Poll every 60 seconds to keep badge fresh
        intervalRef.current = setInterval(refreshUnreadCount, 60_000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user, refreshUnreadCount]);

    return (
        <UpdatesContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount }}>
            {children}
        </UpdatesContext.Provider>
    );
};

export const useUpdates = (): UpdatesContextValue => useContext(UpdatesContext);
