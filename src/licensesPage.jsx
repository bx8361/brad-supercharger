import { ExternalLink, Scale } from 'lucide-react'
import { t } from './i18n.js'
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
            {t('Third-party notices')}
          </h1>
          <p>
            {t("Projects and libraries this toolbox references or ships. Brad's Supercharger UI and JavaScript implementation are original unless noted below.")}
          </p>
        </div>
      </div>

      <section className="license-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">{t("REFERENCES")}</span>
            <h2>{t('Tools & repos')}</h2>
          </div>
          <span className="section-count">{t('{count} LISTED', { count: String(referencedProjects.length).padStart(2, '0') })}</span>
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
            <span className="eyebrow">{t("RUNTIME")}</span>
            <h2>{t("JavaScript packages")}</h2>
          </div>
          <span className="section-count">{t('{count} PACKAGES', { count: String(npmPackages.length).padStart(2, '0') })}</span>
        </div>
        <p className="license-lead">
          {t('Production dependencies bundled with the app. Full license texts live in each package’s npm metadata and in package-lock.json.')}
        </p>
        <div className="license-list compact">
          {npmPackages.map(item => (
            <NoticeRow key={item.name} {...item} />
          ))}
        </div>
      </section>

      <div className="tool-bottom-note">
        <span>{t("NOT LEGAL ADVICE")}</span>
        <span>{t("SEE LICENSES.MD IN THE REPO FOR FULL NOTICES")}</span>
      </div>
    </div>
  )
}
