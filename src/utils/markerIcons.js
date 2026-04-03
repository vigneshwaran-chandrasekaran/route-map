// Shared marker icon definitions used across all map implementations.
// Each icon uses an emoji for universal rendering (no external assets needed).

export const MARKER_ICONS = {
  default:  { label: 'Default',     emoji: '📍', color: '#646cff' },
  atm:      { label: 'ATM',         emoji: '🏧', color: '#0ea5e9' },
  hotel:    { label: 'Hotel',       emoji: '🏨', color: '#8b5cf6' },
  office:   { label: 'Office',      emoji: '🏢', color: '#6366f1' },
  school:   { label: 'School',      emoji: '🏫', color: '#f59e0b' },
  hospital: { label: 'Hospital',    emoji: '🏥', color: '#ef4444' },
  store:    { label: 'Store',       emoji: '🏬', color: '#10b981' },
  food:     { label: 'Restaurant',  emoji: '🍽️', color: '#f97316' },
  fuel:     { label: 'Fuel',        emoji: '⛽', color: '#64748b' },
  parking:  { label: 'Parking',     emoji: '🅿️', color: '#3b82f6' },
  temple:   { label: 'Temple',      emoji: '🛕', color: '#d97706' },
  park:     { label: 'Park',        emoji: '🌳', color: '#22c55e' },
  gym:      { label: 'Gym',         emoji: '🏋️', color: '#e11d48' },
  airport:  { label: 'Airport',     emoji: '✈️', color: '#0284c7' },
  train:    { label: 'Train',       emoji: '🚆', color: '#7c3aed' },
  bus:      { label: 'Bus Stop',    emoji: '🚌', color: '#ea580c' },
  home:     { label: 'Home',        emoji: '🏠', color: '#14b8a6' },
  cafe:     { label: 'Café',        emoji: '☕', color: '#92400e' },
  bank:     { label: 'Bank',        emoji: '🏦', color: '#1d4ed8' },
  ground:   { label: 'Ground',      emoji: '🏟️', color: '#059669' },
};

export const DEFAULT_ICON = 'default';

// Get icon definition (safe fallback)
export function getMarkerIcon(iconKey) {
  return MARKER_ICONS[iconKey] || MARKER_ICONS.default;
}
