import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { spacing } from '../theme/spacing';

/** Extra scroll padding so list content is not hidden behind the bottom tab bar. */
export function useTabBarInset(extra = spacing.md) {
  const tabBarHeight = useBottomTabBarHeight();
  return tabBarHeight + extra;
}
