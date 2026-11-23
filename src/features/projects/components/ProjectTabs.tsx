import React, { useRef, useState } from 'react'

type TabId = 'overview' | 'team'

export interface ProjectTabsProps {
  /** Overview tab panel content. */
  overview: React.ReactNode
  /** Team tab panel content. */
  team: React.ReactNode
}

const TAB_ORDER: TabId[] = ['overview', 'team']

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  team: 'Team',
}

function tabId(id: TabId): string {
  return `project-tab-${id}`
}

function panelId(id: TabId): string {
  return `project-panel-${id}`
}

/**
 * Accessible project section tabs.
 *
 * Renders the Overview and Team tabs with a roving tabindex, Arrow/Home/End
 * keyboard navigation, and a visible 2px teal underline on the active tab.
 * Both panels stay mounted (the inactive one is hidden) so `aria-controls`
 * always resolves.
 */
export function ProjectTabs({ overview, team }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    overview: null,
    team: null,
  })

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    let nextIndex = currentIndex

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const direction = event.key === 'ArrowRight' ? 1 : -1
      nextIndex =
        (currentIndex + direction + TAB_ORDER.length) % TAB_ORDER.length
    } else if (event.key === 'Home') {
      event.preventDefault()
      nextIndex = 0
    } else if (event.key === 'End') {
      event.preventDefault()
      nextIndex = TAB_ORDER.length - 1
    }

    if (nextIndex !== currentIndex) {
      const nextTab = TAB_ORDER[nextIndex]
      setActiveTab(nextTab)
      tabRefs.current[nextTab]?.focus()
    }
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Project sections"
        className="flex gap-1 border-b border-[var(--border)]"
      >
        {TAB_ORDER.map((id) => {
          const isActive = activeTab === id

          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el
              }}
              type="button"
              role="tab"
              id={tabId(id)}
              aria-selected={isActive}
              aria-controls={panelId(id)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(id)}
              onKeyDown={handleKeyDown}
              className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-bold transition-colors focus:outline-hidden focus:ring-2 focus:ring-[var(--focus-ring)] ${
                isActive
                  ? 'border-[var(--primary)] text-[var(--ink)]'
                  : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              {TAB_LABELS[id]}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId('overview')}
        aria-labelledby={tabId('overview')}
        hidden={activeTab !== 'overview'}
      >
        {overview}
      </div>

      <div
        role="tabpanel"
        id={panelId('team')}
        aria-labelledby={tabId('team')}
        hidden={activeTab !== 'team'}
      >
        {team}
      </div>
    </div>
  )
}
