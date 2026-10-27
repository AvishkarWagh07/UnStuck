import { AppIcon, DeviceIcon, MediaIcon, OtherIcon, WifiIcon } from '../components/ui/Icons.jsx';

// the five problem categories, shared by the describe and history screens
// label is also written into the problem text so no extra db field is needed
export const CATEGORIES = [
  {
    key: 'wifi',
    label: 'Wi-Fi / Internet',
    Icon: WifiIcon,
    example: 'My Wi-Fi keeps disconnecting'
  },
  {
    key: 'device',
    label: 'Device',
    Icon: DeviceIcon,
    example: 'My laptop will not turn on'
  },
  {
    key: 'software',
    label: 'App / Software',
    Icon: AppIcon,
    example: 'The app closes as soon as I open it'
  },
  {
    key: 'media',
    label: 'Audio / Video',
    Icon: MediaIcon,
    example: 'There is no sound coming out'
  },
  {
    key: 'other',
    label: 'Other',
    Icon: OtherIcon,
    example: 'The kitchen tap will not stop dripping'
  }
];

export function categoryByKey(key) {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) return CATEGORIES[i];
  }
  return null;
}

export function categoryByLabel(label) {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].label === label) return CATEGORIES[i];
  }
  return null;
}
