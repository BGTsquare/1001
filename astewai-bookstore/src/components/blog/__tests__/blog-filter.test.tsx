import { render, screen, fireEvent } from '@testing-library/react';
import { BlogFilter } from '../blog-filter';

const mockCategories = ['Technology', 'Reviews', 'Tips'];
const mockTags = ['digital', 'reading', 'books', 'tips'];

describe('BlogFilter', () => {
  const defaultProps = {
    categories: mockCategories,
    tags: mockTags,
    selectedCategory: undefined,
    selectedTags: [],
    onCategoryChange: jest.fn(),
    onTagsChange: jest.fn(),
    onClearFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders categories and tags correctly', () => {
    render(<BlogFilter {...defaultProps} />);

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    
    mockCategories.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
    
    mockTags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('calls onCategoryChange when category is clicked', () => {
    render(<BlogFilter {...defaultProps} />);

    fireEvent.click(screen.getByText('Technology'));
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('Technology');
  });

  it('calls onTagsChange when tag is clicked', () => {
    render(<BlogFilter {...defaultProps} />);

    fireEvent.click(screen.getByText('digital'));
    expect(defaultProps.onTagsChange).toHaveBeenCalledWith(['digital']);
  });

  it('shows selected category with correct styling', () => {
    const propsWithSelectedCategory = {
      ...defaultProps,
      selectedCategory: 'Technology'
    };

    render(<BlogFilter {...propsWithSelectedCategory} />);

    const technologyBadge = screen.getByText('Technology');
    expect(technologyBadge).toHaveClass('bg-primary');
  });

  it('shows selected tags with correct styling', () => {
    const propsWithSelectedTags = {
      ...defaultProps,
      selectedTags: ['digital', 'reading']
    };

    render(<BlogFilter {...propsWithSelectedTags} />);

    const digitalBadge = screen.getByText('digital');
    const readingBadge = screen.getByText('reading');
    
    expect(digitalBadge).toHaveClass('bg-primary');
    expect(readingBadge).toHaveClass('bg-primary');
  });

  it('shows active filters section when filters are applied', () => {
    const propsWithFilters = {
      ...defaultProps,
      selectedCategory: 'Technology',
      selectedTags: ['digital']
    };

    render(<BlogFilter {...propsWithFilters} />);

    expect(screen.getByText('Active Filters')).toBeInTheDocument();
    expect(screen.getByText('Category: Technology')).toBeInTheDocument();
    expect(screen.getByText('Tag: digital')).toBeInTheDocument();
  });

  it('shows clear all button when filters are active', () => {
    const propsWithFilters = {
      ...defaultProps,
      selectedCategory: 'Technology',
      selectedTags: ['digital']
    };

    render(<BlogFilter {...propsWithFilters} />);

    const clearButton = screen.getByText('Clear all');
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(defaultProps.onClearFilters).toHaveBeenCalled();
  });

  it('removes tag when clicked in selected tags', () => {
    const propsWithSelectedTags = {
      ...defaultProps,
      selectedTags: ['digital', 'reading']
    };

    render(<BlogFilter {...propsWithSelectedTags} />);

    fireEvent.click(screen.getByText('digital'));
    expect(defaultProps.onTagsChange).toHaveBeenCalledWith(['reading']);
  });
});