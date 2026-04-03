import {create} from 'zustand';
import {persist} from 'zustand/middleware';

interface AuthState {
    token: string | null;
    username: string | null;
    setAuth: (username: string, token: string) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            username: null,
            setAuth: (username, token) => set({username, token}),
            logout: () => set({username: null, token: null}),
            isAuthenticated: () => !!get().token,
        }),
        {
            name: 'atsumeru-auth'
        }
    )
);