// simple frontend tests for Button
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

test('button text is on the screen', () => {
  render(<Button>Sign In</Button>);

  const button = screen.getByText('Sign In');
  expect(button).toBeInTheDocument();
});

test('button shows the correct label', () => {
  render(<Button>Buy Token</Button>);

  expect(screen.getByText('Buy Token')).toBeInTheDocument();
  expect(screen.getByText('Buy Token')).toHaveTextContent('Buy Token');
});

test('disabled button is on the screen', () => {
  render(<Button disabled>Save</Button>);

  const button = screen.getByText('Save');
  expect(button).toBeInTheDocument();
  expect(button).toBeDisabled();
});
