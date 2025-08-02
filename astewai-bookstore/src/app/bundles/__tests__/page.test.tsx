import { render, screen } from '@testing-library/react';
import BundlesPage from '../page';
import { QueryProvider } from '@/components/providers';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/bundles',
}));

// Mock bundle components
vi.mock('@/components/bundles/BundleGrid', () => ({
  BundleGrid: () => <div data-testid="bundle-grid">Bundle Grid</div>,
}));

// Mock repository
vi.mock('@/lib/repositories/bundleRepository', () => ({
  getBundles: vi.fn().mockResolvedValue([]),
}));

const renderBundlesPage = async () => {
  const BundlesPageComponent = await BundlesPage();
  return render(
    <QueryProvider>
      {BundlesPageComponent}
    </QueryProvider>
  );
};

describe('Bundles Page', () => {
  it('renders the page title and description', async () => {
    await renderBundlesPage();
    
    expect(screen.getByText('Book Bundles')).toBeInTheDocument();
    expect(screen.getByText('Save more with our carefully curated book collections')).toBeInTheDocument();
  });

  it('renders bundle category stats', async () => {
    await renderBundlesPage();
    
    expect(screen.getByText('Featured Bundles')).toBeInTheDocument();
    expect(screen.getByText('Popular Bundles')).toBeInTheDocument();
    expect(screen.getByText('Total Bundles')).toBeInTheDocument();
    
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders category filter badges', async () => {
    await renderBundlesPage();
    
    expect(screen.getByText('All Bundles')).toBeInTheDocument();
    expect(screen.getByText('Fiction')).toBeInTheDocument();
    expect(screen.getByText('Non-Fiction')).toBeInTheDocument();
    expect(screen.getByText('Science Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
    expect(screen.getByText('Romance')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Self-Help')).toBeInTheDocument();
  });

  it('renders the bundle grid', async () => {
    await renderBundlesPage();
    
    expect(screen.getByTestId('bundle-grid')).toBeInTheDocument();
  });

  it('has proper layout structure', async () => {
    await renderBundlesPage();
    
    const container = screen.getByText('Book Bundles').closest('.container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('mx-auto', 'px-4', 'py-8');
  });
});