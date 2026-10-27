import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { t } from '../i18n.js'
import { mlSheet } from './ml.js'
import { nnSheet } from './nn.js'
import { snippetSheet } from './snippets.js'
import { filterEntries, libraries, libsOf, matchedParams, paramHead, queryTokens } from './search.js'

const sheets = { ml: mlSheet, nn: nnSheet, snippets: snippetSheet }
const MAX_CHIPS = 4

function escapeRe(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

function Marked({ text, re }) {
  if (!re || !text) return text
  return String(text).split(re).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part)
}

// Backticks become <code>; query tokens are highlighted inside both.
function Rich({ text, re }) {
  if (text == null || text === '') return null
  return String(text).split(/`([^`]+)`/).map((part, index) => index % 2
    ? <code key={index}><Marked text={part} re={re} /></code>
    : <Fragment key={index}><Marked text={part} re={re} /></Fragment>)
}

function lines(text) { return text.split('\n').length }

function DataTable({ head, rows, re, mono = [], matched, focus }) {
  return <div className="cs-table-wrap"><table className="cs-table">
    <thead><tr>{head.map(cell => <th key={cell}>{t(cell)}</th>)}</tr></thead>
    <tbody>{rows.map(row => {
      const hit = matched?.has(row[0])
      return <tr key={row[0]} data-param={row[0]} className={`${hit ? 'is-match' : ''} ${focus === row[0] ? 'is-focus' : ''}`}>
        {row.map((cell, index) => <td key={index} className={mono.includes(index) ? 'mono' : undefined}><Rich text={index === 3 && mono.length ? t(cell) : mono.includes(index) ? cell : t(cell)} re={re} /></td>)}
      </tr>
    })}</tbody>
  </table></div>
}

function SeeLinks({ entry, byId, onJump }) {
  if (!entry.see?.length) return null
  return <span className="cs-see">{entry.see.map(link => {
    const label = link.to === 'map' ? t('PyTorch ↔ Keras / TensorFlow map') : link.name ? `${link.to}: ${link.name}` : link.to
    return <button key={`${link.id}|${link.row || ''}`} type="button" className="cs-see-link" title={t(byId.get(link.id)?.name)} onClick={() => onJump(link)}>{t('see {target}', { target: label })}</button>
  })}</span>
}

function Detail({ entry, tokens, re, focusParam, Output, byId, onJump }) {
  const ref = useRef(null)
  const matched = useMemo(() => new Set(matchedParams(entry, tokens)), [entry, tokens])
  useEffect(() => { ref.current?.scrollTo?.({ top: 0 }) }, [entry.id])
  useEffect(() => {
    if (!focusParam) return
    const row = [...(ref.current?.querySelectorAll('tr[data-param]') || [])].find(node => node.dataset.param === focusParam)
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [entry.id, focusParam])
  return <article ref={ref} className="cs-detail" aria-label={t(entry.name)}>
    <header className="cs-detail-head">
      <div>
        <span className="cs-meta">{t(entry.section)} · {libsOf(entry).join(' · ')}</span>
        <h2><Marked text={t(entry.name)} re={re} /><SeeLinks entry={entry} byId={byId} onJump={onJump} /></h2>
        <p><Rich text={t(entry.summary)} re={re} /></p>
      </div>
      <div className="inline-controls" />
    </header>
    {entry.flow?.length > 0 && <ol className="cs-flow" aria-label={t('Steps')}>
      {entry.flow.map((step, index) => <li key={index}><span>{index + 1}</span><Marked text={t(step)} re={re} /></li>)}
    </ol>}
    {entry.use && <p className="cs-use"><b>{t('When to use')}</b><span><Rich text={t(entry.use)} re={re} /></span></p>}
    {entry.import && <Output label="Import" language="python" value={entry.import} rows={lines(entry.import)} />}
    {entry.params?.length > 0 && <section className="cs-block">
      <h3>{t('Parameters')}<small>{entry.params.length}</small>{matched.size > 0 && <small className="cs-hit-count">{t('{count} matching', { count: matched.size })}</small>}</h3>
      <DataTable head={paramHead} rows={entry.params} re={re} mono={[0, 1, 2]} matched={matched} focus={focusParam} />
    </section>}
    {(entry.tables || []).map(table => <section key={table.title} className="cs-block">
      <h3>{t(table.title)}</h3>
      <DataTable head={table.head} rows={table.rows} re={re} focus={focusParam} />
    </section>)}
    {entry.tips?.length > 0 && <ul className="cs-tips">{entry.tips.map(tip => <li key={tip}><Rich text={t(tip)} re={re} /></li>)}</ul>}
    {(entry.snippets || []).map(snippet => <Output key={snippet.title} label={t(snippet.title)} language={snippet.language || 'python'} value={snippet.code} rows={lines(snippet.code)} />)}
  </article>
}

export default function CheatsheetTool({ sheet, data, setData, Output }) {
  const entries = sheets[sheet] || []
  const query = data.query ?? ''
  const libs = useMemo(() => libraries(entries), [entries])
  const lib = libs.includes(data.lib) ? data.lib : ''
  const [focusParam, setFocusParam] = useState(null)
  const listRef = useRef(null)
  const byId = useMemo(() => new Map(entries.map(entry => [entry.id, entry])), [entries])
  const tokens = useMemo(() => queryTokens(query), [query])
  const re = useMemo(() => tokens.length ? new RegExp(`(${tokens.map(escapeRe).join('|')})`, 'gi') : null, [tokens])
  const results = useMemo(() => filterEntries(entries, query, lib), [entries, query, lib])
  const selected = results.find(result => result.entry.id === data.entry)?.entry || results[0]?.entry
  const selectedIndex = results.findIndex(result => result.entry === selected)

  useEffect(() => {
    listRef.current?.querySelector('.cs-item.selected')?.scrollIntoView({ block: 'nearest' })
  }, [selected?.id])

  function pick(id, param = null) {
    setFocusParam(param)
    if (id !== data.entry) setData({ entry: id })
  }
  function jump({ id, row = null }) {
    const target = entries.find(entry => entry.id === id)
    if (!target) return
    setFocusParam(row)
    const nextLib = lib && !libsOf(target).includes(lib) ? libsOf(target)[0] : lib
    setData({ entry: id, query: '', lib: nextLib })
  }
  function onSearchKey(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = results[Math.max(0, Math.min(results.length - 1, selectedIndex + (e.key === 'ArrowDown' ? 1 : -1)))]
      if (next) pick(next.entry.id, next.params[0] || null)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const first = results[selectedIndex < 0 ? 0 : selectedIndex]
      if (first) pick(first.entry.id, first.params[0] || null)
    } else if (e.key === 'Escape' && query) {
      e.preventDefault()
      e.stopPropagation()
      setData({ query: '' })
    }
  }

  let lastSection = null
  return <div className="tool-content cs-tool">
    <div className="cs-body">
      <aside className="cs-index">
        <div className="cs-search">
          <Search size={15} />
          <input value={query} onChange={e => { setFocusParam(null); setData({ query: e.target.value }) }} onKeyDown={onSearchKey}
            placeholder={t('Filter algorithms, parameters, snippets…')} aria-label={t('Filter cheatsheet')} aria-controls="cs-list" spellCheck="false" />
          {query && <button type="button" className="icon-action" aria-label={t('Clear filter')} onClick={() => setData({ query: '' })}><X size={14} /></button>}
        </div>
        {libs.length > 1 && <div className="cs-libs" role="group" aria-label={t('Library')}>
          {['', ...libs].map(name => <button key={name || 'all'} type="button" aria-pressed={lib === name} className="cs-lib" onClick={() => setData({ lib: name })}>{name || t('All')}</button>)}
        </div>}
        <ul id="cs-list" ref={listRef} className="cs-list" role="listbox" aria-label={t('Cheatsheet entries')}>
          {results.map(({ entry, params }) => {
            const header = !tokens.length && entry.section !== lastSection
            lastSection = entry.section
            const active = entry === selected
            return <Fragment key={entry.id}>
              {header && <li className="cs-section" role="presentation">{t(entry.section)}</li>}
              <li className={`cs-item ${active ? 'selected' : ''}`} role="option" aria-selected={active}>
                <button type="button" className="cs-item-main" onClick={() => pick(entry.id)}>
                  <b><Marked text={t(entry.name)} re={re} /></b>
                  <small>{tokens.length ? `${t(entry.section)} · ` : ''}{entry.flow ? entry.flow.map(step => t(step)).join(' → ') : libsOf(entry).join(' · ')}{entry.params ? ` · ${t('{count} params', { count: entry.params.length })}` : ''}</small>
                </button>
                {params.length > 0 && <div className="cs-item-params">
                  {params.slice(0, MAX_CHIPS).map(param => <button key={param} type="button" className="cs-chip" onClick={() => pick(entry.id, param)}><Marked text={param} re={re} /></button>)}
                  {params.length > MAX_CHIPS && <span className="cs-chip more">+{params.length - MAX_CHIPS}</span>}
                </div>}
              </li>
            </Fragment>
          })}
          {!results.length && <li className="cs-empty" role="presentation">{t('No matches. Try a parameter name such as max_depth.')}</li>}
        </ul>
        <div className="cs-count">{t('{count} of {total} entries', { count: results.length, total: entries.length })}<span>↑ ↓ · Enter · Esc</span></div>
      </aside>
      {selected
        ? <Detail entry={selected} tokens={tokens} re={re} focusParam={focusParam} Output={Output} byId={byId} onJump={jump} />
        : <article className="cs-detail cs-detail-empty"><p>{t('Nothing selected.')}</p></article>}
    </div>
  </div>
}
