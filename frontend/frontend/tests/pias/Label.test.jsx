// simple frontend tests for Label
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/Label';

test('email label is on the screen', () => {
  render(<Label>Email</Label>);

  expect(screen.getByText('Email')).toBeInTheDocument();
});

test('password label text matches', () => {
  render(<Label>Password</Label>);

  const label = screen.getByText('Password');
  expect(label).toBeInTheDocument();
  expect(label).toHaveTextContent(/Password/);
});
