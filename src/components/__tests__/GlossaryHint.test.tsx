import { render, screen } from '@testing-library/react'
import { GlossaryHint } from '../GlossaryHint'

describe('GlossaryHint', () => {
  it('renders term with tooltip when definition exists', () => {
    render(<GlossaryHint term="RAG" />)
    
    const element = screen.getByText('RAG')
    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('border-b', 'border-dotted')
  })

  it('renders children with tooltip when definition exists', () => {
    render(<GlossaryHint term="RAG">Retrieval-Augmented Generation</GlossaryHint>)
    
    const element = screen.getByText('Retrieval-Augmented Generation')
    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('border-b', 'border-dotted')
  })

  it('renders term without tooltip when definition does not exist', () => {
    render(<GlossaryHint term="NonExistentTerm" />)
    
    const element = screen.getByText('NonExistentTerm')
    expect(element).toBeInTheDocument()
    expect(element).not.toHaveClass('border-b', 'border-dotted')
  })

  it('renders children without tooltip when definition does not exist', () => {
    render(<GlossaryHint term="NonExistentTerm">Custom Text</GlossaryHint>)
    
    const element = screen.getByText('Custom Text')
    expect(element).toBeInTheDocument()
    expect(element).not.toHaveClass('border-b', 'border-dotted')
  })

  it('applies custom className', () => {
    render(<GlossaryHint term="RAG" className="custom-class" />)
    
    const element = screen.getByText('RAG')
    expect(element).toHaveClass('custom-class')
  })
})
