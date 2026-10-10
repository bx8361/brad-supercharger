import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Bolt, Check, ChevronDown, Command, GripVertical, Home, Scale, Star,
  Download, Menu, Moon, Search, Settings2, ShieldCheck, Sun, X,
} from 'lucide-react'
import { groups, tools } from './catalog.js'
import { LicensesPage } from './licensesPage.jsx'
import { renderTool, StatusToast } from './toolViews.jsx'
import { usePwaInstall } from './usePwaInstall.js'
import ResizeHandle from './ResizeHandle.jsx'

import { STORAGE_KEY, emptySaved, persistedSaved, readSaved } from './persistence.js'

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
      {Icon && <Icon size={13} />} {label}<span>{count}</span><ChevronDown size={12} className={`section-chevron ${collapsed ? 'collapsed' : ''}`} />
    </button>
    <div id={`nav-section-${id}`} hidden={collapsed}>{children}</div>
  </section>
}

function Sidebar({ active, saved, onSidebarWidth, search, setSearch, onNavigate, onNavigateLicenses, onFavorite, onReorderFavorite, onToggleSection, onClear, pwa, mobileOpen, closeMobile }) {
  const [dragged, setDragged] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const favoriteIds = useMemo(() => new Set(saved.favorites), [saved.favorites])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? tools.filter(t => !favoriteIds.has(t.id) && `${t.name} ${t.description} ${t.keywords}`.toLowerCase().includes(q)) : null
  }, [search, favoriteIds])
  const favorites = saved.favorites.map(id => tools.find(t => t.id === id)).filter(Boolean)
  const recent = (saved.recent || []).map(id => tools.find(t => t.id === id)).filter(t => t && !favoriteIds.has(t.id)).slice(0, 4)
  const openTool = id => { onNavigate(id); closeMobile() }
  const sectionProps = { saved, onToggle: onToggleSection }
  const endDrag = () => { setDragged(null); setDropTarget(null) }
  return <>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={closeMobile} />}
    <aside id="sidebar-navigation" className={`sidebar ${mobileOpen ? 'open' : ''}`}><div className="sidebar-content">
      <div className="brand-row"><span className="brand-mark"><Bolt size={19} fill="currentColor" /></span><span className="brand-name">Brad’s <b>Supercharger</b><small>DEVELOPER TOOLBOX</small></span><button className="sidebar-close" onClick={closeMobile} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="sidebar-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a tool…" aria-label="Find a tool" /><kbd>/</kbd></div>
      <nav className="nav-scroll" aria-label="Tool navigation">
        <button className={`nav-home ${active === 'home' ? 'selected' : ''}`} onClick={() => openTool('home')}><Home size={16} /><span>Home</span><span className="nav-shortcut">⌘ K</span></button>
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
        {filtered ? <NavSection id="search" label="Search results" count={filtered.length} {...sectionProps}>{filtered.length ? filtered.map(t => <ToolNavItem key={t.id} tool={t} active={active === t.id} saved={saved} onFavorite={onFavorite} onClick={() => openTool(t.id)} />) : <p className="empty-search">No tools found.</p>}</NavSection> : <>
          {recent.length > 0 && <NavSection id="recent" label="Recent" count={recent.length} {...sectionProps}>{recent.map(t => <ToolNavItem key={t.id} tool={t} active={active === t.id} saved={saved} onFavorite={onFavorite} onClick={() => openTool(t.id)} />)}</NavSection>}
          {groups.map(group => {
            const items = tools.filter(tool => tool.category === group.id && !favoriteIds.has(tool.id))
            if (!items.length) return null
            return <NavSection key={group.id} id={group.id} label={group.label} icon={group.icon} count={items.length} {...sectionProps}>{items.map(t => <ToolNavItem key={t.id} tool={t} active={active === t.id} saved={saved} onFavorite={onFavorite} onClick={() => openTool(t.id)} />)}</NavSection>
          })}
        </>}
      </nav>
      <div className="sidebar-bottom">{pwa.available && !pwa.installed && <button className="install-app-button" onClick={pwa.install} disabled={pwa.installing}><Download size={14} />Install app</button>}<div className="local-status"><span className="status-dot" /><div><b>Private by design</b><small>Runs entirely in your browser</small></div><ShieldCheck size={16} /></div><button className="clear-data" onClick={onClear}><Settings2 size={14} /> Saved data & preferences</button><button className={`clear-data ${active === 'licenses' ? 'selected' : ''}`} onClick={onNavigateLicenses}><Scale size={14} /> Third-party notices</button><div className="sidebar-foot"><span>SUPERCHARGER</span><span>v1.0 · STAGE 01</span></div></div>
      </div>
      <ResizeHandle axis="x" label="Resize sidebar width" value={saved.sidebarWidth || 260} min={220} max={480} onChange={onSidebarWidth} onReset={() => onSidebarWidth(260)} />
    </aside>
  </>
}

function ToolNavItem({ tool, active, saved, onFavorite, onClick, reorder }) {
  const Icon = tool.icon, favorite = saved.favorites.includes(tool.id)
  return <div className={`tool-nav-row ${active ? 'selected' : ''} ${reorder?.dragging ? 'dragging' : ''} ${reorder?.dropPosition ? `drop-${reorder.dropPosition}` : ''}`}
    draggable={!!reorder} onDragStart={reorder?.onDragStart} onDragEnd={reorder?.onDragEnd} onDragOver={reorder?.onDragOver} onDrop={reorder?.onDrop}>
    {reorder && <button className="favorite-drag-handle" aria-label={`Reorder ${tool.name}; use up and down arrow keys`} title="Drag to reorder · ↑ / ↓" onKeyDown={reorder.onKeyDown}><GripVertical size={13} /></button>}
    <button className="tool-nav" onClick={onClick} aria-current={active ? 'page' : undefined}><Icon size={16} strokeWidth={1.8} /><span>{tool.name}</span></button>
    <button className={`nav-favorite ${favorite ? 'is-favorite' : ''}`} title={favorite ? 'Remove favorite' : 'Add favorite'} aria-label={`${favorite ? 'Remove' : 'Add'} ${tool.name} ${favorite ? 'from' : 'to'} favorites`} onClick={e => { e.stopPropagation(); onFavorite(tool.id) }}>★</button>
  </div>
}

function TopBar({ current, theme, setTheme, menuOpen, onMenu, onOpenMenu, onBack, onForward, canBack, canForward, search, setSearch }) {
  const icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Settings2, ThemeIcon = icon
  const title = current?.name || 'Your everyday toolkit'
  const licensesPage = current?.id === 'licenses'
  return <header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label={menuOpen ? 'Hide sidebar' : 'Show sidebar'} aria-expanded={menuOpen} aria-controls="sidebar-navigation" onClick={onMenu}><Menu size={19} /></button><div className="history-buttons"><button title="Go back" disabled={!canBack} onClick={onBack}><ArrowLeft size={15} /></button><button title="Go forward" disabled={!canForward} onClick={onForward}><ArrowRight size={15} /></button></div><span className="crumb">{licensesPage ? <><span>WORKSPACE</span><i>/</i><b>THIRD-PARTY NOTICES</b></> : current ? <><span>TOOLS</span><i>/</i><b>{title}</b></> : <><span>WORKSPACE</span><i>/</i><b>OVERVIEW</b></>}</span></div><div className="topbar-right"><div className="top-search" onClick={() => { if (window.matchMedia('(max-width: 760px)').matches) { onOpenMenu(); window.setTimeout(() => document.querySelector('.sidebar-search input')?.focus(), 230) } }}><Search size={15} /><input aria-label="Search tools" placeholder="Search tools" value={search} onChange={e => setSearch(e.target.value)} /><kbd><Command size={10} /> K</kbd></div><button className="theme-button" title={`Theme: ${theme}`} aria-label={`Theme is ${theme}; change theme`} onClick={() => setTheme(theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system')}><ThemeIcon size={17} /><ChevronDown size={11} /></button></div></header>
}

function HomePage({ saved, onNavigate, onFavorite }) {
  const favorites = saved.favorites.map(id => tools.find(t => t.id === id)).filter(Boolean)
  const featured = ['json','base64','timestamp','uuid','hash','password'].map(id => tools.find(t => t.id === id))
  return <div className="home-page"><section className="welcome-banner"><div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" /><div className="welcome-copy"><div className="eyebrow"><span className="status-dot" /> YOUR LOCAL-FIRST WORKBENCH</div><h1>Small tools.<br /><em>Serious</em> momentum.</h1><p>A focused kit for the tiny tasks that keep your day moving. Fast, private, right here in your browser.</p><button className="banner-cta" onClick={() => onNavigate('json')}>Open JSON formatter <ArrowRight size={15} /></button></div><div className="banner-art"><div className="art-ring ring-a" /><div className="art-ring ring-b" /><div className="art-core"><Bolt size={38} fill="currentColor" /></div><span className="art-chip chip-a">100% LOCAL</span><span className="art-chip chip-b">{tools.length} TOOLS</span><span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✳</span></div><div className="banner-index">01 <i>—</i> {String(tools.length).padStart(2, '0')}</div></section>
    {favorites.length > 0 && <section className="home-section"><div className="section-title"><div><span className="eyebrow">YOUR SHORTCUTS</span><h2>Favorites <span className="favorite-mark">★</span></h2></div><span className="section-count">{favorites.length} PINNED</span></div><div className="favorite-grid">{favorites.map(tool => <ToolCard key={tool.id} tool={tool} onClick={() => onNavigate(tool.id)} onFavorite={() => onFavorite(tool.id)} favorite />)}</div></section>}
    <section className="home-section"><div className="section-title"><div><span className="eyebrow">A GOOD PLACE TO START</span><h2>Most used</h2></div><span className="section-count">01 — 06</span></div><div className="tool-card-grid">{featured.map((tool,index) => <ToolCard key={tool.id} tool={tool} onClick={() => onNavigate(tool.id)} onFavorite={() => onFavorite(tool.id)} saved={saved} number={String(index+1).padStart(2,'0')} />)}</div></section>
    <section className="home-section category-section"><div className="section-title"><div><span className="eyebrow">BROWSE THE TOOLBOX</span><h2>Built for the little things</h2></div></div><div className="category-grid">{groups.map(group => { const GroupIcon = group.icon, count = tools.filter(t => t.category === group.id).length; return <button key={group.id} className="category-card" onClick={() => onNavigate(tools.find(t => t.category === group.id).id)}><span className="category-icon"><GroupIcon size={19} /></span><span><b>{group.label}</b><small>{count} ready-to-use tools</small></span><ArrowRight size={16} /></button> })}</div></section>
    <footer className="home-footer"><span><Bolt size={13} fill="currentColor" /> MADE FOR THE EVERYDAY DEV LOOP</span><span>YOUR INPUT STAYS ON THIS DEVICE</span></footer>
  </div>
}

function ToolCard({ tool, onClick, onFavorite, saved, number, favorite = false }) {
  const pinned = favorite || saved?.favorites.includes(tool.id)
  return <article className="tool-card"><button className="card-open" onClick={onClick}><span className="card-number">{number || <ToolBadge tool={tool} />}</span><h3>{tool.name}</h3><p>{tool.description}</p><span className="card-open-label">OPEN TOOL <ArrowRight size={13} /></span></button><button className={`card-pin ${pinned ? 'is-favorite' : ''}`} onClick={onFavorite} title={pinned ? 'Remove favorite' : 'Add favorite'} aria-label={`${pinned ? 'Remove' : 'Add'} ${tool.name} ${pinned ? 'from' : 'to'} favorites`}>★</button></article>
}

function ToolPage({ tool, saved, setToolData, toggleFavorite }) {
  const isFavorite = saved.favorites.includes(tool.id)
  const data = saved.tools[tool.id] || {}
  return <div className="tool-page"><div className="tool-heading"><div className="tool-heading-copy"><h1><ToolBadge tool={tool} large />{tool.name}</h1><p>{tool.description}</p></div><button aria-pressed={isFavorite} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${tool.name} ${isFavorite ? 'from' : 'to'} favorites`} className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(tool.id)}><span>★</span>{isFavorite ? 'Favorited' : 'Add favorite'}</button></div><div className="tool-workspace" style={{ height: data.workspaceHeight ? `${data.workspaceHeight}px` : undefined }}>{renderTool(tool.id, { data, setData: patch => setToolData(tool.id, patch) })}<ResizeHandle axis="y" label="Resize tool workspace height" value={data.workspaceHeight} min={240} max={2400} onChange={workspaceHeight => setToolData(tool.id, { workspaceHeight })} onReset={() => setToolData(tool.id, { workspaceHeight: undefined })} /></div><div className="tool-bottom-note"><span>POWERED BY YOUR BROWSER</span><span>YOUR DATA DOESN’T LEAVE THIS DEVICE <ShieldCheck size={13} /></span></div></div>
}

function Preferences({ saved, onClose, onTheme, onSaveSensitiveData, onClear, pwa }) {
  return <div className="modal-scrim" onClick={onClose}><section className="preferences-modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">WORKSPACE</span><h2>Saved data & preferences</h2></div><button className="icon-only" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className="preference-row"><div><b>Color theme</b><small>Choose how the toolbox looks.</small></div><select value={saved.theme} onChange={e => onTheme(e.target.value)}><option value="system">Follow system</option><option value="dark">Dark</option><option value="light">Light</option></select></div><div className="preference-row"><div><b>Always saved locally</b><small>Favorites, recent tools, theme, navigation, and tool options.</small></div><span className="local-tag"><ShieldCheck size={14} /> ON THIS DEVICE</span></div><div className="preference-row"><div><b id="save-sensitive-label">Save tool inputs & generated text</b><small id="save-sensitive-description">Off by default. When off, text stays in this session and previously saved text is removed.</small></div><input className="preference-checkbox" type="checkbox" checked={saved.saveSensitiveData === true} aria-labelledby="save-sensitive-label" aria-describedby="save-sensitive-description" onChange={e => onSaveSensitiveData(e.target.checked)} /></div><div className="preference-row install-preference"><div><b>Install Supercharger</b><small>{pwa.installed ? 'Installed. Open Supercharger from your apps.' : pwa.available ? 'Open in its own window and use tools offline.' : 'In Chrome, use the address bar install icon or the install option in the browser menu.'}</small>{pwa.error && <small role="alert">{pwa.error}</small>}</div>{pwa.installed ? <span className="local-tag"><Check size={14} /> INSTALLED</span> : pwa.available && <button className="install-app-button" onClick={pwa.install} disabled={pwa.installing}><Download size={14} />{pwa.installing ? 'Installing…' : 'Install app'}</button>}</div><div className="modal-footer"><span>Clear all saved toolbox data from this browser.</span><button className="danger-button" onClick={onClear}>Clear saved data</button></div></section></div>
}

export default function App() {
  const pwa = usePwaInstall()
  const [saved, setSaved] = useState(readSaved)
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
  useEffect(() => { document.documentElement.dataset.theme = saved.theme }, [saved.theme])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedSaved(saved))); setSaveError(false) }
    catch { setSaveError(true) }
  }, [saved])
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
  function clearSaved() { if (!window.confirm('Clear all saved inputs, generated text, favorites, and preferences from this browser?')) return; localStorage.removeItem(STORAGE_KEY); setSaved(emptySaved); setShowPreferences(false) }
  const [historyState, setHistoryState] = useState({ back: false, forward: false })
  useEffect(() => { const sync = () => { setHistoryState({ back: history.length > 1, forward: false }) }; addEventListener('popstate', sync); return () => removeEventListener('popstate', sync) }, [])

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ '--sidebar-width': `${Math.max(220, Math.min(480, Number(saved.sidebarWidth) || 260))}px` }}><Sidebar onSidebarWidth={sidebarWidth => setSaved(s => ({ ...s, sidebarWidth }))} active={active} saved={saved} search={search} setSearch={setSearch} onNavigate={navigate} onNavigateLicenses={() => navigate('licenses')} onFavorite={toggleFavorite} onReorderFavorite={reorderFavorite} onToggleSection={toggleSection} onClear={() => setShowPreferences(true)} pwa={pwa} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} /><div className="main-column"><TopBar current={current} theme={saved.theme} setTheme={theme => setSaved(s => ({ ...s, theme }))} menuOpen={isMobile ? mobileOpen : !sidebarCollapsed} onMenu={() => { if (isMobile) setMobileOpen(open => !open); else setSidebarCollapsed(collapsed => !collapsed) }} onOpenMenu={() => setMobileOpen(true)} onBack={() => history.back()} onForward={() => history.forward()} canBack={historyState.back} canForward={historyState.forward} search={search} setSearch={setSearch} /><main className="main-content">{active === 'licenses' ? <LicensesPage /> : active === 'home' || !tools.some(t => t.id === active) ? <HomePage saved={saved} onNavigate={navigate} onFavorite={toggleFavorite} /> : <ToolPage tool={current} saved={saved} setToolData={setToolData} toggleFavorite={toggleFavorite} />}</main>{saveError && <div className="save-warning">Browser storage is full. This session will continue without saving new changes.</div>}<StatusToast /></div>{showPreferences && <Preferences pwa={pwa} saved={saved} onClose={() => setShowPreferences(false)} onTheme={theme => setSaved(s => ({ ...s, theme }))} onSaveSensitiveData={saveSensitiveData => setSaved(s => ({ ...s, saveSensitiveData }))} onClear={clearSaved} />}</div>
}
