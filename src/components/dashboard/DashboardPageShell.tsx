'use client';

import React, { ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface StatCard {
  label: string;
  value: number | string;
  color?: string; // hex or css color
  icon?: string;  // emoji or could be a react node
}

interface DashboardPageShellProps {
  title: string;
  subtitle?: string;
  icon?: string;
  /** Color for the header gradient. Defaults to var(--primary-auction-color). */
  accentColor?: string;
  headerActions?: ReactNode;
  stats?: StatCard[];
  children: ReactNode;
}

// ─── Styles (inline for zero config) ─────────────────────────────────────────
const styles = {
  root: {
    width: '100%',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,

  header: (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '16px',
    marginBottom: '24px',
    padding: '24px 28px',
    background: color.startsWith('var(') 
      ? `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 80%, transparent))`
      : `linear-gradient(135deg, ${color}, ${color}cc)`,
    borderRadius: '16px',
    boxShadow: color.startsWith('var(')
      ? `0 8px 32px color-mix(in srgb, ${color} 25%, transparent)`
      : `0 8px 32px ${color}40`,
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties),

  headerBg: {
    position: 'absolute' as const,
    inset: 0,
    background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
    pointerEvents: 'none' as const,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'relative' as const,
    zIndex: 1,
  },

  headerIcon: {
    width: '52px',
    height: '52px',
    background: 'rgba(255,255,255,0.18)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.25)',
    flexShrink: 0,
  },

  headerTitle: {
    color: '#ffffff',
    fontSize: 'clamp(1.3rem, 3vw, 1.9rem)',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.02em',
  },

  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '0.875rem',
    margin: '4px 0 0 0',
    fontWeight: 500,
  },

  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    position: 'relative' as const,
    zIndex: 1,
  },

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },

  statCard: (color: string) => ({
    background: '#ffffff',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderLeft: `4px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  } as React.CSSProperties),

  statIcon: (color: string) => ({
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: color.startsWith('var(') ? `color-mix(in srgb, ${color} 10%, transparent)` : `${color}18`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  } as React.CSSProperties),

  statValue: (color: string) => ({
    fontSize: '1.6rem',
    fontWeight: 800,
    color: color,
    lineHeight: 1,
    margin: 0,
  } as React.CSSProperties),

  statLabel: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '4px 0 0 0',
  } as React.CSSProperties,

  tableCard: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    border: '1px solid rgba(0,0,0,0.06)',
    overflow: 'hidden',
  } as React.CSSProperties,
};

const DEFAULT_COLORS = ['var(--primary-auction-color)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPageShell({
  title,
  subtitle,
  icon,
  accentColor = 'var(--primary-auction-color)',
  headerActions,
  stats,
  children,
}: DashboardPageShellProps) {
  return (
    <div style={styles.root}>
      {/* Hero Header */}
      <div style={styles.header(accentColor)}>
        <div style={styles.headerBg} />
        <div style={styles.headerLeft}>
          {icon && <div style={styles.headerIcon}>{icon}</div>}
          <div>
            <h1 style={styles.headerTitle}>{title}</h1>
            {subtitle && <p style={styles.headerSubtitle}>{subtitle}</p>}
          </div>
        </div>
        {headerActions && (
          <div style={styles.headerActions}>{headerActions}</div>
        )}
      </div>

      {/* Stat Cards */}
      {stats && stats.length > 0 && (
        <div style={styles.statsRow}>
          {stats.map((stat, i) => {
            const color = stat.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <div key={stat.label} style={styles.statCard(color)}>
                {stat.icon && <div style={styles.statIcon(color)}>{stat.icon}</div>}
                <div>
                  <p style={styles.statValue(color)}>{stat.value}</p>
                  <p style={styles.statLabel}>{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Card */}
      <div style={styles.tableCard}>{children}</div>
    </div>
  );
}
