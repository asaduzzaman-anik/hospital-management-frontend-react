export function Icon({ name, className = 'h-5 w-5' }) {
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
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}
