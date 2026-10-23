import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock('@/lib/api/auth', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submission', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await user.click(screen.getByRole('button', { name: /Sign In/i }));
    
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    const toggleButton = screen.getByRole('button', { name: /Show password/i });
    await user.click(toggleButton);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Hide password/i })).toBeInTheDocument();
  });

  it('handles successful login and redirects', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      user: {
        id: 'u-123',
        email: 'aarav@example.com',
        role: 'user',
        email_verified: true,
        full_name: 'Aarav Sharma',
      }
    } as any);

    const user = userEvent.setup();
    render(<LoginPage />);
    
    await user.type(screen.getByLabelText(/Email Address/i), 'aarav@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'password123');
    
    await user.click(screen.getByRole('button', { name: /Sign In/i }));
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    
    const authState = useAuthStore.getState();
    expect(authState.user?.email).toBe('aarav@example.com');
    expect(authState.accessToken).toBe('test_access_token');
  });

  it('shows unverified email alert and prompts verification', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          detail: 'EMAIL_NOT_VERIFIED: Please verify your email address before signing in.'
        }
      }
    });

    const user = userEvent.setup();
    render(<LoginPage />);
    
    await user.type(screen.getByLabelText(/Email Address/i), 'pending@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));
    
    expect(await screen.findByText(/Please verify your email address before signing in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enter Code Now/i })).toBeInTheDocument();
  });
});
