// all the icons, drawn by hand. one stroke, no fill, so they take the text
// colour around them

function Icon({ children, className, title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || 'h-5 w-5'}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function WifiIcon(props) {
  return (
    <Icon {...props}>
      <path d="M2.5 9.2a15 15 0 0 1 19 0" />
      <path d="M5.8 12.7a10 10 0 0 1 12.4 0" />
      <path d="M9.1 16.1a5 5 0 0 1 5.8 0" />
      <circle cx="12" cy="19.3" r="0.9" />
    </Icon>
  );
}

export function DeviceIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M8.5 20h7" />
      <path d="M12 16.5V20" />
    </Icon>
  );
}

export function AppIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Icon>
  );
}

export function MediaIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" />
      <path d="M16 9.2a4.2 4.2 0 0 1 0 5.6" />
      <path d="M18.7 6.4a8 8 0 0 1 0 11.2" />
    </Icon>
  );
}

export function OtherIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4" />
      <circle cx="12" cy="16.8" r="0.9" />
    </Icon>
  );
}

export function HomeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.8V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.8" />
    </Icon>
  );
}

export function PlusIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </Icon>
  );
}

export function ListIcon(props) {
  return (
    <Icon {...props}>
      <path d="M8 6.5h12" />
      <path d="M8 12h12" />
      <path d="M8 17.5h12" />
      <circle cx="4" cy="6.5" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="17.5" r="1" />
    </Icon>
  );
}

export function SettingsIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5" />
      <path d="M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
    </Icon>
  );
}

export function SearchIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M15.6 15.6 20 20" />
    </Icon>
  );
}

export function WrenchIcon(props) {
  return (
    <Icon {...props}>
      <path d="M15.6 3.8a5.4 5.4 0 0 1 6.6 6.6l-3.4-1.6-2.6 1 1-2.6z" />
      <path d="M14.4 7.6 4.8 17.2a2.1 2.1 0 0 0 3 3l9.6-9.6" />
    </Icon>
  );
}

export function CheckIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4.8 12.6 9.4 17l9.8-10" />
    </Icon>
  );
}

export function ArrowRightIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15" />
      <path d="M13.6 6.2 19.5 12l-5.9 5.8" />
    </Icon>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <Icon {...props}>
      <path d="M19.5 12h-15" />
      <path d="M10.4 6.2 4.5 12l5.9 5.8" />
    </Icon>
  );
}

export function ChevronRightIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Icon>
  );
}

export function HelpIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.3" />
      <circle cx="12" cy="16.8" r="0.9" />
    </Icon>
  );
}

export function SkipIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5 12 12l-5.5 5.5" />
      <path d="M14.5 6.5 20 12l-5.5 5.5" />
    </Icon>
  );
}

export function AlertIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 4.5 20.4 19H3.6z" />
      <path d="M12 10v3.6" />
      <circle cx="12" cy="16.4" r="0.9" />
    </Icon>
  );
}

export function ClockIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 7.4V12l3.1 2" />
    </Icon>
  );
}

export function CloseIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="M17.5 6.5 6.5 17.5" />
    </Icon>
  );
}

export function CameraIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5h3l1.4-2h8.2l1.4 2h3v10h-17z" />
      <circle cx="12" cy="13.2" r="3.3" />
    </Icon>
  );
}

export function MicIcon(props) {
  return (
    <Icon {...props}>
      <rect x="9.2" y="3.5" width="5.6" height="10.4" rx="2.8" />
      <path d="M5.8 11.6a6.2 6.2 0 0 0 12.4 0" />
      <path d="M12 17.8V20.5" />
    </Icon>
  );
}

export function SparkIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 4.2 13.6 9 18.4 10.6 13.6 12.2 12 17 10.4 12.2 5.6 10.6 10.4 9z" />
    </Icon>
  );
}

export function ShieldIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.6 19 6v5.6c0 4-3 7-7 8.4-4-1.4-7-4.4-7-8.4V6z" />
      <path d="M9.2 12.1 11.4 14.3l4-4.2" />
    </Icon>
  );
}

export function UserIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.6" r="3.6" />
      <path d="M5 20c.9-3.4 3.6-5.3 7-5.3s6.1 1.9 7 5.3" />
    </Icon>
  );
}

export function FilterIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16" />
      <path d="M7 12h10" />
      <path d="M10 17.5h4" />
    </Icon>
  );
}

export function InfoIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2" />
      <circle cx="12" cy="8" r="0.9" />
    </Icon>
  );
}

export function PowerIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.8v7.4" />
      <path d="M7.2 6.6a7 7 0 1 0 9.6 0" />
    </Icon>
  );
}

export function PrintIcon(props) {
  return (
    <Icon {...props}>
      <path d="M7.5 9.5V4.5h9v5" />
      <path d="M7.5 17.5H5.5a1.5 1.5 0 0 1-1.5-1.5v-4.5a1.5 1.5 0 0 1 1.5-1.5h13a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 1-1.5 1.5h-2" />
      <path d="M7.5 14.5h9v5h-9z" />
    </Icon>
  );
}
