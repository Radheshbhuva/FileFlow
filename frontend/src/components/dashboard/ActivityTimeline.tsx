import type { ActivityItem, ActivityType } from '../../types/dashboard';
import EmptyState from './EmptyState';

const activityIcons: Record<ActivityType, JSX.Element> = {
  upload: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m-4 4 4-4 4 4M4 20h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 3v12m0 0 4-4m-4 4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  revoke: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
};

interface TimelineItemProps {
  item: ActivityItem;
  isLast: boolean;
}

function TimelineItem({ item, isLast }: TimelineItemProps) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast ? (
        <span className="absolute left-[17px] top-9 h-[calc(100%-12px)] w-px bg-slate-800" aria-hidden="true" />
      ) : null}
      <span className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/90 text-sky-300">
        {activityIcons[item.type]}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm text-slate-200">{item.description}</p>
        <time dateTime={item.timestamp} className="mt-1 block text-xs text-slate-500">
          {item.relativeTime}
        </time>
      </div>
    </li>
  );
}

interface ActivityTimelineProps {
  activity: ActivityItem[];
}

export default function ActivityTimeline({ activity }: ActivityTimelineProps) {
  return (
    <section aria-labelledby="activity-heading" className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 shadow-soft">
      <header>
        <h2 id="activity-heading" className="text-base font-semibold text-slate-100">
          Activity Timeline
        </h2>
        <p className="mt-1 text-sm text-slate-400">Recent account activity</p>
      </header>

      {activity.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No recent activity"
            description="Your file actions and account updates will appear here."
            icon={
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path
                  d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </div>
      ) : (
        <ol className="mt-6" aria-label="Recent activity">
          {activity.map((item, index) => (
            <TimelineItem key={item.id} item={item} isLast={index === activity.length - 1} />
          ))}
        </ol>
      )}
    </section>
  );
}
