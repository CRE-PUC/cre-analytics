export function injectStyles(id: string, cssText: string) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = cssText;
  document.head.appendChild(el);
}
