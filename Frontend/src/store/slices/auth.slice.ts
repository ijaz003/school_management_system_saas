import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { tokenStorage } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roleId: string | null;
  tenantId: string | null;
  permissions: string[];
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.initialized = true;
    },
    setInitialized(state) {
      state.initialized = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
      tokenStorage.remove();
    },
  },
});

export const { setUser, setInitialized, logout } = authSlice.actions;
export default authSlice.reducer;
