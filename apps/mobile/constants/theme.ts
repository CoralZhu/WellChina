export const Colors = {
  primary: '#C0392B',
  primaryLight: '#E74C3C',
  primaryDark: '#922B21',
  gold: '#D4AC0D',
  goldLight: '#F7DC6F',
  navy: '#1A252F',
  navyLight: '#2C3E50',
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  border: '#E8EAED',
  textPrimary: '#1A252F',
  textSecondary: '#5D6D7E',
  textMuted: '#95A5A6',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  white: '#FFFFFF',
  black: '#000000',
  sosRed: '#C0392B',
  overlay: 'rgba(0,0,0,0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export type FontScale = 'small' | 'medium' | 'large';

export const getFontSize = (scale: FontScale): typeof FontSize => {
  const multiplier = {
    small: 0.85,
    medium: 1,
    large: 1.2,
  }[scale];

  return {
    xs: FontSize.xs * multiplier,
    sm: FontSize.sm * multiplier,
    md: FontSize.md * multiplier,
    lg: FontSize.lg * multiplier,
    xl: FontSize.xl * multiplier,
    xxl: FontSize.xxl * multiplier,
    xxxl: FontSize.xxxl * multiplier,
  };
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};
