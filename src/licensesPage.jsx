import { ExternalLink, Scale } from 'lucide-react'
import { npmPackages, referencedProjects } from './thirdPartyNotices.js'

function NoticeRow({ name, license, url, note }) {
  return (
    <article className="license-row">
      <div className="license-row-main">
        <h3>
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name}
              <ExternalLink size={13} aria-hidden />
            </a>
          ) : (
            name
          )}
        </h3>
        {note && <p>{note}</p>}
      </div>
      <span className="license-tag">{license}</span>
    </article>
  )
}

export function LicensesPage() {
  return (
    <div className="licenses-page">
      <div className="tool-heading">
        <div className="tool-heading-copy">
          <h1>
            <span className="tool-badge large">
              <Scale size={22} strokeWidth={1.8} />
            </span>
            Third-party notices
          </h1>
          <p>
            Projects and libraries this toolbox references or ships. Brad&apos;s Supercharger UI and JavaScript
            implementation are original unless noted below.
          </p>
        </div>
      </div>

      <section className="license-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">REFERENCES</span>
            <h2>Tools &amp; repos</h2>
          </div>
          <span className="section-count">{String(referencedProjects.length).padStart(2, '0')} LISTED</span>
        </div>
        <div className="license-list">
          {referencedProjects.map(item => (
            <NoticeRow key={item.name} {...item} />
          ))}
        </div>
      </section>

      <section className="license-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">RUNTIME</span>
            <h2>JavaScript packages</h2>
          </div>
          <span className="section-count">{String(npmPackages.length).padStart(2, '0')} PACKAGES</span>
        </div>
        <p className="license-lead">
          Production dependencies bundled with the app. Full license texts live in each package&apos;s npm
          metadata and in <code>package-lock.json</code>.
        </p>
        <div className="license-list compact">
          {npmPackages.map(item => (
            <NoticeRow key={item.name} {...item} />
          ))}
        </div>
      </section>

      <div className="tool-bottom-note">
        <span>NOT LEGAL ADVICE</span>
        <span>SEE LICENSES.MD IN THE REPO FOR FULL NOTICES</span>
      </div>
    </div>
  )
}
