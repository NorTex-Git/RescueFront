import type { ComponentType, SVGProps } from 'react'
import {
  AlignLeft,
  ArrowDown,
  ArrowDownToBracket,
  ArrowRightToBracket,
  ArrowUpRightFromSquare,
  ArrowsRepeat,
  Award,
  Ban,
  Barcode,
  Bars,
  Bell,
  Book,
  Building,
  Bullhorn,
  CalendarMonth,
  Chart,
  ChartLineUp,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Close,
  CloudArrowUp,
  Cog,
  CubesStacked,
  DesktopPc,
  Dollar,
  Edit,
  Envelope,
  ExclamationCircle,
  Eye,
  EyeSlash,
  File,
  FileImage,
  FileVideo,
  Filter,
  Fingerprint,
  FloppyDisk,
  Folder,
  FolderOpen,
  FolderPlus,
  Image,
  Layers,
  Lock,
  MapPin,
  Moon,
  OpenDoor,
  Palette,
  PaperClip,
  Pen,
  Plus,
  ProfileCard,
  Refresh,
  Server,
  Shield,
  Sun,
  Tag,
  Tools,
  Tracking,
  TrashBin,
  Upload,
  User,
  Users,
  UsersGroup,
  VideoCamera,
  VolumeMute,
  VolumeUp,
} from 'flowbite-react-icons/outline'

import { cn } from '@/lib/utils'

type SvgIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>

/**
 * Puente central hacia Flowbite Icons.
 *
 * Acepta temporalmente los nombres semánticos históricos (`fas fa-user`) para que
 * los recursos declarativos no dependan de componentes concretos. El resultado
 * renderizado siempre es un SVG de Flowbite; las clases auxiliares se conservan.
 */
const icons: Record<string, SvgIcon> = {
  'fa-align-left': AlignLeft,
  'fa-arrow-down': ArrowDown,
  'fa-ban': Ban,
  'fa-barcode': Barcode,
  'fa-bars': Bars,
  'fa-bell': Bell,
  'fa-bell-slash': VolumeMute,
  'fa-book': Book,
  'fa-boxes-stacked': CubesStacked,
  'fa-building': Building,
  'fa-bullhorn': Bullhorn,
  'fa-calendar': CalendarMonth,
  'fa-chart-line': ChartLineUp,
  'fa-check': Check,
  'fa-chevron-down': ChevronDown,
  'fa-chevron-left': ChevronLeft,
  'fa-chevron-right': ChevronRight,
  'fa-circle-check': CheckCircle,
  'fa-clock': Clock,
  'fa-cloud-arrow-down': ArrowDownToBracket,
  'fa-cloud-upload-alt': CloudArrowUp,
  'fa-cogs': Cog,
  'fa-copyright': Award,
  'fa-cubes': CubesStacked,
  'fa-dollar-sign': Dollar,
  'fa-envelope': Envelope,
  'fa-exclamation-triangle': ExclamationCircle,
  'fa-external-link-alt': ArrowUpRightFromSquare,
  'fa-eye': Eye,
  'fa-eye-slash': EyeSlash,
  'fa-file': File,
  'fa-filter-circle-xmark': Filter,
  'fa-fingerprint': Fingerprint,
  'fa-folder': Folder,
  'fa-folder-open': FolderOpen,
  'fa-folder-plus': FolderPlus,
  'fa-image': Image,
  'fa-layer-group': Layers,
  'fa-list-check': ClipboardList,
  'fa-location-dot': MapPin,
  'fa-lock': Lock,
  'fa-map-pin': MapPin,
  'fa-microchip': DesktopPc,
  'fa-moon': Moon,
  'fa-palette': Palette,
  'fa-paperclip': PaperClip,
  'fa-pen': Pen,
  'fa-pen-to-square': Edit,
  'fa-photo-film': FileImage,
  'fa-photo-video': FileVideo,
  'fa-plus': Plus,
  'fa-repeat': ArrowsRepeat,
  'fa-right-to-bracket': ArrowRightToBracket,
  'fa-rotate': Refresh,
  'fa-rotate-right': Refresh,
  'fa-satellite-dish': Tracking,
  'fa-save': FloppyDisk,
  'fa-shield-alt': Shield,
  'fa-shield-halved': Shield,
  'fa-sign-out-alt': OpenDoor,
  'fa-sun': Sun,
  'fa-tachometer-alt': Chart,
  'fa-tags': Tag,
  'fa-times': Close,
  'fa-toolbox': Tools,
  'fa-tower-broadcast': Server,
  'fa-trash': TrashBin,
  'fa-triangle-exclamation': ExclamationCircle,
  'fa-upload': Upload,
  'fa-user': User,
  'fa-user-friends': UsersGroup,
  'fa-users': Users,
  'fa-user-tag': ProfileCard,
  'fa-video': VideoCamera,
  'fa-volume-high': VolumeUp,
}

export function Icon({
  name,
  className,
  ...props
}: Omit<SVGProps<SVGSVGElement>, 'name'> & { name?: string }) {
  // `className` también puede contener el identificador legado durante la migración;
  // se separa del resto para que ninguna clase de Font Awesome llegue al DOM.
  const tokens = [name, className].filter(Boolean).join(' ').split(/\s+/).filter(Boolean)
  const iconName = tokens.find((token) => token.startsWith('fa-')) ?? ''
  const Component = icons[iconName] ?? ExclamationCircle
  const utilityClasses = tokens.filter(
    (token) => token !== 'fas' && token !== 'far' && token !== 'fab' && !token.startsWith('fa-'),
  )

  return (
    <Component
      aria-hidden={props['aria-label'] ? undefined : true}
      className={cn('inline-block size-[1em] shrink-0', utilityClasses)}
      {...props}
    />
  )
}
