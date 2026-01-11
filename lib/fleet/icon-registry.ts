import { 
  CarFront, Target, Bus, Truck, Forklift, Container, 
  Wrench, Ghost, Bike, Tractor, HelpCircle,
  Zap, Crosshair, Anchor, Plane, Rocket, 
  CircleDot, Navigation, Car
} from 'lucide-react';

// The "Menu" of available icons you can choose from in the Admin Panel
export const AVAILABLE_ICONS: Record<string, any> = {
  'CarFront': CarFront,
  'Car': Car,
  'Target': Target,
  'Crosshair': Crosshair,
  'Bus': Bus,
  'Truck': Truck,
  'Forklift': Forklift,
  'Tractor': Tractor,
  'Container': Container,
  'Wrench': Wrench,
  'Ghost': Ghost,
  'Bike': Bike,
  'Zap': Zap,
  'Anchor': Anchor,
  'Plane': Plane,
  'Rocket': Rocket,
  'CircleDot': CircleDot, // Generic dot
  'Navigation': Navigation, // Generic arrow
  'HelpCircle': HelpCircle
};

export type IconName = keyof typeof AVAILABLE_ICONS;