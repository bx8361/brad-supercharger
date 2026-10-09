import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { mountPlayground } from './app.ts'
import './styles.css'

let sessionCsv = ''

export default function DataPlaygroundTool({ view, Editor }) {
  const root = useRef(null)
  const [host, setHost] = useState(null)
  const [csv, setCsv] = useState(sessionCsv)
  useLayoutEffect(() => mountPlayground(root.current, view, setHost, () => sessionCsv), [view])
  return <>
    <div ref={root} className="data-playground" />
    {host && createPortal(<Editor label="CSV input" value={csv} rows={8} wrap={false}
      placeholder="Paste CSV with header row…" onChange={value => { sessionCsv = value; setCsv(value) }} />, host)}
  </>
}
