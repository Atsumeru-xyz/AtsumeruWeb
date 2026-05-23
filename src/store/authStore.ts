import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export interface AuthUserInfo {
    id: number;
    userName: string;
    isAdmin: boolean;
    roles: string[];
    authorities: string[];
}

interface AuthState {
    token: string | null;
    username: string | null;
    user: AuthUserInfo | null;
    setAuth: (username: string, token: string) => void;
    setUser: (user: AuthUserInfo) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
    isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            username: null,
            user: null,
            setAuth: (username, token) => set({username, token}),
            setUser: (user) => set({user}),
            logout: () => set({username: null, token: null, user: null}),
            isAuthenticated: () => !!get().token,
            isAdmin: () => !!get().user?.isAdmin,
        }),
        {
            name: 'atsumeru-auth'
        }
    )
);
