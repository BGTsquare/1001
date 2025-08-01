import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../progress-bar'

describe('ProgressBar', () => {
  it('renders with correct progress value', () => {
    render(<ProgressBar progress={75} />)
    
    expect(screen.getByText('75% complete')).toBeInTheDocument()
  })

  it('clamps progress values to 0-100 range', () => {
    const { rerender } = render(<ProgressBar progress={-10} />)
    expect(screen.getByText('0% complete')).toBeInTheDocument()

    rerender(<ProgressBar progress={150} />)
    expect(screen.getByText('100% complete')).toBeInTheDocument()
  })

  it('shows finished state when progress is 100', () => {
    render(<ProgressBar progress={100} />)
    
    expect(screen.getByText('100% complete')).toBeInTheDocument()
    expect(screen.getByText('Finished')).toBeInTheDocument()
  })

  it('hides percentage when showPercentage is false', () => {
    render(<ProgressBar progress={50} showPercentage={false} />)
    
    expect(screen.queryByText('50% complete')).not.toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { container, rerender } = render(<ProgressBar progress={50} size="sm" />)
    expect(container.querySelector('[role="progressbar"]')).toHaveClass('h-2')

    rerender(<ProgressBar progress={50} size="md" />)
    expect(container.querySelector('[role="progressbar"]')).toHaveClass('h-3')

    rerender(<ProgressBar progress={50} size="lg" />)
    expect(container.querySelector('[role="progressbar"]')).toHaveClass('h-4')
  })

  it('applies variant classes correctly', () => {
    const { container, rerender } = render(<ProgressBar progress={50} variant="success" />)
    expect(container.querySelector('[role="progressbar"]')).toHaveClass('[&>div]:bg-green-500')

    rerender(<ProgressBar progress={50} variant="warning" />)
    expect(container.querySelector('[role="progressbar"]')).toHaveClass('[&>div]:bg-yellow-500')
  })
})