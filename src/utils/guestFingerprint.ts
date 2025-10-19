/**
 * Generate a unique fingerprint for guest users
 * Used to track AI usage limits for anonymous users
 */
export const getGuestFingerprint = (): string => {
  // Check if already generated
  const existing = localStorage.getItem('guest_fingerprint');
  if (existing) return existing;
  
  // Generate unique ID based on browser characteristics
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ].join('|');
  
  // Hash it to create a unique ID
  const hash = btoa(fingerprint).substring(0, 32);
  const guestId = `guest_${hash}_${Date.now()}`;
  
  localStorage.setItem('guest_fingerprint', guestId);
  return guestId;
};
