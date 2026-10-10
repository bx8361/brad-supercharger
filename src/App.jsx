import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Bolt, Check, ChevronDown, Command, GripVertical, Home, Scale, Star,
  Download, EyeOff, Menu, Moon, Search, Settings2, ShieldCheck, Sun, X,
} from 'lucide-react'
import { groups, tools } from './catalog.js'
import { LicensesPage } from './licensesPage.jsx'
import { renderTool, StatusToast } from './toolViews.jsx'
import { usePwaInstall } from './usePwaInstall.js'
import ResizeHandle from './ResizeHandle.jsx'

import { STORAGE_KEY, emptySaved, readSaved, sessionFromSaved, writeSaved } from './persistence.js'
import { LOCALES, detectLocale, getLocale, refreshLocale, setLocaleQuiet, t } from './i18n.js'

function adoptPathRoute() {
  const pathMatch = window.location.pathname.match(/\/tools\/([a-z0-9-]+)\/?$/)
  if (!pathMatch || /^#\/tools\//.test(window.location.hash)) return
  const params = new URLSearchParams(window.location.search)
  const playlist = params.get('url')
  const hash = `#/tools/${pathMatch[1]}${playlist ? `?url=${encodeURIComponent(playlist)}` : ''}`
  const root = window.location.pathname.replace(/\/tools\/[a-z0-9-]+\/?$/, '/') || '/'
  history.replaceState(null, '', `${root}${hash}`)
}

adoptPathRoute()

function getRoute() {
  const hash = window.location.hash
  if (!hash || hash === '#' || hash === '#/') return 'home'
  if (hash === '#/licenses') return 'licenses'
  const match = hash.match(/^#\/tools\/([a-z0-9-]+)(?:\?.*)?$/)
  return match ? match[1] : 'home'
}

function ToolBadge({ tool, large = false }) {
  const Icon = tool.icon
  return <span className={`tool-badge ${large ? 'large' : ''}`}><Icon size={large ? 22 : 17} strokeWidth={1.8} /></span>
}

function NavSection({ id, label, icon: Icon, count, saved, onToggle, children }) {
  const collapsed = !!saved.collapsedSections?.[id]
  return <section className="nav-section">
    <button className="section-heading" aria-expanded={!collapsed} aria-controls={`nav-section-${id}`} onClick={() => onToggle(id)}>
      {Icon && <Icon size={13} />} {t(label)}<span>{count}</span><ChevronDown size={12} className={`section-chevron ${collapsed ? 'collapsed' : ''}`} />
    </button>
    <div id={`nav-section-${id}`} hidden={collapsed}>{children}</div>
  </section>
}

function Sidebar({ active, saved, incognito, onToggleIncognito, onSidebarWidth, search, setSearch, onNavigate, onNavigateLicenses, onFavorite, onReorderFavorite, onToggleSection, onClear, pwa, mobileOpen, closeMobile }) {
  const [dragged, setDragged] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const favoriteIds = useMemo(() => new Set(saved.favorites), [saved.favorites])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? tools.filter(tool => !favoriteIds.has(tool.id) && `${t(tool.name)} ${t(tool.description)} ${tool.name} ${tool.description} ${tool.keywords}`.toLowerCase().includes(q)) : null
  }, [search, favoriteIds, getLocale()])
  const favorites = saved.favorites.map(id => tools.find(t => t.id === id)).filter(Boolean)
  const recent = (saved.recent || []).map(id => tools.find(t => t.id === id)).filter(t => t && !favoriteIds.has(t.id)).slice(0, 4)
  const openTool = id => { onNavigate(id); closeMobile() }
  const sectionProps = { saved, onToggle: onToggleSection }
  const endDrag = () => { setDragged(null); setDropTarget(null) }
  return <>
    {mobileOpen && <button className="mobile-scrim" aria-label={t("Close menu")} onClick={closeMobile} />}
    <aside id="sidebar-navigation" className={`sidebar ${mobileOpen ? 'open' : ''}`}><div className="sidebar-content">
      <div className="brand-row"><span className="brand-mark"><Bolt size={19} fill="currentColor" /></span><span className="brand-name"><span lang="en">{t("Brad's")}{' '}<b>{t("Supercharger")}</b></span><small>{t("DEVELOPER TOOLBOX")}</small></span><button className="sidebar-close" onClick={closeMobile} aria-label={t("Close navigation")}><X size={18} /></button></div>
      <div className="sidebar-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Find a tool…")} aria-label={t("Find a tool")} /><kbd>/</kbd></div>
      <nav className="nav-scroll" aria-label={t("Tool navigation")}>
        <button className={`nav-home ${active === 'home' ? 'selected' : ''}`} onClick={() => openTool('home')}><Home size={16} /><span>{t("Home")}</span><span className="nav-shortcut">⌘ K</span></button>
        {favorites.length > 0 && <NavSection id="favorites" label="Favorites" icon={Star} count={favorites.length} {...sectionProps}>
          {favorites.map((tool, index) => <ToolNavItem key={tool.id} tool={tool} active={active === tool.id} saved={saved} onFavorite={onFavorite} onClick={() => openTool(tool.id)}
            reorder={{
              dragging: dragged === tool.id,
              dropPosition: dropTarget?.id === tool.id ? dropTarget.position : null,
              onDragStart: e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', tool.id); setDragged(tool.id) },
              onDragEnd: endDrag,
              onDragOver: e => {
                if (!dragged || dragged === tool.id) return
                e.preventDefault(); e.dataTransfer.dropEffect = 'move'
                const bounds = e.currentTarget.getBoundingClientRect()
                setDropTarget({ id: tool.id, position: e.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after' })
              },
              onDrop: e => {
                e.preventDefault()
                if (dragged && dropTarget?.id === tool.id) onReorderFavorite(dragged, tool.id, dropTarget.position)
                endDrag()
              },
              onKeyDown: e => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
                e.preventDefault()
                const target = favorites[index + (e.key === 'ArrowUp' ? -1 : 1)]
                if (target) onReorderFavorite(tool.id, target.id, e.key === 'ArrowUp' ? 'before' : 'after')
              },
            }} />)}
        </NavSection>}
        {filtered ? <NavSection id="search" label="Search results" count={filtered.length} {...sectionProps}>{filtered.length ? filtered.map(t => <ToolNavItem key={t.id} tool={t} active={active === t.id} saved={saved} onFavorite={onFavorite} onClick={() => openTool(t.id)} />) : <p className="empty-search">{t("No tools found.")}</p>}</NavSection> : <>
          {recent.length > 0 && <NavSection id="recent" label="Recent" count={recent.length} {...sectionProps}>{recent.map(t => <ToolNavItem key={t.id} tool={t} active={active === t.id} saved={saved} onFavorite={onFavorite} onClick={() => openTool(t.id)} />)}</NavSection>}
          {groups.map(group => {
            const items = tools.filter(tool => tool.category === group.id && !favoriteIds.has(tool.id))
            if (!items.length) return null
            return <NavSection key={group.id} id={group.id} label={group.label} icon={group.icon} count={items.length} {...sectionProps}>{items.map(t => <ToolNavItem key={t.id} tool={t} active={active === t.id} saved={saved} onFavorite={onFavorite} onClick={() => openTool(t.id)} />)}</NavSection>
          })}
        </>}
      </nav>
      <div className="sidebar-bottom">{pwa.available && !pwa.installed && <button className="install-app-button" onClick={pwa.install} disabled={pwa.installing}><Download size={14} />{t("Install app")}</button>}<button type="button" className={`local-status ${incognito ? 'incognito' : ''}`} aria-pressed={incognito} title={t(incognito ? 'Nothing is saved. This visit works like the first open.' : 'Runs entirely in your browser')} onClick={onToggleIncognito}><span className="status-dot" /><b>{t(incognito ? 'Incognito Mode' : 'Private by design')}</b>{incognito ? <EyeOff size={16} /> : <ShieldCheck size={16} />}</button><button className="clear-data" onClick={onClear}><Settings2 size={14} /> {t("Saved data & preferences")}</button><button className={`clear-data ${active === 'licenses' ? 'selected' : ''}`} onClick={onNavigateLicenses}><Scale size={14} /> {t("Third-party notices")}</button><div className="sidebar-foot"><span>{t("SUPERCHARGER")}</span><span>{t("v2.0")}</span></div></div>
      </div>
      <ResizeHandle axis="x" label={t("Resize sidebar width")} value={saved.sidebarWidth || 260} min={220} max={480} onChange={onSidebarWidth} onReset={() => onSidebarWidth(260)} />
    </aside>
  </>
}

function ToolNavItem({ tool, active, saved, onFavorite, onClick, reorder }) {
  const Icon = tool.icon, favorite = saved.favorites.includes(tool.id)
  return <div className={`tool-nav-row ${active ? 'selected' : ''} ${reorder?.dragging ? 'dragging' : ''} ${reorder?.dropPosition ? `drop-${reorder.dropPosition}` : ''}`}
    draggable={!!reorder} onDragStart={reorder?.onDragStart} onDragEnd={reorder?.onDragEnd} onDragOver={reorder?.onDragOver} onDrop={reorder?.onDrop}>
    {reorder && <button className="favorite-drag-handle" aria-label={t('Reorder {name}; use up and down arrow keys', { name: t(tool.name) })} title={t("Drag to reorder · ↑ / ↓")} onKeyDown={reorder.onKeyDown}><GripVertical size={13} /></button>}
    <button className="tool-nav" onClick={onClick} aria-current={active ? 'page' : undefined}><Icon size={16} strokeWidth={1.8} /><span>{t(tool.name)}</span></button>
    <button className={`nav-favorite ${favorite ? 'is-favorite' : ''}`} title={t(favorite ? 'Remove favorite' : 'Add favorite')} aria-label={t(favorite ? 'Remove {name} from favorites' : 'Add {name} to favorites', { name: t(tool.name) })} onClick={e => { e.stopPropagation(); onFavorite(tool.id) }}>★</button>
  </div>
}

function LocaleSelect({ value, onChange }) {
  return <select className="locale-select" aria-label={t('Language')} value={value} onChange={e => onChange(e.target.value)}>{LOCALES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
}

function TopBar({ current, theme, setTheme, locale, onLocale, incognito, onToggleIncognito, menuOpen, onMenu, onOpenMenu, onBack, onForward, canBack, canForward, search, setSearch }) {
  const icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Settings2, ThemeIcon = icon
  const themeName = t(theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System')
  const title = t(current?.name || 'Your everyday toolkit')
  const licensesPage = current?.id === 'licenses'
  return <header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label={t(menuOpen ? 'Hide sidebar' : 'Show sidebar')} aria-expanded={menuOpen} aria-controls="sidebar-navigation" onClick={onMenu}><Menu size={19} /></button><div className="history-buttons"><button title={t("Go back")} disabled={!canBack} onClick={onBack}><ArrowLeft size={15} /></button><button title={t("Go forward")} disabled={!canForward} onClick={onForward}><ArrowRight size={15} /></button></div><span className="crumb">{licensesPage ? <><span>{t("WORKSPACE")}</span><i>/</i><b>{t("THIRD-PARTY NOTICES")}</b></> : current ? <><span>{t("TOOLS")}</span><i>/</i><b>{title}</b></> : <><span>{t("WORKSPACE")}</span><i>/</i><b>{t("OVERVIEW")}</b></>}</span></div><div className="topbar-right"><div className="top-search" onClick={() => { if (window.matchMedia('(max-width: 760px)').matches) { onOpenMenu(); window.setTimeout(() => document.querySelector('.sidebar-search input')?.focus(), 230) } }}><Search size={15} /><input aria-label={t("Search tools")} placeholder={t("Search tools")} value={search} onChange={e => setSearch(e.target.value)} /><kbd><Command size={10} /> {t("K")}</kbd></div><button className={`incognito-button ${incognito ? 'incognito' : ''}`} aria-pressed={incognito} title={t(incognito ? 'Incognito mode is on. Nothing is saved.' : 'Incognito mode')} aria-label={t(incognito ? 'Turn off incognito mode' : 'Turn on incognito mode')} onClick={onToggleIncognito}><EyeOff size={17} /></button><LocaleSelect value={locale} onChange={onLocale} /><button className="theme-button" title={t('Theme: {theme}', { theme: themeName })} aria-label={t('Theme is {theme}; change theme', { theme: themeName })} onClick={() => setTheme(theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system')}><ThemeIcon size={17} /><ChevronDown size={11} /></button></div></header>
}

function HomePage({ saved, onNavigate, onFavorite }) {
  const favorites = saved.favorites.map(id => tools.find(t => t.id === id)).filter(Boolean)
  const featured = ['json','base64','timestamp','uuid','hash','password'].map(id => tools.find(t => t.id === id))
  return <div className="home-page"><section className="welcome-banner"><div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" /><div className="welcome-copy"><div className="eyebrow"><span className="status-dot" /> {t("YOUR LOCAL-FIRST WORKBENCH")}</div><h1>{t("Small tools.")}<br /><em>{t("Serious")}</em> {t("momentum.")}</h1><p>{t("A focused kit for the tiny tasks that keep your day moving. Fast, private, right here in your browser.")}</p><button className="banner-cta" onClick={() => onNavigate('json')}>{t("Open JSON formatter")}<ArrowRight size={15} /></button></div><div className="banner-art"><div className="art-ring ring-a" /><div className="art-ring ring-b" /><div className="art-core"><Bolt size={38} fill="currentColor" /></div><span className="art-chip chip-a">{t("100% LOCAL")}</span><span className="art-chip chip-b">{t('{count} TOOLS', { count: tools.length })}</span><span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✳</span></div><div className="banner-index">01 <i>—</i> {String(tools.length).padStart(2, '0')}</div></section>
    {favorites.length > 0 && <section className="home-section"><div className="section-title"><div><span className="eyebrow">{t("YOUR SHORTCUTS")}</span><h2>{t("Favorites")}<span className="favorite-mark">★</span></h2></div><span className="section-count">{t('{count} PINNED', { count: favorites.length })}</span></div><div className="favorite-grid">{favorites.map(tool => <ToolCard key={tool.id} tool={tool} onClick={() => onNavigate(tool.id)} onFavorite={() => onFavorite(tool.id)} favorite />)}</div></section>}
    <section className="home-section"><div className="section-title"><div><span className="eyebrow">{t("A GOOD PLACE TO START")}</span><h2>{t("Most used")}</h2></div><span className="section-count">01 — 06</span></div><div className="tool-card-grid">{featured.map((tool,index) => <ToolCard key={tool.id} tool={tool} onClick={() => onNavigate(tool.id)} onFavorite={() => onFavorite(tool.id)} saved={saved} number={String(index+1).padStart(2,'0')} />)}</div></section>
    <section className="home-section category-section"><div className="section-title"><div><span className="eyebrow">{t("BROWSE THE TOOLBOX")}</span><h2>{t("Built for the little things")}</h2></div></div><div className="category-grid">{groups.map(group => { const GroupIcon = group.icon, count = tools.filter(t => t.category === group.id).length; return <button key={group.id} className="category-card" onClick={() => onNavigate(tools.find(t => t.category === group.id).id)}><span className="category-icon"><GroupIcon size={19} /></span><span><b>{t(group.label)}</b><small>{t('{count} ready-to-use tools', { count })}</small></span><ArrowRight size={16} /></button> })}</div></section>
    <footer className="home-footer"><span><Bolt size={13} fill="currentColor" /> {t("MADE FOR THE EVERYDAY DEV LOOP")}</span><span>{t("YOUR INPUT STAYS ON THIS DEVICE")}</span></footer>
  </div>
}

function ToolCard({ tool, onClick, onFavorite, saved, number, favorite = false }) {
  const pinned = favorite || saved?.favorites.includes(tool.id)
  return <article className="tool-card"><button className="card-open" onClick={onClick}><span className="card-number">{number || <ToolBadge tool={tool} />}</span><h3>{t(tool.name)}</h3><p>{t(tool.description)}</p><span className="card-open-label">{t("OPEN TOOL")}<ArrowRight size={13} /></span></button><button className={`card-pin ${pinned ? 'is-favorite' : ''}`} onClick={onFavorite} title={t(pinned ? 'Remove favorite' : 'Add favorite')} aria-label={t(pinned ? 'Remove {name} from favorites' : 'Add {name} to favorites', { name: t(tool.name) })}>★</button></article>
}

function ToolPage({ tool, saved, setToolData, toggleFavorite }) {
  const isFavorite = saved.favorites.includes(tool.id)
  const data = saved.tools[tool.id] || {}
  return <div className="tool-page"><div className="tool-heading"><div className="tool-heading-copy"><h1><ToolBadge tool={tool} large />{t(tool.name)}</h1><p>{t(tool.description)}</p></div><button aria-pressed={isFavorite} aria-label={t(isFavorite ? 'Remove {name} from favorites' : 'Add {name} to favorites', { name: t(tool.name) })} className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(tool.id)}><span>★</span>{t(isFavorite ? 'Favorited' : 'Add favorite')}</button></div><div className="tool-workspace" style={{ height: data.workspaceHeight ? `${data.workspaceHeight}px` : undefined }}>{renderTool(tool.id, { data, setData: patch => setToolData(tool.id, patch) })}<ResizeHandle axis="y" label={t("Resize tool workspace height")} value={data.workspaceHeight} min={240} max={2400} onChange={workspaceHeight => setToolData(tool.id, { workspaceHeight })} onReset={() => setToolData(tool.id, { workspaceHeight: undefined })} /></div><div className="tool-bottom-note"><span>{t("POWERED BY YOUR BROWSER")}</span><span>{t("YOUR DATA DOESN’T LEAVE THIS DEVICE")}<ShieldCheck size={13} /></span></div></div>
}

function Preferences({ saved, incognito, onClose, onTheme, onLocale, onSaveSensitiveData, onAlwaysIncognito, onClear, pwa }) {
  return <div className="modal-scrim" onClick={onClose}><section className="preferences-modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">{t("WORKSPACE")}</span><h2>{t("Saved data & preferences")}</h2></div><button className="icon-only" onClick={onClose} aria-label={t("Close")}><X size={18} /></button></div><div className="preference-row"><div><b>{t("Color theme")}</b><small>{t("Choose how the toolbox looks.")}</small></div><select value={saved.theme} onChange={e => onTheme(e.target.value)}><option value="system">{t("Follow system")}</option><option value="dark">{t("Dark")}</option><option value="light">{t("Light")}</option></select></div><div className="preference-row"><div><b>{t("Language")}</b><small>{t("Used for the toolbox interface. Detected from this browser the first time you open it.")}</small></div><LocaleSelect value={saved.locale} onChange={onLocale} /></div><div className="preference-row"><div><b>{t("Always saved locally")}</b><small>{t("Favorites, recent tools, theme, language, navigation, and tool options.")}</small></div><span className="local-tag"><ShieldCheck size={14} /> {t("ON THIS DEVICE")}</span></div><div className="preference-row"><div><b id="save-sensitive-label">{t("Save tool inputs & generated text")}</b><small id="save-sensitive-description">{t("Off by default. When off, text stays in this session and previously saved text is removed.")}</small></div><input className="preference-checkbox" type="checkbox" checked={!incognito && saved.saveSensitiveData === true} disabled={incognito} aria-labelledby="save-sensitive-label" aria-describedby="save-sensitive-description" onChange={e => onSaveSensitiveData(e.target.checked)} /></div><div className="preference-row"><div><b id="always-incognito-label">{t("Always enable incognito mode")}</b><small id="always-incognito-description">{t("Each visit starts blank. Favorites, theme, and tool text from this mode are not saved.")}</small></div><input className="preference-checkbox" type="checkbox" checked={saved.alwaysIncognito === true} aria-labelledby="always-incognito-label" aria-describedby="always-incognito-description" onChange={e => onAlwaysIncognito(e.target.checked)} /></div><div className="preference-row install-preference"><div><b>{t("Install Supercharger")}</b><small>{t(pwa.installed ? 'Installed. Open Supercharger from your apps.' : pwa.available ? 'Open in its own window and use tools offline.' : 'In Chrome, use the address bar install icon or the install option in the browser menu.')}</small>{pwa.error && <small role="alert">{t(pwa.error)}</small>}</div>{pwa.installed ? <span className="local-tag"><Check size={14} /> {t("INSTALLED")}</span> : pwa.available && <button className="install-app-button" onClick={pwa.install} disabled={pwa.installing}><Download size={14} />{t(pwa.installing ? 'Installing…' : 'Install app')}</button>}</div><div className="modal-footer"><span>{t("Clear all saved toolbox data from this browser.")}</span><button className="danger-button" onClick={onClear}>{t("Clear saved data")}</button></div></section></div>
}

export default function App() {
  const pwa = usePwaInstall()
  const [boot] = useState(() => {
    const session = sessionFromSaved(readSaved())
    const locale = session.saved.locale || detectLocale()
    return { ...session, saved: { ...session.saved, locale } }
  })
  const [incognito, setIncognito] = useState(boot.incognito)
  const [saved, setSaved] = useState(boot.saved)
  const [active, setActive] = useState(getRoute)
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [showPreferences, setShowPreferences] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const current = active === 'licenses' ? { id: 'licenses', name: 'Third-party notices' } : tools.find(t => t.id === active)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const update = () => { setIsMobile(media.matches); setMobileOpen(false) }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => { const update = () => setActive(getRoute()); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  setLocaleQuiet(saved.locale)
  useEffect(() => { document.documentElement.dataset.theme = saved.theme }, [saved.theme])
  useEffect(() => { refreshLocale() }, [saved.locale])
  useEffect(() => {
    try {
      const stored = readSaved()
      if (incognito && stored.alwaysIncognito === (saved.alwaysIncognito === true) && stored.locale === saved.locale) return
      writeSaved(saved, { incognito })
      setSaveError(false)
    } catch { setSaveError(true) }
  }, [saved, incognito])
  useEffect(() => {
    const focusSearch = () => { if (window.matchMedia('(max-width: 760px)').matches) setMobileOpen(true); else setSidebarCollapsed(false); window.setTimeout(() => document.querySelector('.sidebar-search input')?.focus(), 230) }
    const handler = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); focusSearch() } else if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) { e.preventDefault(); focusSearch() } else if (e.key === 'Escape') { setMobileOpen(false); setShowPreferences(false) } }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  }, [])
  useEffect(() => {
    if (active !== 'home' && active !== 'licenses' && tools.some(t => t.id === active)) {
      setSaved(s => ({ ...s, recent: [active, ...s.recent.filter(id => id !== active)].slice(0, 8) }))
    }
  }, [active])

  function navigate(id) {
    const hash = id === 'home' ? '#/' : id === 'licenses' ? '#/licenses' : `#/tools/${id}`
    if (location.hash === hash) setActive(id)
    else location.hash = hash
  }
  function setToolData(id, patch) { setSaved(s => ({ ...s, tools: { ...s.tools, [id]: { ...(s.tools[id] || {}), ...patch } } })) }
  function toggleFavorite(id) { setSaved(s => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter(x => x !== id) : [...s.favorites, id] })) }
  function toggleSection(id) { setSaved(s => ({ ...s, collapsedSections: { ...s.collapsedSections, [id]: !s.collapsedSections?.[id] } })) }
  function reorderFavorite(id, targetId, position) {
    setSaved(s => {
      if (id === targetId || !s.favorites.includes(id) || !s.favorites.includes(targetId)) return s
      const favorites = s.favorites.filter(value => value !== id)
      favorites.splice(favorites.indexOf(targetId) + (position === 'after' ? 1 : 0), 0, id)
      return { ...s, favorites }
    })
  }
  function toggleIncognito() {
    if (incognito) { setIncognito(false); setSaved({ ...readSaved(), alwaysIncognito: false }); return }
    setIncognito(true)
    setSaved(s => ({ ...emptySaved, alwaysIncognito: s.alwaysIncognito === true, locale: s.locale }))
  }
  function onAlwaysIncognito(on) {
    if (on) { setIncognito(true); setSaved(s => ({ ...emptySaved, alwaysIncognito: true, locale: s.locale })); return }
    setIncognito(false)
    setSaved({ ...readSaved(), alwaysIncognito: false })
  }
  function clearSaved() { if (!window.confirm(t('Clear all saved inputs, generated text, favorites, and preferences from this browser?'))) return; localStorage.removeItem(STORAGE_KEY); setIncognito(false); setSaved({ ...emptySaved, locale: detectLocale() }); setShowPreferences(false) }
  const [historyState, setHistoryState] = useState({ back: false, forward: false })
  useEffect(() => { const sync = () => { setHistoryState({ back: history.length > 1, forward: false }) }; addEventListener('popstate', sync); return () => removeEventListener('popstate', sync) }, [])

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ '--sidebar-width': `${Math.max(220, Math.min(480, Number(saved.sidebarWidth) || 260))}px` }}><Sidebar incognito={incognito} onToggleIncognito={toggleIncognito} onSidebarWidth={sidebarWidth => setSaved(s => ({ ...s, sidebarWidth }))} active={active} saved={saved} search={search} setSearch={setSearch} onNavigate={navigate} onNavigateLicenses={() => navigate('licenses')} onFavorite={toggleFavorite} onReorderFavorite={reorderFavorite} onToggleSection={toggleSection} onClear={() => setShowPreferences(true)} pwa={pwa} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} /><div className="main-column"><TopBar current={current} theme={saved.theme} setTheme={theme => setSaved(s => ({ ...s, theme }))} locale={saved.locale} onLocale={locale => setSaved(s => ({ ...s, locale }))} incognito={incognito} onToggleIncognito={toggleIncognito} menuOpen={isMobile ? mobileOpen : !sidebarCollapsed} onMenu={() => { if (isMobile) setMobileOpen(open => !open); else setSidebarCollapsed(collapsed => !collapsed) }} onOpenMenu={() => setMobileOpen(true)} onBack={() => history.back()} onForward={() => history.forward()} canBack={historyState.back} canForward={historyState.forward} search={search} setSearch={setSearch} /><main className="main-content">{active === 'licenses' ? <LicensesPage /> : active === 'home' || !tools.some(t => t.id === active) ? <HomePage saved={saved} onNavigate={navigate} onFavorite={toggleFavorite} /> : <ToolPage tool={current} saved={saved} setToolData={setToolData} toggleFavorite={toggleFavorite} />}</main>{saveError && <div className="save-warning">{t("Browser storage is full. This session will continue without saving new changes.")}</div>}<StatusToast /></div>{showPreferences && <Preferences pwa={pwa} saved={saved} incognito={incognito} onClose={() => setShowPreferences(false)} onTheme={theme => setSaved(s => ({ ...s, theme }))} onLocale={locale => setSaved(s => ({ ...s, locale }))} onSaveSensitiveData={saveSensitiveData => setSaved(s => ({ ...s, saveSensitiveData }))} onAlwaysIncognito={onAlwaysIncognito} onClear={clearSaved} />}</div>
}
