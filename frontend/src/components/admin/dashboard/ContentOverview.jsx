import { Link } from 'react-router-dom'
import { ArrowRight, FileCheck2, FilePen, Inbox } from 'lucide-react'
import { formatShortDate } from '../../../utils/format'
import DashCard from './DashCard'

/** Published vs draft articles. */
export function ContentOverview({ blogs, delay }) {
  const link = (
    <Link to="/admin/blogs" className="group inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-secondary/50">
      View Blogs <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
  const share = blogs.total ? Math.round((blogs.published / blogs.total) * 100) : 0

  return (
    <DashCard title="Content Overview" subtitle="Wellness Wisdom articles" action={link} delay={delay}>
      {blogs.total === 0 ? (
        <p className="py-8 text-center text-[13px] text-text-soft">No published articles</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Published', value: blogs.published, icon: FileCheck2 },
              { label: 'Drafts', value: blogs.drafts, icon: FilePen },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-canvas p-4">
                <Icon className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
                <p className="mt-3 text-[26px] font-semibold leading-none tabular-nums text-text">{value}</p>
                <p className="mt-1 text-[12px] text-text-soft">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-[12px] text-text-soft">
              <span>Published share</span>
              <span className="font-semibold text-text">{share}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
              <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
            </div>
            <p className="mt-3 text-[12px] text-text-soft">
              {blogs.month} created this month · {blogs.year} this year
            </p>
          </div>
        </>
      )}
    </DashCard>
  )
}

/** Latest contact-form messages. */
export function RecentMessages({ contacts, unread, delay }) {
  const link = (
    <Link to="/admin/contacts" className="group inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-secondary/50">
      Messages <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
  const latest = (contacts ?? []).slice(0, 4)

  return (
    <DashCard title="Recent Messages" subtitle={`${unread} unread`} action={link} bodyClass="px-2 pb-3 sm:px-3" delay={delay}>
      {!latest.length ? (
        <div className="flex flex-col items-center py-8 text-center text-[13px] text-text-soft">
          <Inbox className="mb-2 h-5 w-5 text-text-soft/70" aria-hidden="true" />
          No new messages
        </div>
      ) : (
        <ul>
          {latest.map((c) => (
            <li key={c._id}>
              <Link to="/admin/contacts" className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-canvas">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.status === 'New' ? 'bg-accent' : 'bg-border'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-[13px] text-text ${c.status === 'New' ? 'font-semibold' : 'font-medium'}`}>
                      {c.name}
                      {c.status === 'New' && <span className="sr-only"> (unread)</span>}
                    </span>
                    <span className="shrink-0 text-[11px] text-text-soft">{formatShortDate(c.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-text-soft">{c.message}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  )
}
