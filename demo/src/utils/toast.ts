type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface ToastOptions {
  variant?: ToastVariant;
  durationMs?: number;
}

const TOAST_ROOT_ID = 'rfp-demo-toast-root';

const variantStyles: Record<
  ToastVariant,
  { background: string; color: string; border: string }
> = {
  success: {
    background: '#e7f7ed',
    color: '#1f6f3f',
    border: '#86d1a7',
  },
  info: {
    background: '#eef3ff',
    color: '#1d3d8f',
    border: '#a9b8f5',
  },
  warning: {
    background: '#fff7e5',
    color: '#7a4d00',
    border: '#f1cf7a',
  },
  error: {
    background: '#fff0f0',
    color: '#9a2424',
    border: '#f1b2b2',
  },
};

function ensureToastRoot(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = document.getElementById(TOAST_ROOT_ID);
  if (existing) {
    return existing;
  }

  const root = document.createElement('div');
  root.id = TOAST_ROOT_ID;
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-atomic', 'false');
  root.style.position = 'fixed';
  root.style.right = '16px';
  root.style.bottom = '16px';
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.gap = '10px';
  root.style.zIndex = '999999';
  root.style.maxWidth = 'min(440px, calc(100vw - 32px))';
  document.body.appendChild(root);
  return root;
}

export function showToast(message: string, options: ToastOptions = {}): void {
  const root = ensureToastRoot();
  if (!root) {
    return;
  }

  const variant = options.variant ?? 'info';
  const durationMs = options.durationMs ?? 2800;
  const palette = variantStyles[variant];

  const toast = document.createElement('div');
  toast.role = 'status';
  toast.style.border = `1px solid ${palette.border}`;
  toast.style.background = palette.background;
  toast.style.color = palette.color;
  toast.style.padding = '10px 12px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '13px';
  toast.style.lineHeight = '1.35';
  toast.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  toast.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(8px)';
  toast.style.transition = 'opacity 140ms ease, transform 140ms ease';
  toast.textContent = message;

  root.prepend(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  const remove = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    window.setTimeout(() => {
      toast.remove();
    }, 160);
  };

  window.setTimeout(remove, durationMs);
}
