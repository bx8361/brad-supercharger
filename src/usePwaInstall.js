import { useEffect, useRef, useState } from 'react'

export function usePwaInstall() {
  const prompt = useRef(null)
  const [available, setAvailable] = useState(false)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)')
    const beforeInstall = event => {
      event.preventDefault()
      prompt.current = event
      setAvailable(true)
      setError('')
    }
    const afterInstall = () => {
      prompt.current = null
      setAvailable(false)
      setInstalled(true)
    }
    const displayChanged = () => { if (display.matches) afterInstall() }
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', afterInstall)
    display.addEventListener('change', displayChanged)
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', afterInstall)
      display.removeEventListener('change', displayChanged)
    }
  }, [])

  async function install() {
    const event = prompt.current
    if (!event) return
    prompt.current = null
    setAvailable(false)
    setInstalling(true)
    setError('')
    try {
      await event.prompt()
      // An event may only be used once, including when the user dismisses it.
      const { outcome } = await event.userChoice
      if (outcome === 'accepted') setInstalled(true)
    } catch {
      setError('Use the install option in Chrome’s menu to try again.')
    } finally { setInstalling(false) }
  }

  return { available, installed, installing, error, install }
}
