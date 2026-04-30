'use client';

import { useState } from 'react';
import { Store, Mail, CreditCard, Package, Bell, Shield } from 'lucide-react';

const TABS = [
  { id: 'store', label: 'Store', icon: Store },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'shipping', label: 'Shipping', icon: Package },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your store configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Tab nav */}
        <aside className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left ${
                  activeTab === id ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'store' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-5">Store Information</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Store Name</label>
                  <input defaultValue="Sterling Jewellers LTD" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Store Tagline</label>
                  <input defaultValue="Crafted with Brilliance. Worn with Love." className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Contact Email</label>
                    <input defaultValue="info@sterlingjewellers.co.uk" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input defaultValue="+44 20 7946 0000" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <textarea rows={3} defaultValue="123 Bond Street&#10;London&#10;W1S 1AB, United Kingdom" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>VAT Number</label>
                  <input placeholder="GB 123 456 789" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-5">Email Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>SMTP Host</label>
                  <input placeholder="smtp.sendgrid.net" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>SMTP Port</label>
                    <input defaultValue="587" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>SMTP User</label>
                    <input placeholder="apikey" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>SMTP Password / API Key</label>
                  <input type="password" placeholder="Set in .env: EMAIL_PASS" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>From Address</label>
                  <input defaultValue="noreply@sterlingjewellers.co.uk" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-5">Payment Configuration</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                  Stripe keys are managed via environment variables in your <code className="font-mono">.env</code> file.
                </div>
                {[
                  { label: 'Stripe Publishable Key', key: 'NEXT_PUBLIC_STRIPE_PK', placeholder: 'pk_live_…' },
                  { label: 'Stripe Secret Key', key: 'STRIPE_SECRET_KEY', placeholder: 'sk_live_… (server .env)' },
                  { label: 'Stripe Webhook Secret', key: 'STRIPE_WEBHOOK_SECRET', placeholder: 'whsec_…' },
                ].map(({ label, placeholder }) => (
                  <div key={label}>
                    <label className={labelCls}>{label}</label>
                    <input type="password" placeholder={placeholder} className={inputCls} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className={labelCls}>Tax Rate (%)</label>
                    <input type="number" defaultValue="20" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Currency</label>
                    <select defaultValue="GBP" className={inputCls}>
                      <option>GBP</option><option>USD</option><option>EUR</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-5">Shipping Options</h2>
              <div className="space-y-4">
                {[
                  { label: 'Standard Shipping (3-5 days)', name: 'standard', default: '0' },
                  { label: 'Express Shipping (1-2 days)', name: 'express', default: '9.99' },
                  { label: 'Next Day Delivery', name: 'nextDay', default: '19.99' },
                ].map(({ label, name, default: def }) => (
                  <div key={name} className="flex items-center gap-4">
                    <label className="text-sm text-gray-700 flex-1">{label}</label>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                      <input type="number" step="0.01" defaultValue={def} className={`${inputCls} pl-7`} />
                    </div>
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Free Shipping Threshold (£)</label>
                  <input type="number" defaultValue="500" className={inputCls} />
                  <p className="text-xs text-gray-400 mt-1">Orders above this amount qualify for free standard shipping</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-5">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'New Order Received', desc: 'Get notified when a new order is placed', defaultChecked: true },
                  { label: 'Low Stock Alert', desc: 'Alert when a variant stock falls below 3 units', defaultChecked: true },
                  { label: 'New Customer Registration', desc: 'Alert when a new customer registers', defaultChecked: false },
                  { label: 'Payment Failed', desc: 'Alert on failed payment attempts', defaultChecked: true },
                  { label: 'New Review', desc: 'Alert when a product review is submitted', defaultChecked: false },
                ].map(({ label, desc, defaultChecked }) => (
                  <label key={label} className="flex items-start gap-4 cursor-pointer group">
                    <input type="checkbox" defaultChecked={defaultChecked} className="mt-0.5 w-4 h-4 accent-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-5">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Current Password</label>
                  <input type="password" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input type="password" className={inputCls} />
                </div>
                <div className="pt-2">
                  <label className={labelCls}>JWT Token Expiry</label>
                  <select defaultValue="7d" className={inputCls}>
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Changes
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
