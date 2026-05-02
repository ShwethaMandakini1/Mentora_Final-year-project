import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import API from '../../api/api';
import './dashboard.css';

const PLAN_COLORS = {
  free:        { primary: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', badge: '#f3f4f6', badgeText: '#374151' },
  pro:         { primary: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', badge: '#2563eb', badgeText: '#fff'    },
  institution: { primary: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', badge: '#7c3aed', badgeText: '#fff'    },
};

// ── Mock Payment Modal ────────────────────────────────────────────────────────
function PaymentModal({ plan, planInfo, onSuccess, onClose }) {
  const colors = PLAN_COLORS[plan];
  const [step, setStep]         = useState('form'); // 'form' | 'processing' | 'success'
  const [card, setCard]         = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [errors, setErrors]     = useState({});

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const validate = () => {
    const e = {};
    if (!card.name.trim())                          e.name   = 'Cardholder name is required';
    if (card.number.replace(/\s/g, '').length < 16) e.number = 'Enter a valid 16-digit card number';
    if (card.expiry.length < 5)                     e.expiry = 'Enter a valid expiry date (MM/YY)';
    if (card.cvv.length < 3)                        e.cvv    = 'Enter a valid CVV';
    return e;
  };

  const handlePay = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setStep('processing');
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000));
    setStep('success');
    await new Promise(r => setTimeout(r, 1500));
    onSuccess();
  };

  if (step === 'processing') return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, textAlign: 'center', padding: 48 }}>
        <div style={{
          width: 56, height: 56, border: '4px solid #e5e7eb',
          borderTop: `4px solid ${colors.primary}`, borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Processing Payment...
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Please wait while we confirm your payment
        </div>
      </div>
    </div>
  );

  if (step === 'success') return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, textAlign: 'center', padding: 48 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#dcfce7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 16px',
        }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Payment Successful!
        </div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          Welcome to {planInfo.name} plan! Redirecting...
        </div>
      </div>
    </div>
  );

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${plan === 'pro' ? '#1d4ed8' : '#6d28d9'})`,
          borderRadius: '16px 16px 0 0', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontWeight: 600 }}>
              UPGRADING TO
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
              {plan === 'pro' ? '⭐' : '🏫'} {planInfo.name} Plan
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>${planInfo.price}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>/month</div>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            💳 Payment Details
          </div>

          {/* Card number */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Card Number</label>
            <input
              placeholder="1234 5678 9012 3456"
              value={card.number}
              onChange={e => { setCard({ ...card, number: formatCardNumber(e.target.value) }); setErrors({ ...errors, number: '' }); }}
              maxLength={19}
              style={{ ...inputStyle, borderColor: errors.number ? '#fca5a5' : '#d1d5db' }}
            />
            {errors.number && <div style={errorStyle}>{errors.number}</div>}
          </div>

          {/* Cardholder name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Cardholder Name</label>
            <input
              placeholder="John Smith"
              value={card.name}
              onChange={e => { setCard({ ...card, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
              style={{ ...inputStyle, borderColor: errors.name ? '#fca5a5' : '#d1d5db' }}
            />
            {errors.name && <div style={errorStyle}>{errors.name}</div>}
          </div>

          {/* Expiry + CVV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input
                placeholder="MM/YY"
                value={card.expiry}
                onChange={e => { setCard({ ...card, expiry: formatExpiry(e.target.value) }); setErrors({ ...errors, expiry: '' }); }}
                maxLength={5}
                style={{ ...inputStyle, borderColor: errors.expiry ? '#fca5a5' : '#d1d5db' }}
              />
              {errors.expiry && <div style={errorStyle}>{errors.expiry}</div>}
            </div>
            <div>
              <label style={labelStyle}>CVV</label>
              <input
                placeholder="123"
                value={card.cvv}
                onChange={e => { setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }); setErrors({ ...errors, cvv: '' }); }}
                maxLength={4}
                type="password"
                style={{ ...inputStyle, borderColor: errors.cvv ? '#fca5a5' : '#d1d5db' }}
              />
              {errors.cvv && <div style={errorStyle}>{errors.cvv}</div>}
            </div>
          </div>

          {/* Security note */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Your payment is secured with 256-bit SSL encryption
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12 }}>
          <button onClick={handlePay} style={{
            flex: 1, padding: '12px', borderRadius: 10,
            background: colors.primary, color: '#fff',
            border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Pay ${planInfo.price}/month
          </button>
          <button onClick={onClose} style={{
            padding: '12px 20px', borderRadius: 10,
            background: '#fff', color: '#374151',
            border: '1px solid #d1d5db', fontSize: 14,
            fontWeight: 500, cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalStyle = {
  background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
};
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#374151', marginBottom: 6,
};
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', color: '#111827',
};
const errorStyle = {
  fontSize: 11, color: '#dc2626', marginTop: 4,
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans]               = useState({});
  const [loading, setLoading]           = useState(true);
  const [upgrading, setUpgrading]       = useState('');
  const [msg, setMsg]                   = useState('');
  const [msgType, setMsgType]           = useState('success');
  const [showPayment, setShowPayment]   = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [subRes, planRes] = await Promise.all([
        API.get('/subscription'),
        API.get('/subscription/plans'),
      ]);
      setSubscription(subRes.data.subscription);
      setPlans(planRes.data.plans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan) => {
    if (plan === subscription?.plan) return;
    if (plan === 'free') {
      handleCancel();
      return;
    }
    setShowPayment(plan);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(null);
    setUpgrading(showPayment);
    try {
      const res = await API.post('/subscription/upgrade', { plan: showPayment });
      setSubscription(res.data.subscription);
      setMsg(`🎉 Welcome to ${plans[showPayment]?.name} plan! All features are now unlocked.`);
      setMsgType('success');
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Upgrade failed. Please try again.');
      setMsgType('error');
    } finally {
      setUpgrading('');
    }
  };

  const handleCancel = async () => {
    setUpgrading('cancel');
    setMsg('');
    try {
      const res = await API.post('/subscription/cancel');
      setSubscription(res.data.subscription);
      setMsg(res.data.message);
      setMsgType('success');
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Cancellation failed.');
      setMsgType('error');
    } finally {
      setUpgrading('');
    }
  };

  const usagePercent = subscription
    ? Math.min((subscription.submissionsUsed / subscription.submissionsLimit) * 100, 100)
    : 0;

  const currentPlan = subscription?.plan || 'free';

  if (loading) return (
    <StudentLayout>
      <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        Loading subscription...
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          plan={showPayment}
          planInfo={plans[showPayment]}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(null)}
        />
      )}

      <div style={{ padding: '30px 40px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>
            Subscription Plans
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>
            Unlock advanced features to supercharge your academic journey
          </p>
        </div>

        {/* Current plan card */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 32,
          color: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
              Current Plan
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              {plans[currentPlan]?.name || 'Free'} Plan
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {currentPlan === 'free'
                ? `${subscription?.submissionsUsed || 0} of ${subscription?.submissionsLimit || 10} submissions used this month`
                : `Unlimited submissions · Renews ${subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}`}
            </div>
          </div>

          {currentPlan === 'free' && (
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                <span>Submissions Used</span>
                <span>{subscription?.submissionsUsed || 0}/{subscription?.submissionsLimit || 10}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, height: 8 }}>
                <div style={{
                  width: `${usagePercent}%`,
                  background: usagePercent >= 80 ? '#fbbf24' : '#fff',
                  borderRadius: 8, height: 8, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Success/Error message */}
        {msg && (
          <div style={{
            padding: '12px 18px', borderRadius: 10, marginBottom: 24,
            background: msgType === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${msgType === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: msgType === 'success' ? '#15803d' : '#dc2626',
            fontSize: 14, fontWeight: 600,
          }}>
            {msg}
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          {Object.entries(plans).map(([key, plan]) => {
            const colors    = PLAN_COLORS[key];
            const isCurrent = currentPlan === key;
            const isPopular = key === 'pro';

            return (
              <div key={key} style={{
                background: isCurrent ? colors.bg : '#fff',
                border: `2px solid ${isCurrent ? colors.primary : colors.border}`,
                borderRadius: 16, padding: '24px 20px',
                position: 'relative', transition: 'all 0.2s ease',
                boxShadow: isCurrent ? `0 4px 20px ${colors.primary}25` : '0 1px 4px rgba(0,0,0,0.06)',
              }}>

                {isPopular && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#2563eb', color: '#fff',
                    borderRadius: 20, padding: '3px 14px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    ⭐ Most Popular
                  </div>
                )}

                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    background: colors.badge, color: colors.badgeText,
                    borderRadius: 20, padding: '2px 10px',
                    fontSize: 10, fontWeight: 700,
                  }}>
                    Current
                  </div>
                )}

                <div style={{ fontSize: 28, marginBottom: 8 }}>
                  {key === 'free' ? '🆓' : key === 'pro' ? '⭐' : '🏫'}
                </div>

                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                  {plan.name}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: colors.primary }}>
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 4 }}>/month</span>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      marginBottom: 8, fontSize: 13, color: '#374151',
                    }}>
                      <span style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </div>
                  ))}
                  {plan.notAllowed?.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      marginBottom: 8, fontSize: 13, color: '#9ca3af',
                    }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}>✗</span>
                      {f}
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <button disabled style={{
                    width: '100%', padding: '10px', borderRadius: 8,
                    background: '#f3f4f6', color: '#9ca3af',
                    border: 'none', fontSize: 13, fontWeight: 600, cursor: 'not-allowed',
                  }}>
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={!!upgrading}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 8,
                      background: upgrading === key ? '#93c5fd' : colors.primary,
                      color: key === 'free' ? '#374151' : '#fff',
                      border: key === 'free' ? '1px solid #d1d5db' : 'none',
                      fontSize: 13, fontWeight: 700,
                      cursor: upgrading ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                    }}>
                    {upgrading === key ? '⏳ Processing...'
                     : key === 'free' ? 'Downgrade to Free'
                     : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Cancel subscription */}
        {currentPlan !== 'free' && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 12, padding: '18px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626', marginBottom: 4 }}>
                Cancel Subscription
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                You'll lose access to premium features and revert to the Free plan.
              </div>
            </div>
            <button onClick={handleCancel} disabled={!!upgrading} style={{
              background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 20px', fontSize: 13,
              fontWeight: 700, cursor: upgrading ? 'not-allowed' : 'pointer',
            }}>
              {upgrading === 'cancel' ? '⏳ Cancelling...' : 'Cancel Plan'}
            </button>
          </div>
        )}

        {/* Feature comparison */}
        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#111827' }}>
            Feature Comparison
          </h3>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                    Feature
                  </th>
                  {['free', 'pro', 'institution'].map(p => (
                    <th key={p} style={{
                      padding: '12px 16px', textAlign: 'center',
                      fontWeight: 700, color: PLAN_COLORS[p].primary,
                      borderBottom: '1px solid #e5e7eb',
                    }}>
                      {plans[p]?.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Submissions/month',     '10',      'Unlimited', 'Unlimited'],
                  ['AI feedback',           'Standard', 'Advanced', 'Advanced' ],
                  ['Pre-approval workflow', '✗',        '✓',        '✓'        ],
                  ['Priority review',       '✗',        '✓',        '✓'        ],
                  ['Deadline reminders',    '✗',        '✓',        '✓'        ],
                  ['Plagiarism checker',    '✗',        '✓',        '✓'        ],
                  ['Leaderboard & badges',  '✗',        '✗',        '✓'        ],
                  ['Advanced analytics',    '✗',        '✗',        '✓'        ],
                  ['Priority support',      '✗',        '✗',        '✓'        ],
                ].map(([feature, ...vals], i) => (
                  <tr key={feature} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#374151' }}>{feature}</td>
                    {vals.map((v, vi) => (
                      <td key={vi} style={{
                        padding: '12px 16px', textAlign: 'center',
                        color: v === '✓' ? '#16a34a' : v === '✗' ? '#9ca3af' : '#374151',
                        fontWeight: v === '✓' || v === '✗' ? 700 : 400,
                      }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}