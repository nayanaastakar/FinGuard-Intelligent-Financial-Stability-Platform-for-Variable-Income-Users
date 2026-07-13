import React, { useState, useEffect } from 'react';
import { finguardApi } from '../services/finguardApi';
import { Trash2, Plus, TrendingUp, TrendingDown, Wallet, Home, Car, Banknote, PiggyBank, CreditCard, GraduationCap, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ASSET_ICONS = {
  SAVINGS: <Banknote size={18} />,
  PROPERTY: <Home size={18} />,
  VEHICLE: <Car size={18} />,
  INVESTMENT: <TrendingUp size={18} />,
  CASH: <Wallet size={18} />,
  REAL_ESTATE: <Building2 size={18} />,
  OTHER: <PiggyBank size={18} />,
};

const LIABILITY_ICONS = {
  HOME_LOAN: <Home size={18} />,
  PERSONAL_LOAN: <Banknote size={18} />,
  CREDIT_CARD: <CreditCard size={18} />,
  EDUCATION_LOAN: <GraduationCap size={18} />,
  LOAN: <Banknote size={18} />,
  MORTGAGE: <Building2 size={18} />,
  OTHER: <CreditCard size={18} />,
};

const ASSET_COLORS = {
  SAVINGS: '#10b981',
  PROPERTY: '#6366f1',
  VEHICLE: '#f59e0b',
  INVESTMENT: '#14b8a6',
  CASH: '#22d3ee',
  REAL_ESTATE: '#8b5cf6',
  OTHER: '#94a3b8',
};

const LIABILITY_COLORS = {
  HOME_LOAN: '#f43f5e',
  PERSONAL_LOAN: '#ef4444',
  CREDIT_CARD: '#dc2626',
  EDUCATION_LOAN: '#fb923c',
  LOAN: '#ef4444',
  MORTGAGE: '#f43f5e',
  OTHER: '#94a3b8',
};

function formatCurrency(val) {
  return '₹' + (val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function NetWorthTab({ token, t, onUpdate }) {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null); // 'asset' | 'liability' | null

  const [newAsset, setNewAsset] = useState({
    name: '', type: 'SAVINGS', value: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newLiability, setNewLiability] = useState({
    name: '', type: 'PERSONAL_LOAN', value: '', interestRate: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsData, liabilitiesData] = await Promise.all([
        finguardApi.getAssets(token),
        finguardApi.getLiabilities(token)
      ]);
      setAssets(assetsData || []);
      setLiabilities(liabilitiesData || []);
    } catch (e) {
      console.error('Failed to fetch net worth data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await finguardApi.addAsset(token, { ...newAsset, value: parseFloat(newAsset.value) });
      setNewAsset({ name: '', type: 'SAVINGS', value: '', date: new Date().toISOString().split('T')[0] });
      setActiveForm(null);
      await fetchData();
      if (onUpdate) onUpdate();
    } catch (e) { console.error(e); }
  };

  const handleAddLiability = async (e) => {
    e.preventDefault();
    try {
      await finguardApi.addLiability(token, {
        ...newLiability,
        value: parseFloat(newLiability.value),
        interestRate: parseFloat(newLiability.interestRate) || 0.0
      });
      setNewLiability({ name: '', type: 'PERSONAL_LOAN', value: '', interestRate: '', date: new Date().toISOString().split('T')[0] });
      setActiveForm(null);
      await fetchData();
      if (onUpdate) onUpdate();
    } catch (e) { console.error(e); }
  };

  const handleDeleteAsset = async (id) => {
    if (!confirm('Delete this asset?')) return;
    try { await finguardApi.deleteAsset(token, id); await fetchData(); if (onUpdate) onUpdate(); } catch (e) { console.error(e); }
  };

  const handleDeleteLiability = async (id) => {
    if (!confirm('Delete this liability?')) return;
    try { await finguardApi.deleteLiability(token, id); await fetchData(); if (onUpdate) onUpdate(); } catch (e) { console.error(e); }
  };

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;
  const debtRatio = totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0;

  const chartData = [
    { name: 'Assets', value: totalAssets, color: '#10b981' },
    { name: 'Liabilities', value: totalLiabilities, color: '#f43f5e' },
    { name: 'Net Worth', value: Math.abs(netWorth), color: isPositive ? '#6366f1' : '#dc2626' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Top KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {/* Total Assets */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <TrendingUp size={18} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('networth.totalAssets')}
            </span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: 0 }}>
            {formatCurrency(totalAssets)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Total Liabilities */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <TrendingDown size={18} style={{ color: '#f43f5e' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('networth.totalLiabilities')}
            </span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f43f5e', margin: 0 }}>
            {formatCurrency(totalLiabilities)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Debt Ratio: {debtRatio}%
          </p>
        </div>

        {/* Net Worth */}
        <div className="glass-panel glow-indigo" style={{ padding: '1.75rem', borderLeft: `4px solid ${isPositive ? '#6366f1' : '#dc2626'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Wallet size={18} style={{ color: isPositive ? 'var(--color-primary-light)' : '#f43f5e' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('networth.netWorth')}
            </span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: isPositive ? 'var(--color-primary-light)' : '#f43f5e', margin: 0 }}>
            {isPositive ? '' : '-'}{formatCurrency(Math.abs(netWorth))}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {isPositive ? '✅ Positive net worth' : '⚠️ Liabilities exceed assets'}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', margin: '0 0 1.5rem 0' }}>
          📊 Assets vs Liabilities vs Net Worth
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v)} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)' }}
              formatter={(val) => [formatCurrency(val), '']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setActiveForm(activeForm === 'asset' ? null : 'asset')}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
        >
          <Plus size={16} /> {t('networth.addAsset')}
        </button>
        <button
          onClick={() => setActiveForm(activeForm === 'liability' ? null : 'liability')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
        >
          <Plus size={16} /> {t('networth.addLiability')}
        </button>
      </div>

      {/* Add Asset Form */}
      {activeForm === 'asset' && (
        <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid #10b981' }}>
          <h4 style={{ marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: '#10b981' }} /> New Asset
          </h4>
          <form onSubmit={handleAddAsset}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Asset Name</label>
                <input required type="text" placeholder="e.g. SBI Savings Account" className="form-input"
                  value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Value (₹)</label>
                <input required type="number" step="0.01" placeholder="0.00" className="form-input"
                  value={newAsset.value} onChange={e => setNewAsset({ ...newAsset, value: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Type</label>
                <select className="form-input" value={newAsset.type} onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}>
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CASH">Cash</option>
                  <option value="INVESTMENT">Investment / Stocks</option>
                  <option value="PROPERTY">Property</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Date</label>
                <input required type="date" className="form-input" value={newAsset.date}
                  onChange={e => setNewAsset({ ...newAsset, date: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Save Asset</button>
              <button type="button" className="btn-secondary" onClick={() => setActiveForm(null)} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Liability Form */}
      {activeForm === 'liability' && (
        <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid #f43f5e' }}>
          <h4 style={{ marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={16} style={{ color: '#f43f5e' }} /> New Liability
          </h4>
          <form onSubmit={handleAddLiability}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Name</label>
                <input required type="text" placeholder="e.g. Home Loan - SBI" className="form-input"
                  value={newLiability.name} onChange={e => setNewLiability({ ...newLiability, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Amount Owed (₹)</label>
                <input required type="number" step="0.01" placeholder="0.00" className="form-input"
                  value={newLiability.value} onChange={e => setNewLiability({ ...newLiability, value: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Type</label>
                <select className="form-input" value={newLiability.type} onChange={e => setNewLiability({ ...newLiability, type: e.target.value })}>
                  <option value="HOME_LOAN">Home Loan</option>
                  <option value="PERSONAL_LOAN">Personal Loan</option>
                  <option value="CREDIT_CARD">Credit Card Debt</option>
                  <option value="EDUCATION_LOAN">Education Loan</option>
                  <option value="MORTGAGE">Mortgage</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Interest Rate (% p.a.)</label>
                <input type="number" step="0.1" placeholder="e.g. 12.5" className="form-input"
                  value={newLiability.interestRate} onChange={e => setNewLiability({ ...newLiability, interestRate: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" style={{ padding: '0.6rem 1.5rem', background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                Save Liability
              </button>
              <button type="button" className="btn-secondary" onClick={() => setActiveForm(null)} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Assets & Liabilities Lists side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Assets List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: '#10b981' }} /> {t('networth.assets')} ({assets.length})
          </h3>
          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <TrendingUp size={32} style={{ opacity: 0.25, margin: '0 auto 0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No assets added yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {assets.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.15rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {ASSET_ICONS[a.type] || ASSET_ICONS.OTHER}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{a.name}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.type} • {a.date}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>{formatCurrency(a.value)}</span>
                    <button onClick={() => handleDeleteAsset(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1.15rem', borderTop: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Liabilities List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={16} style={{ color: '#f43f5e' }} /> {t('networth.liabilities')} ({liabilities.length})
          </h3>
          {liabilities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <TrendingDown size={32} style={{ opacity: 0.25, margin: '0 auto 0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No liabilities added yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {liabilities.map(l => {
                const riskColor = l.interestRate > 15 ? '#dc2626' : l.interestRate > 8 ? '#f97316' : '#f43f5e';
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.15rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {LIABILITY_ICONS[l.type] || LIABILITY_ICONS.OTHER}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{l.name}</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {l.type} •{' '}
                          <span style={{ color: riskColor, fontWeight: 600 }}>{l.interestRate}% APR</span>
                          {l.interestRate > 15 && ' ⚠️ High'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 700, color: riskColor, fontSize: '0.95rem' }}>{formatCurrency(l.value)}</span>
                      <button onClick={() => handleDeleteLiability(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1.15rem', borderTop: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontWeight: 800, color: '#f43f5e' }}>{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
