import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Landing } from './app/Landing'
import { appStore } from './store'
import { loadSandbox } from './test/sandbox'

describe('Landing', () => {
  it('renders the role switcher from the sandbox', () => {
    appStore.getState().load(loadSandbox())
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Summit 3.0 Front Door')
    expect(screen.getByRole('heading', { name: 'Open a mentor' })).toBeInTheDocument()
  })
})
