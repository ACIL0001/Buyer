// Shared dashboard UI helpers — used by all 6 dashboard pages
import React from 'react';

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface StatusConfig {
  label: string;
  color: string;     // text color
  bg: string;        // background color
  dot?: boolean;     // show pulse dot
}

const badgeBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 10px',
  borderRadius: '20px',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap',
};

export function StatusBadge({ config }: { config: StatusConfig }) {
  return (
    <span style={{ ...badgeBase, color: config.color, background: config.bg }}>
      {config.dot && (
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
          animation: 'dbPulse 1.5s infinite',
        }} />
      )}
      {config.label}
    </span>
  );
}

// ─── Pill Filter Chips ────────────────────────────────────────────────────────
interface PillChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  color?: string;
}

export function PillChip({ label, active, onClick, count, color = 'var(--primary-auction-color)' }: PillChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '20px',
        border: `1.5px solid ${active ? color : '#e2e8f0'}`,
        background: active ? color : '#ffffff',
        color: active ? '#ffffff' : '#64748b',
        fontWeight: 600,
        fontSize: '0.8rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: active ? `0 4px 12px ${color}40` : '0 1px 4px rgba(0,0,0,0.06)',
        outline: 'none',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
          color: active ? '#ffffff' : '#475569',
          borderRadius: '10px',
          padding: '1px 7px',
          fontSize: '0.7rem',
          fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
interface ActionBtnProps {
  label: string;
  icon?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'outlined' | 'danger' | 'success' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--primary-auction-color)', color: '#fff', border: '1.5px solid var(--primary-auction-color)' },
  outlined: { background: 'transparent', color: 'var(--primary-auction-color)', border: '1.5px solid var(--primary-auction-color)' },
  danger: { background: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444' },
  success: { background: '#10b981', color: '#fff', border: '1.5px solid #10b981' },
  ghost: { background: 'rgba(0,99,177,0.06)', color: 'var(--primary-auction-color)', border: '1.5px solid transparent' },
};

export function ActionBtn({ label, icon, onClick, href, variant = 'outlined', disabled = false, size = 'sm' }: ActionBtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: size === 'sm' ? '5px 12px' : '8px 18px',
    borderRadius: '8px',
    fontSize: size === 'sm' ? '0.78rem' : '0.875rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.18s ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    ...variantStyles[variant],
  };

  if (href && !disabled) {
    return (
      <a href={href} style={base}>
        {icon && <span>{icon}</span>}
        {label}
      </a>
    );
  }

  return (
    <button onClick={disabled ? undefined : onClick} style={base} disabled={disabled}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ─── Header Add Button ────────────────────────────────────────────────────────
export function HeaderAddBtn({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        background: 'rgba(255,255,255,0.2)',
        color: '#ffffff',
        borderRadius: '10px',
        fontWeight: 700,
        fontSize: '0.9rem',
        textDecoration: 'none',
        border: '1.5px solid rgba(255,255,255,0.35)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>＋</span>
      {label}
    </a>
  );
}

// ─── Pill Tabs ────────────────────────────────────────────────────────────────
interface PillTab {
  value: string;
  label: string;
  count?: number;
}

interface PillTabsProps {
  tabs: PillTab[];
  value: string;
  onChange: (val: string) => void;
}

export function PillTabs({ tabs, value, onChange }: PillTabsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '6px',
      background: '#f1f5f9',
      borderRadius: '12px',
      width: 'fit-content',
      marginBottom: '20px',
    }}>
      {tabs.map(tab => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: isActive ? '#ffffff' : 'transparent',
              color: isActive ? 'var(--primary-auction-color)' : '#64748b',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                background: isActive ? 'var(--primary-auction-color)' : '#e2e8f0',
                color: isActive ? '#fff' : '#475569',
                borderRadius: '10px',
                padding: '1px 7px',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Table Styles ─────────────────────────────────────────────────────────────
export const tableStyles = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '12px',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  } as React.CSSProperties,

  searchInput: {
    padding: '9px 14px 9px 36px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.875rem',
    outline: 'none',
    width: '240px',
    background: '#f8fafc',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  searchWrap: {
    position: 'relative' as const,
  },

  searchIcon: {
    position: 'absolute' as const,
    left: '11px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '15px',
    pointerEvents: 'none' as const,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.875rem',
  } as React.CSSProperties,

  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontWeight: 700,
    fontSize: '0.72rem',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    background: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle' as const,
    color: '#334155',
  } as React.CSSProperties,

  trHover: {
    transition: 'background 0.15s ease',
    cursor: 'pointer',
  } as React.CSSProperties,

  avatar: (color = 'var(--primary-auction-color)') => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: `${color}20`,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.875rem',
    flexShrink: 0,
    border: `1.5px solid ${color}30`,
  } as React.CSSProperties),

  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 24px',
  } as React.CSSProperties,

  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap' as const,
    gap: '12px',
  } as React.CSSProperties,

  pageBtn: (active = false) => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: active ? 'none' : '1.5px solid #e2e8f0',
    background: active ? 'var(--primary-auction-color)' : '#ffffff',
    color: active ? '#ffffff' : '#475569',
    fontWeight: active ? 700 : 500,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  } as React.CSSProperties),
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open, title, message, onConfirm, onCancel,
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '16px', padding: '28px',
        maxWidth: '420px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'dbSlideUp 0.2s ease',
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
        <p style={{ margin: '0 0 24px 0', color: '#64748b', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '9px 18px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{
            padding: '9px 18px', borderRadius: '8px', border: 'none',
            background: danger ? '#ef4444' : 'var(--primary-auction-color)', color: '#fff',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Global Keyframes (inject once) ──────────────────────────────────────────
export function DashboardKeyframes() {
  return (
    <style>{`
      @keyframes dbPulse {         0%, 100% { opacity: 1; transform: scale(1); }         50% { opacity: 0.6; transform: scale(1.3); }       }
      @keyframes dbShimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      @keyframes dbSlideUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .db-row:hover { background: #f8fafc !important; }
      .db-row:hover td:first-child { border-left: 3px solid var(--primary-auction-color); }
    `}</style>
  );
}

// ─── Simple Pagination ────────────────────────────────────────────────────────
interface SimplePaginationProps {
  page: number;        // 0-indexed
  rowsPerPage: number;
  total: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (r: number) => void;
}

export function SimplePagination({ page, rowsPerPage, total, onPageChange, onRowsPerPageChange }: SimplePaginationProps) {
  const totalPages = Math.ceil(total / rowsPerPage);
  const start = page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, total);

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i;
    if (page < 3) return i;
    if (page >= totalPages - 3) return totalPages - 5 + i;
    return page - 2 + i;
  });

  return (
    <div style={tableStyles.pagination}>
      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
        {start}–{end} sur {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <select
          value={rowsPerPage}
          onChange={e => { onRowsPerPageChange(Number(e.target.value)); onPageChange(0); }}
          style={{
            padding: '5px 8px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
            fontSize: '0.8rem', cursor: 'pointer', background: '#fff', fontFamily: 'inherit',
          }}
        >
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button onClick={() => onPageChange(0)} disabled={page === 0} style={tableStyles.pageBtn(false)}>«</button>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 0} style={tableStyles.pageBtn(false)}>‹</button>
        {pages.map(p => (
          <button key={p} onClick={() => onPageChange(p)} style={tableStyles.pageBtn(p === page)}>
            {p + 1}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} style={tableStyles.pageBtn(false)}>›</button>
        <button onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} style={tableStyles.pageBtn(false)}>»</button>
      </div>
    </div>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────
export const ShimmerBox = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{
    background: '#f1f5f9',
    backgroundImage: 'linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 40px, #f1f5f9 80px)',
    backgroundSize: '1000px 100%',
    animation: 'dbShimmer 2s infinite linear',
    borderRadius: 8,
    ...style
  }} />
);

export function ListPageSkeleton({ accentColor = 'var(--primary-auction-color)' }: { accentColor?: string }) {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <DashboardKeyframes />
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', minHeight: '80vh' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <ShimmerBox style={{ width: 200, height: 28, marginBottom: 8 }} />
            <ShimmerBox style={{ width: 120, height: 16 }} />
          </div>
          <ShimmerBox style={{ width: 140, height: 40, borderRadius: 10 }} />
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <ShimmerBox style={{ width: 44, height: 44, borderRadius: 12 }} />
              <div>
                <ShimmerBox style={{ width: 60, height: 28, marginBottom: 6 }} />
                <ShimmerBox style={{ width: 80, height: 12 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <ShimmerBox style={{ width: 80, height: 32, borderRadius: 20 }} />
            <ShimmerBox style={{ width: 80, height: 32, borderRadius: 20 }} />
          </div>
          <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: 16, borderBottom: '1px solid #e2e8f0' }}><ShimmerBox style={{ width: '100%', height: 20 }} /></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ padding: '20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 20 }}>
                <ShimmerBox style={{ width: '40%', height: 20 }} />
                <ShimmerBox style={{ width: '20%', height: 20 }} />
                <ShimmerBox style={{ width: '20%', height: 20 }} />
                <ShimmerBox style={{ width: '20%', height: 20 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailPageSkeleton({ accentColor = 'var(--primary-auction-color)' }: { accentColor?: string }) {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <DashboardKeyframes />
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 24, border: '1px solid #e2e8f0' }}>
        <ShimmerBox style={{ width: 80, height: 28, borderRadius: 8, marginBottom: 14 }} />
        <ShimmerBox style={{ width: '60%', height: 40, marginBottom: 10 }} />
        <ShimmerBox style={{ width: 200, height: 20 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <ShimmerBox style={{ width: 40, height: 40, borderRadius: 10 }} />
            <div>
              <ShimmerBox style={{ width: 60, height: 24, marginBottom: 8 }} />
              <ShimmerBox style={{ width: 80, height: 12 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <ShimmerBox style={{ width: 140, height: 24, marginBottom: 20 }} />
          <ShimmerBox style={{ width: '100%', height: 14, marginBottom: 10 }} />
          <ShimmerBox style={{ width: '100%', height: 14, marginBottom: 10 }} />
          <ShimmerBox style={{ width: '80%', height: 14 }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <ShimmerBox style={{ width: 140, height: 24, marginBottom: 20 }} />
          <ShimmerBox style={{ width: '100%', height: 60, borderRadius: 8, marginBottom: 12 }} />
          <ShimmerBox style={{ width: '100%', height: 60, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}
