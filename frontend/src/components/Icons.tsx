interface Props {
  size?: number;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const CheckIcon = ({ size = 12 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={3.2} aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const LockIcon = ({ size = 14 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const CloseIcon = ({ size = 12 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const PlusIcon = ({ size = 18 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2} aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const WarnIcon = ({ size = 14 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} aria-hidden="true">
    <path d="M12 3 2 20h20L12 3z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const ArrowIcon = ({ up }: { up: boolean }) => (
  <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden="true">
    <path d={up ? 'M5 1 9 8H1z' : 'M5 9 1 2h8z'} fill="currentColor" />
  </svg>
);

export const Logo = () => (
  <svg width={24} height={24} viewBox="0 0 34 34" fill="none" aria-hidden="true">
    <circle cx="17" cy="17" r="16" stroke="currentColor" strokeWidth="2.4" />
    <circle cx="17" cy="13" r="6" fill="#D9A13A" />
    <path d="M10 28V20M14 28V17M17 28V19M20 28V16M24 28V21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);
