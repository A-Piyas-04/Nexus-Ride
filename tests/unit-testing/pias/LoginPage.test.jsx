// simple frontend tests for Login page texts and inputs
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/pages/LoginPage';

// fake auth so LoginPage can render without real backend
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    login: vi.fn(),
    driverLogin: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

test('welcome text is on the screen', () => {
  renderLogin();

  expect(screen.getByText('Welcome Back')).toBeInTheDocument();
});

test('sign in button is on the screen', () => {
  renderLogin();

  expect(screen.getByText('Sign In')).toBeInTheDocument();
});

test('email input is on the screen', () => {
  renderLogin();

  const emailInput = screen.getByPlaceholderText('name@iut-dhaka.edu');
  expect(emailInput).toBeInTheDocument();
});

test('email input has typed value', async () => {
  const user = userEvent.setup();
  renderLogin();

  const emailInput = screen.getByPlaceholderText('name@iut-dhaka.edu');
  await user.type(emailInput, 'staff@iut-dhaka.edu');

  expect(emailInput).toHaveValue('staff@iut-dhaka.edu');
});

test('password input has typed value', async () => {
  const user = userEvent.setup();
  renderLogin();

  const passwordInput = screen.getByLabelText('Password');
  await user.type(passwordInput, 'password123');

  expect(passwordInput).toHaveValue('password123');
});

test('sign up link text matches', () => {
  renderLogin();

  const link = screen.getByText('Sign up');
  expect(link).toBeInTheDocument();
  expect(link).toHaveTextContent(/Sign up/);
});

test('staff and driver buttons are on the screen', () => {
  renderLogin();

  expect(screen.getByText('Staff')).toBeInTheDocument();
  expect(screen.getByText('Driver')).toBeInTheDocument();
});
