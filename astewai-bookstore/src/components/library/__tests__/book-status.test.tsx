import { render, screen } from '@testing-library/react'
import { BookStatus } from '../book-status'

describe('BookStatus', () => {
  it('renders completed status correctly', () => {
    render(<BookStatus status="completed" />)
    
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('renders pending status correctly', () => {
    render(<BookStatus status="pending" />)
    
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('⏳')).toBeInTheDocument()
  })

  it('renders owned status correctly', () => {
    render(<BookStatus status="owned" progress={0} />)
    
    expect(screen.getByText('Owned')).toBeInTheDocument()
    expect(screen.getByText('📚')).toBeInTheDocument()
  })

  it('renders in progress status for owned books with progress', () => {
    render(<BookStatus status="owned" progress={45} />)
    
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('📖')).toBeInTheDocument()
    expect(screen.getByText('(45%)')).toBeInTheDocument()
  })

  it('does not show progress for completed books', () => {
    render(<BookStatus status="completed" progress={100} />)
    
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByText('(100%)')).not.toBeInTheDocument()
  })

  it('applies small size correctly', () => {
    render(<BookStatus status="owned" size="sm" />)
    
    const badge = screen.getByText('Owned').closest('div')
    expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5')
  })

  it('handles unknown status gracefully', () => {
    // @ts-expect-error Testing invalid status
    render(<BookStatus status="invalid" />)
    
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})