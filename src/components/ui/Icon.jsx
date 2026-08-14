const FILLED_ICONS = {
  eye: {
    viewBox: '0 0 576 512',
    paths: [
      'M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z',
    ],
  },
  pencil: {
    viewBox: '0 0 576 512',
    paths: [
      'M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z',
    ],
  },
  trash: {
    viewBox: '0 0 24 24',
    paths: ['M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'],
  },
}

export function Icon({ name, className = 'h-5 w-5', strokeWidth = '1.8' }) {
  const filled = FILLED_ICONS[name]
  if (filled) {
    return (
      <svg
        viewBox={filled.viewBox}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        {filled.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    )
  }

  const icons = {
    logo: (
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" />
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <circle cx="16.5" cy="9" r="2.6" />
        <path d="M3.5 19.5c.8-3.2 3.2-5 5.5-5s4.7 1.8 5.5 5" />
        <path d="M13.5 19.5c.4-1.8 1.6-3.2 3.2-3.6" />
      </>
    ),
    reception: (
      <>
        <circle cx="12" cy="7.5" r="3" />
        <path d="M6.5 19.5c.7-3.4 3-5.2 5.5-5.2s4.8 1.8 5.5 5.2" />
        <path d="M5.5 8.5A6.5 6.5 0 0 0 12 14.5" />
        <path d="M18.5 8.5A6.5 6.5 0 0 1 12 14.5" />
        <path d="M5.5 8.5v2.2M18.5 8.5v2.2" />
      </>
    ),
    stethoscope: (
      <>
        <path d="M6 4v7a4 4 0 0 0 8 0V4" />
        <circle cx="10" cy="16.5" r="2.5" />
        <path d="M12.4 15.2A6 6 0 0 0 18 20.5h1.5" />
        <circle cx="20.5" cy="20.5" r="1.8" />
        <circle cx="6" cy="4" r="1.6" />
        <circle cx="14" cy="4" r="1.6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      </>
    ),
    pill: (
      <>
        <rect x="7" y="3.5" width="10" height="17" rx="5" transform="rotate(35 12 12)" />
        <path d="M8.2 14.8l7.6-7.6" />
      </>
    ),
    file: (
      <>
        <path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" />
        <path d="M14 3.5V9h5.5M8.5 13h7M8.5 16.5h5" />
      </>
    ),
    building: (
      <>
        <path d="M5 21V5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5V21" />
        <path d="M3 21h18M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M9 16h1.5M13.5 16H15" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4V3.5z" />
        <path d="M9 8h6M9 12h6M9 16h3.5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 19.5c1-3.6 3.4-5.4 7-5.4s6 1.8 7 5.4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4.5H7A1.5 1.5 0 0 0 5.5 6v12A1.5 1.5 0 0 0 7 19.5h3" />
        <path d="M10 12h9M16 8.5L19.5 12 16 15.5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12M18 6L6 18" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="M16 16l4 4" />
      </>
    ),
    plus: (
      <path d="M12 5v14M5 12h14" />
    ),
    chevronLeft: (
      <path d="M14.5 6L8.5 12l6 6" />
    ),
    chevronRight: (
      <path d="M9.5 6l6 6-6 6" />
    ),
    alert: (
      <>
        <path d="M12 4.5L21 19.5H3L12 4.5z" />
        <path d="M12 10v4.5M12 17.2v.3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3.2 2" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.2 12.2l2.4 2.4 5.2-5.2" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}
