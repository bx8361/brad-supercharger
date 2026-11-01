const API = 'https://api.frankfurter.dev/v2'

async function request(path, signal) {
  let response
  try {
    response = await fetch(`${API}/${path}`, { signal, cache: 'no-cache' })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('Could not load exchange rates. Check your connection and try Refresh rates.')
  }
  if (!response.ok) throw new Error('Could not load exchange rates. Check your connection and try Refresh rates.')
  return response.json()
}

export async function loadCurrencies(signal) {
  const data = await request('currencies', signal)
  if (!Array.isArray(data) || !data.length || data.some(item => !/^[A-Z]{3}$/.test(item?.iso_code) || typeof item.name !== 'string')) {
    throw new Error('The exchange-rate service returned invalid data.')
  }
  return data.sort((a, b) => a.iso_code.localeCompare(b.iso_code))
}

export async function loadCurrencyRate(from, to, signal) {
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) throw new Error('Choose valid currencies.')
  if (from === to) return { base: from, quote: to, rate: 1, date: null }
  const data = await request(`rate/${from}/${to}`, signal)
  if (data?.base !== from || data?.quote !== to || !Number.isFinite(data?.rate) || data.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data?.date)) {
    throw new Error('The exchange-rate service returned invalid data.')
  }
  return data
}

export function convertCurrency(amount, rate) {
  if (String(amount).trim() === '' || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
    throw new Error('Enter a finite, non-negative amount.')
  }
  const result = Number(amount) * rate
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(result)) throw new Error('The converted amount is out of range.')
  return result
}
