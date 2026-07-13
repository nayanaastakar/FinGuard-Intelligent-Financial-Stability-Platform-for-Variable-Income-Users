import React, { useRef, useState } from 'react';
import {
  Upload,
  ScanLine,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { scanReceiptImage } from '../utils/receiptOcr';

const EMPTY_FORM = {
  merchant: '',
  amount: '',
  date: '',
  category: 'OTHER',
  description: '',
  confidence: 0,
};

export function ReceiptScanner({ t, onApplyToExpense }) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extracted, setExtracted] = useState(EMPTY_FORM);

  const resetScanner = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setOcrStatus('idle');
    setOcrProgress(0);
    setStatusMessage('');
    setExtracted(EMPTY_FORM);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setOcrStatus('error');
      setStatusMessage(t('receipt.invalidFile'));
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setOcrStatus('processing');
    setOcrProgress(0);
    setStatusMessage(t('receipt.processing'));

    try {
      const result = await scanReceiptImage(file, setOcrProgress);
      setExtracted({
        merchant: result.merchant,
        amount: result.amount,
        date: result.date,
        category: result.category,
        description: result.description || result.merchant,
        confidence: result.confidence,
      });
      setOcrStatus('success');
      setStatusMessage(t('receipt.success'));
    } catch (error) {
      console.error('Receipt OCR failed', error);
      setOcrStatus('error');
      setStatusMessage(t('receipt.error'));
    }
  };

  const handleApply = () => {
    if (!extracted.amount) {
      setOcrStatus('error');
      setStatusMessage(t('receipt.amountRequired'));
      return;
    }

    onApplyToExpense({
      amount: extracted.amount,
      category: extracted.category,
      date: extracted.date,
      description: extracted.description || extracted.merchant,
    });
    setStatusMessage(t('receipt.applied'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ScanLine size={18} /> {t('receipt.uploadTitle')}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          {t('receipt.uploadHint')}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> {t('receipt.chooseImage')}
          </button>
          {previewUrl && (
            <button type="button" className="btn-secondary" onClick={resetScanner}>
              {t('common.cancel')}
            </button>
          )}
        </div>

        {ocrStatus === 'processing' && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('receipt.progress')}</span>
              <span style={{ fontWeight: 700 }}>{ocrProgress}%</span>
            </div>
            <div style={{ height: '8px', borderRadius: '99px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{ width: `${ocrProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s ease' }} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Loader2 size={14} className="spin-icon" /> {statusMessage}
            </p>
          </div>
        )}

        {statusMessage && ocrStatus !== 'processing' && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: ocrStatus === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
              color: ocrStatus === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
              border: `1px solid ${ocrStatus === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            }}
          >
            {ocrStatus === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {statusMessage}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {previewUrl && (
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{t('receipt.preview')}</h4>
            <img
              src={previewUrl}
              alt={t('receipt.preview')}
              style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)', maxHeight: '420px', objectFit: 'contain', background: 'var(--bg-tertiary)' }}
            />
          </div>
        )}

        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{t('receipt.extractedData')}</h4>

          {ocrStatus === 'idle' && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('receipt.waiting')}</p>
          )}

          {(ocrStatus === 'success' || ocrStatus === 'error') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}>{t('receipt.merchant')}</label>
                <input
                  className="form-input"
                  value={extracted.merchant}
                  onChange={(e) => setExtracted({ ...extracted, merchant: e.target.value, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}>{t('expense.amount')}</label>
                  <input
                    className="form-input"
                    type="number"
                    value={extracted.amount}
                    onChange={(e) => setExtracted({ ...extracted, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}>{t('expense.date')}</label>
                  <input
                    className="form-input"
                    type="date"
                    value={extracted.date}
                    onChange={(e) => setExtracted({ ...extracted, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}>{t('expense.category')}</label>
                <select
                  className="form-input"
                  value={extracted.category}
                  onChange={(e) => setExtracted({ ...extracted, category: e.target.value })}
                >
                  <option value="FOOD">{t('ui.foodGroceries')}</option>
                  <option value="RENT">{t('ui.housingRent')}</option>
                  <option value="BILLS">{t('ui.digitalBills')}</option>
                  <option value="SHOPPING">{t('ui.hardwareShopping')}</option>
                  <option value="TRAVEL">{t('ui.travelCosts')}</option>
                  <option value="OTHER">{t('ui.otherDiscretionary')}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.8rem', fontWeight: 600 }}>{t('expense.description')}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={extracted.description}
                  onChange={(e) => setExtracted({ ...extracted, description: e.target.value })}
                />
              </div>

              {extracted.confidence > 0 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('receipt.confidence')}: <strong>{extracted.confidence}%</strong>
                </p>
              )}

              <button type="button" className="btn-primary" onClick={handleApply} style={{ alignSelf: 'flex-start' }}>
                {t('receipt.applyToExpense')} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
