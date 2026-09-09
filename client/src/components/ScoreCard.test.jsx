import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreCard from './ScoreCard.jsx';

/** The colour class applied to the score number. */
function scoreColour(value) {
  const { container } = render(<ScoreCard label="Overall" score={value} />);
  const el = container.querySelector('span.text-3xl');
  const cls = el.className;
  if (cls.includes('text-red')) return 'red';
  if (cls.includes('text-yellow')) return 'yellow';
  if (cls.includes('text-green')) return 'green';
  return 'unknown';
}

describe('ScoreCard', () => {
  it('renders the label and the score to one decimal place', () => {
    render(<ScoreCard label="Readability" score={7} />);

    expect(screen.getByText('Readability')).toBeInTheDocument();
    expect(screen.getByText('7.0')).toBeInTheDocument();
    expect(screen.getByText('out of 10')).toBeInTheDocument();
  });

  // The documented rule: red below 5, yellow 5-7, green above 7.
  it.each([
    [0, 'red'],
    [4.9, 'red'],
    [5, 'yellow'],
    [7, 'yellow'],
    [7.1, 'green'],
    [10, 'green'],
  ])('colours a score of %s as %s', (value, expected) => {
    expect(scoreColour(value)).toBe(expected);
  });

  it('clamps out-of-range values into 0-10', () => {
    render(<ScoreCard label="Overall" score={42} />);
    expect(screen.getByText('10.0')).toBeInTheDocument();
  });

  it('treats a missing score as zero rather than rendering NaN', () => {
    render(<ScoreCard label="Security" score={undefined} />);

    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('sizes the progress bar to the score', () => {
    const { container } = render(<ScoreCard label="Overall" score={6} />);
    const bar = container.querySelector('div[style]');

    expect(bar).toHaveStyle({ width: '60%' });
  });
});
