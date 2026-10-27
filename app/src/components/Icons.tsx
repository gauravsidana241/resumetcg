import type { SVGProps } from 'react'

function Icon({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d={d} />
    </svg>
  )
}

type P = SVGProps<SVGSVGElement>

export const FlameIcon = (p: P) => (
  <Icon
    d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C9 9 9 11 10.5 11.5 10 8 11 4.5 12 2zM6.5 14a5.5 5.5 0 0 0 11 0"
    {...p}
  />
)
export const HomeIcon = (p: P) => <Icon d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...p} />
export const BinderIcon = (p: P) => (
  <Icon d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM4 16a4 4 0 0 1 4-4h12M9 8h6" {...p} />
)
export const CloseIcon = (p: P) => <Icon d="M6 6l12 12M18 6 6 18" {...p} />
export const ArrowUpIcon = (p: P) => <Icon d="M12 19V5M5 12l7-7 7 7" {...p} />
export const CheckIcon = (p: P) => <Icon d="M5 12.5 10 17 19 7" {...p} />
export const RotateIcon = (p: P) => <Icon d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" {...p} />
export const LogoutIcon = (p: P) => <Icon d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" {...p} />
