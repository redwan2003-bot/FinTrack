import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { supabase } from '../lib/supabase';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    vi.clearAllMocks();
  });

  it('login calls supabase and updates state', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    });

    await useAuthStore.getState().login('test@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('logout resets state and clears storage', async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '123' } });
    
    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('loginWithGoogle calls supabase with correct redirect', async () => {
    await useAuthStore.getState().loginWithGoogle();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/FinTrack/')
      }
    });
  });
});
