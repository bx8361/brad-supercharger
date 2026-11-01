import { useEffect, useState } from 'react'
import { ArrowLeftRight, Banknote, LandPlot, RefreshCw, Ruler, Scale } from 'lucide-react'
import { getLocale, t } from './i18n.js'
import { convertCurrency, loadCurrencies, loadCurrencyRate } from './currencyOps.js'
import { convertUnit, unitGroups } from './unitOps.js'

// Each converter is one row of single-line fields, so they share a page. Keys are flat (lengthFrom, currencyTo, …) so persistence can allow-list them.
function field(data, kind, key, fallback) { return data[`${kind}${key}`] ?? fallback }

function ConversionRow({ kind, title, icon: Icon, data, setData, options, from, to, result, error, swapLabel, fromLabel, toLabel, CopyAction, extra, children }) {
  const amount = field(data, kind, 'Amount', '1')
  return <section className="conversion-row" aria-labelledby={`${kind}-conversion-title`}>
    <h2 id={`${kind}-conversion-title`} className="conversion-title"><Icon size={15} />{t(title)}</h2>
    <div className="inline-controls conversion-controls">
      <input type="number" min="0" step="any" value={amount} aria-label={t('{name} amount', { name: t(title) })} aria-invalid={!!error} onChange={e => setData({ [`${kind}Amount`]: e.target.value })} />
      <select value={from} aria-label={t(fromLabel)} onChange={e => setData({ [`${kind}From`]: e.target.value })}>{options}</select>
      <button className="text-action" onClick={() => setData({ [`${kind}From`]: to, [`${kind}To`]: from })} aria-label={t(swapLabel)} title={t(swapLabel)}><ArrowLeftRight size={15} /></button>
      <select value={to} aria-label={t(toLabel)} onChange={e => setData({ [`${kind}To`]: e.target.value })}>{options}</select>
      <span className="conversion-equals" aria-hidden="true">=</span>
      <input className="conversion-result" readOnly value={result} aria-label={t('{name} result', { name: t(title) })} placeholder="—" onFocus={e => e.target.select()} />
      <CopyAction value={result} />
      {extra}
    </div>
    {error && <p className="error-note" role="alert">{t(error)}</p>}
    {children}
  </section>
}

function UnitRow({ kind, title, icon, defaults, data, setData, CopyAction }) {
  const from = field(data, kind, 'From', defaults[0])
  const to = field(data, kind, 'To', defaults[1])
  let result = ''
  let error = ''
  try {
    const value = convertUnit(field(data, kind, 'Amount', '1'), kind, from, to)
    const symbol = unitGroups[kind].find(unit => unit.id === to).symbol ?? to
    result = `${new Intl.NumberFormat(getLocale(), { maximumSignificantDigits: 12 }).format(value)} ${symbol}`
  } catch (e) { error = e.message }
  const options = unitGroups[kind].map(unit => {
    const name = t(unit.name), symbol = unit.symbol ?? unit.id
    return <option key={unit.id} value={unit.id}>{name === symbol ? name : `${name} (${symbol})`}</option>
  })
  return <ConversionRow {...{ kind, title, icon, data, setData, options, from, to, result, error, CopyAction }} swapLabel="Swap units" fromLabel="From unit" toLabel="To unit" />
}

function CurrencyRow({ data, setData, CopyAction }) {
  const from = field(data, 'currency', 'From', 'USD')
  const to = field(data, 'currency', 'To', 'TWD')
  const [currencies, setCurrencies] = useState([])
  const [currencyError, setCurrencyError] = useState('')
  const [rateState, setRateState] = useState({})
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setCurrencyError('')
    loadCurrencies(controller.signal).then(items => {
      if (!controller.signal.aborted) setCurrencies(items)
    }).catch(() => {
      if (!controller.signal.aborted) setCurrencyError('Could not load currencies. Check your connection and try Refresh rates.')
    })
    return () => controller.abort()
  }, [refresh])

  useEffect(() => {
    const controller = new AbortController()
    setRateState({})
    loadCurrencyRate(from, to, controller.signal).then(rate => {
      if (!controller.signal.aborted) setRateState({ from, to, refresh, rate })
    }).catch(error => {
      if (!controller.signal.aborted) setRateState({ from, to, refresh, error: error.message })
    })
    return () => controller.abort()
  }, [from, to, refresh])

  // Hide the previous pair immediately, including the render before effect cleanup.
  const current = rateState.from === from && rateState.to === to && rateState.refresh === refresh
  const rate = current ? rateState.rate : null
  let result = ''
  let error = current ? rateState.error : ''
  try {
    const value = convertCurrency(field(data, 'currency', 'Amount', '1'), rate?.rate ?? 1)
    if (rate) result = new Intl.NumberFormat(getLocale(), { style: 'currency', currency: to, currencyDisplay: 'code' }).format(value)
  } catch (e) { error = e.message }

  const names = new Map(currencies.map(item => [item.iso_code, item.name]))
  const options = [...new Set([from, to, ...currencies.map(item => item.iso_code)])].sort()
    .map(code => <option key={code} value={code}>{code}{names.has(code) ? ` — ${names.get(code)}` : ''}</option>)
  const refreshButton = <button className="text-action" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={14} />{t('Refresh rates')}</button>
  return <ConversionRow kind="currency" title="Currency" icon={Banknote} {...{ data, setData, options, from, to, result, error, CopyAction }} extra={refreshButton} swapLabel="Swap currencies" fromLabel="From currency" toLabel="To currency">
    {currencyError && <p className="error-note" role="alert">{t(currencyError)}</p>}
    <p className="subtle" role="status" aria-live="polite">
      {!rate && !error && t('Loading exchange rate…')}
      {rate && (from === to ? t('Same currency: no conversion needed.') : `1 ${from} = ${new Intl.NumberFormat(getLocale(), { maximumSignificantDigits: 10 }).format(rate.rate)} ${to} · ${t('Rate date: {date}', { date: rate.date })}`)}
    </p>
    <p className="subtle">{t('Latest published daily rates; weekends and holidays may use an earlier date. Reference rates may differ from bank rates and exclude fees.')} {t('Rates from')} <a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Frankfurter</a>. {t('Requires internet. Only currency codes are sent to the rate service; your amount stays in this browser.')}</p>
  </ConversionRow>
}

export default function UnitConverter(props) {
  return <div className="tool-content">
    <UnitRow kind="length" title="Length" icon={Ruler} defaults={['m', 'cm']} {...props} />
    <UnitRow kind="weight" title="Weight" icon={Scale} defaults={['kg', 'lb']} {...props} />
    <UnitRow kind="area" title="Area" icon={LandPlot} defaults={['ping', 'm2']} {...props} />
    <CurrencyRow {...props} />
  </div>
}
