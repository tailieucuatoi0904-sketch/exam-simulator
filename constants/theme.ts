export const Theme = {
  colors: {
    primary: '#4361EE', // Modern vibrant blue
    secondary: '#3A0CA3', // Deep indigo
    accent: '#F72585', // Neon pink for accents
    success: '#4CC9F0', // Light blue/cyan for correct answers
    error: '#EF233C', // Red for wrong answers
    warning: '#FFB703', // Yellow for Mark for Review
    
    // Backgrounds
    background: '#F8F9FA', // Light grey/white
    card: '#FFFFFF',
    surface: '#FFFFFF',
    
    // Text
    text: '#2B2D42',
    textLight: '#8D99AE',
    textInverse: '#FFFFFF',
    
    // Borders
    border: '#E5E5E5',
    
    // Shadows
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 14, fontWeight: 'normal', color: '#8D99AE' },
  }
};

export const Colors = Theme.colors;
