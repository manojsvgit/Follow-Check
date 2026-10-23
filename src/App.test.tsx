import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { followersJson, followingJson, standardZip, zipFile } from './test/fixtures'

const hold = vi.hoisted(() => ({ pending: false }))
vi.mock('./lib/analyze', async (orig) => {
  const real = await orig<typeof import('./lib/analyze')>()
  return { analyzeExport: (f: File) => (hold.pending ? new Promise<never>(() => {}) : real.analyzeExport(f)) }
})

// alice, bob mutual; carol, dave not following back; nobody follows without being followed.
const goodZip = () => standardZip(['alice', 'bob'], ['alice', 'bob', 'carol', 'dave'])

async function uploadAndAnalyze(file: File = goodZip()) {
  const user = userEvent.setup()
  render(<App />)
  await user.upload(screen.getByLabelText(/drop your instagram export/i, { selector: 'input' }), file)
  await user.click(screen.getByRole('button', { name: /analyze export/i }))
  return user
}

beforeEach(() => { hold.pending = false })
afterEach(() => vi.restoreAllMocks())

describe('upload', () => {
  it('shows filename and size after choosing a ZIP', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.upload(screen.getByLabelText(/drop your instagram export/i, { selector: 'input' }), goodZip())
    expect(screen.getByTestId('selected-file')).toHaveTextContent('export.zip')
    expect(screen.getByRole('button', { name: /analyze export/i })).toBeEnabled()
  })

  it('rejects a non-ZIP file with feedback and keeps submit disabled', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<App />)
    await user.upload(screen.getByLabelText(/drop your instagram export/i, { selector: 'input' }), new File(['x'], 'notes.txt'))
    expect(screen.getByRole('alert')).toHaveTextContent(/not a ZIP/i)
    expect(screen.getByRole('button', { name: /analyze export/i })).toBeDisabled()
  })

  it('shows a pending state with a working cancel', async () => {
    hold.pending = true
    const user = await uploadAndAnalyze()
    expect(await screen.findByRole('status')).toHaveTextContent(/validating export/i)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(await screen.findByRole('button', { name: /analyze export/i })).toBeInTheDocument()
  })
})

describe('results', () => {
  it('renders summary cards and the default list', async () => {
    await uploadAndAnalyze()
    expect(await screen.findByRole('heading', { name: /your results/i })).toBeInTheDocument()
    expect(screen.getByText('@carol')).toBeInTheDocument()
    expect(screen.getByText('@dave')).toBeInTheDocument()
    expect(screen.queryByText('@alice')).not.toBeInTheDocument()
    expect(screen.getByText(/not live instagram data/i)).toBeInTheDocument()
  })

  it('profile links open safely in a new tab', async () => {
    await uploadAndAnalyze()
    const link = await screen.findByRole('link', { name: /open profile of carol/i })
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/carol/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('switches tabs', async () => {
    const user = await uploadAndAnalyze()
    await user.click(await screen.findByRole('tab', { name: /mutual follows/i }))
    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.queryByText('@carol')).not.toBeInTheDocument()
  })

  it('filters by search text', async () => {
    const user = await uploadAndAnalyze()
    await user.type(await screen.findByLabelText(/search accounts/i), 'dav')
    expect(screen.getByText('@dave')).toBeInTheDocument()
    expect(screen.queryByText('@carol')).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText(/search accounts/i))
    await user.type(screen.getByLabelText(/search accounts/i), 'zzz')
    expect(screen.getByText(/no accounts match/i)).toBeInTheDocument()
  })

  it('shows an empty state for an empty category', async () => {
    const user = await uploadAndAnalyze()
    await user.click(await screen.findByRole('tab', { name: /followers you don't follow back/i }))
    expect(screen.getByText(/you follow everyone who follows you/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download csv/i })).toBeDisabled()
  })

  it('sorts Z to A when toggled', async () => {
    const user = await uploadAndAnalyze()
    await user.click(await screen.findByRole('button', { name: /sort/i }))
    const names = within(screen.getByRole('tabpanel')).getAllByText(/^@/).map((e) => e.textContent)
    expect(names).toEqual(['@dave', '@carol'])
  })

  it('downloads the active list as CSV and revokes the URL', async () => {
    const create = vi.fn(() => 'blob:csv')
    const revoke = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = await uploadAndAnalyze()
    await user.click(await screen.findByRole('button', { name: /download csv/i }))
    expect(create).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:csv')
    vi.unstubAllGlobals()
  })

  it('reset clears results and returns to upload', async () => {
    const user = await uploadAndAnalyze()
    await user.click(await screen.findByRole('button', { name: /analyze another export/i }))
    expect(await screen.findByRole('button', { name: /analyze export/i })).toBeDisabled()
    expect(screen.queryByText('@carol')).not.toBeInTheDocument()
  })
})

describe('errors', () => {
  it('shows a friendly message when the following list is missing', async () => {
    await uploadAndAnalyze(zipFile({ 'followers_1.json': followersJson('a') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not find your following list/i)
  })

  it('shows a message for a damaged JSON file and lets the user retry', async () => {
    const user = await uploadAndAnalyze(zipFile({ 'followers_1.json': '{oops', 'following.json': followingJson('a') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/damaged/i)
    await user.click(screen.getByRole('button', { name: /try another file/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /analyze export/i })).toBeInTheDocument())
  })

  it('shows a message for a ZIP that is not really a ZIP', async () => {
    await uploadAndAnalyze(new File(['not a zip at all'], 'fake.zip'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a ZIP/i)
  })
})

describe('theme', () => {
  it('toggles between dark and light and sets data-theme', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(screen.getByRole('button', { name: /switch to light theme/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
