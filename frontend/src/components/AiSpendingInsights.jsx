import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  PiggyBank,
  PieChart,
  Activity,
  Shield,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { generateSpendingInsights } from '../utils/spendingInsights';
import { AiCopilotChat } from './AiCopilotChat';

const ICON_MAP = {
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  'pie-chart': PieChart,
  trending: TrendingUp,
  activity: Activity,
  shield: Shield,
  alert: AlertTriangle,
  target: Target,
};

const SEVERITY_STYLES = {
  success: {
    border: 'rgba(16, 185, 129, 0.25)',
    background: 'rgba(16, 185, 129, 0.08)',
    color: 'var(--color-success)',
  },
  warning: {
    border: 'rgba(245, 158, 11, 0.25)',
    background: 'rgba(245, 158, 11, 0.08)',
    color: 'var(--color-warning)',
  },
  danger: {
    border: 'rgba(239, 68, 68, 0.25)',
    background: 'rgba(239, 68, 68, 0.08)',
    color: 'var(--color-danger)',
  },
  info: {
    border: 'rgba(99, 102, 241, 0.25)',
    background: 'rgba(99, 102, 241, 0.08)',
    color: 'var(--color-primary-light)',
  },
};

function TrendIndicator({ trend }) {
  if (trend === 'up') {
    return <TrendingUp size={14} style={{ color: 'var(--color-danger)' }} />;
  }
  if (trend === 'down') {
    return <TrendingDown size={14} style={{ color: 'var(--color-success)' }} />;
  }
  return <Minus size={14} style={{ color: 'var(--text-muted)' }} />;
}

export function AiSpendingInsights({ dashboardData, user, t, onNavigate }) {
  const insights = generateSpendingInsights(dashboardData, user, t);

  const handleCardClick = (id) => {
    if (!onNavigate) return;
    if (id.includes('savings')) onNavigate('savings');
    else if (id.includes('net-worth')) onNavigate('networth');
    else if (id.includes('fsi') || id.includes('stability')) onNavigate('stability');
    else onNavigate('dashboard');
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={18} style={{ color: 'var(--color-primary-light)' }} />
        {t('insights.title')}
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        {t('insights.subtitle')}
      </p>

      <div className="insights-grid">
        {insights.map((insight) => {
          const Icon = ICON_MAP[insight.icon] || Activity;
          const styles = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;

          return (
            <div
              key={insight.id}
              className="insight-card"
              onClick={() => handleCardClick(insight.id)}
              style={{
                border: `1px solid ${styles.border}`,
                background: styles.background,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.06)',
                    color: styles.color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <TrendIndicator trend={insight.trend} />
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      color: styles.color,
                    }}
                  >
                    {t(`insights.severity.${insight.severity}`)}
                  </span>
                </div>
              </div>

              <h4 style={{ fontSize: '0.92rem', marginTop: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                {insight.title}
              </h4>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '2rem' }}>
        <AiCopilotChat dashboardData={dashboardData} t={t} />
      </div>
    </div>
  );
}
