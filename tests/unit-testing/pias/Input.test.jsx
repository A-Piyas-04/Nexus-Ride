// simple frontend tests for Input
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

test('email input is on the screen', () => {
  render(<Input placeholder="name@iut-dhaka.edu" />);

  const input = screen.getByPlaceholderText('name@iut-dhaka.edu');
  expect(input).toBeInTheDocument();
});

test('input has the typed value', async () => {
  const user = userEvent.setup();
  render(<Input placeholder="Email" />);

  const input = screen.getByPlaceholderText('Email');
  await user.type(input, 'user@iut-dhaka.edu');

  expect(input).toHaveValue('user@iut-dhaka.edu');
});

test('password input type matches password', () => {
  render(<Input type="password" placeholder="Password" />);

  const input = screen.getByPlaceholderText('Password');
  expect(input).toBeInTheDocument();
  expect(input.type).toMatch(/password/);
});
