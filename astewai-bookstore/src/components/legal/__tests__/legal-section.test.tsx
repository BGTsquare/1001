import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LegalSection, LegalSubsection, LegalList } from '../legal-section';

describe('LegalSection', () => {
  it('renders section with title and content', () => {
    render(
      <LegalSection id="test-section" title="Test Section">
        <p>Test content</p>
      </LegalSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute('id', 'test-section');
  });

  it('applies custom className', () => {
    render(
      <LegalSection id="test" title="Test" className="custom-class">
        <p>Content</p>
      </LegalSection>
    );

    expect(screen.getByRole('region')).toHaveClass('custom-class');
  });
});

describe('LegalSubsection', () => {
  it('renders subsection with title and content', () => {
    render(
      <LegalSubsection title="Subsection Title">
        <p>Subsection content</p>
      </LegalSubsection>
    );

    expect(screen.getByText('Subsection Title')).toBeInTheDocument();
    expect(screen.getByText('Subsection content')).toBeInTheDocument();
  });
});

describe('LegalList', () => {
  const items = ['Item 1', 'Item 2', 'Item 3'];

  it('renders unordered list by default', () => {
    render(<LegalList items={items} />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    
    items.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('renders ordered list when specified', () => {
    render(<LegalList items={items} ordered />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
  });

  it('renders correct number of list items', () => {
    render(<LegalList items={items} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(items.length);
  });
});