import {
  UtensilsCrossed, Car, ShoppingBag, Tv2, Zap, Heart,
  Plane, PiggyBank, TrendingUp, MoreHorizontal,
} from 'lucide-react';
import { getCategoryById } from '../../utils/categories';

const ICON_MAP = {
  UtensilsCrossed, Car, ShoppingBag, Tv2, Zap, Heart,
  Plane, PiggyBank, TrendingUp, MoreHorizontal,
};

export default function Badge({ categoryId, size = 'md' }) {
  const cat  = getCategoryById(categoryId);
  const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
  return (
    <span
      className={`badge badge-${size}`}
      style={{ background: cat.bg, color: cat.color }}
    >
      <Icon size={size === 'sm' ? 10 : 12} strokeWidth={2.5} />
      {cat.name}
    </span>
  );
}
