// simple frontend tests for Signup page
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import SignupPage from '@/pages/SignupPage';

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    signup: vi.fn(),
    login: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

function renderSignup() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>
  );
}

test('create account title is on the screen', () => {
  renderSignup();

  // title text on signup page
  expect(screen.getByText('Create an Account')).toBeInTheDocument();
});

test('sign up button is on the screen', () => {
  renderSignup();

  expect(screen.getByText('Sign Up')).toBeInTheDocument();
});

test('full name input has typed value', async () => {
  const user = userEvent.setup();
  renderSignup();

  const nameInput = screen.getByLabelText(/Full Name/i);
  await user.type(nameInput, 'Test User');

  expect(nameInput).toHaveValue('Test User');
});

test('email placeholder matches iut email', () => {
  renderSignup();

  const emailInput = screen.getByPlaceholderText(/iut-dhaka.edu/i);
  expect(emailInput).toBeInTheDocument();
  expect(emailInput.placeholder).toMatch(/iut-dhaka.edu/);
});
