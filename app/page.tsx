'use client';

import { useState } from 'react';
import { 
  Users, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Activity,
  ArrowRight
} from 'lucide-react';

export default function ChurnDashboard() {
  const [formData, setFormData] = useState({
    TenureMonths: 12,
    MonthlyCharges: 65.5,
    TotalCharges: 786.0,
    SupportTickets: 3,
    PaymentDelays: 2,
    Contract: 'Month-to-month',
    PaperlessBilling: 'Yes',
    OnlineSecurity: 'No',
    TechSupport: 'No',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Sanitize API URL to strip extraneous brackets, parentheses, or trailing slashes
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://customer-churn-backend-v2uq.onrender.com';
    const API_URL = rawUrl.replace(/[\[\]\(\)]/g, '').replace(/\/$/, '');

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Prediction request failed');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Error fetching prediction. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-navy-900 border-b border-navy-800 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-600 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ChurnIntel AI</h1>
              <p className="text-xs text-slate-300">Customer Churn & Business Intelligence System</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-navy-800 border border-navy-600 rounded-full text-xs font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Render API Connected
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Executive KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-navy-100 rounded-lg text-navy-800">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Accounts</p>
              <p className="text-2xl font-bold text-navy-900">5,000</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-lg text-rose-700">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Benchmark Churn</p>
              <p className="text-2xl font-bold text-navy-900">26.5%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-navy-100 rounded-lg text-navy-800">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total MRR</p>
              <p className="text-2xl font-bold text-navy-900">$324,150</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">MRR At Risk</p>
              <p className="text-2xl font-bold text-navy-900">$85,900</p>
            </div>
          </div>
        </section>

        {/* Input Form & Risk Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-navy-900">Customer Risk Assessor</h2>
              <p className="text-sm text-slate-500">Input customer metrics to trigger real-time ML risk inference.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={formData.TenureMonths}
                    onChange={(e) => setFormData({ ...formData, TenureMonths: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Contract Type</label>
                  <select
                    value={formData.Contract}
                    onChange={(e) => setFormData({ ...formData, Contract: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                  >
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Monthly Charges ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.MonthlyCharges}
                    onChange={(e) => setFormData({ ...formData, MonthlyCharges: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Total Charges ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.TotalCharges}
                    onChange={(e) => setFormData({ ...formData, TotalCharges: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Support Tickets Logged</label>
                  <input
                    type="number"
                    value={formData.SupportTickets}
                    onChange={(e) => setFormData({ ...formData, SupportTickets: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Payment Delays Count</label>
                  <input
                    type="number"
                    value={formData.PaymentDelays}
                    onChange={(e) => setFormData({ ...formData, PaymentDelays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Tech Support Add-on</label>
                  <select
                    value={formData.TechSupport}
                    onChange={(e) => setFormData({ ...formData, TechSupport: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-1">Online Security Add-on</label>
                  <select
                    value={formData.OnlineSecurity}
                    onChange={(e) => setFormData({ ...formData, OnlineSecurity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 bg-navy-800 hover:bg-navy-900 text-white font-semibold rounded-lg shadow transition flex items-center justify-center gap-2"
              >
                {loading ? 'Evaluating Model...' : 'Calculate Churn Probability'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Inference Results Display */}
          <div className="lg:col-span-5 bg-navy-900 text-white p-6 rounded-xl border border-navy-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-navy-500" />
                <h3 className="text-lg font-bold">Predictive Risk Analysis</h3>
              </div>

              {result ? (
                <div className="space-y-6">
                  <div className="p-4 bg-navy-800/80 rounded-lg border border-navy-600 text-center">
                    <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Predicted Churn Score</p>
                    <p className="text-4xl font-extrabold text-white my-1">{result.churn_probability}%</p>
                    
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                      result.risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500' :
                      result.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500'
                    }`}>
                      {result.risk_level} RISK
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-3">Prescriptive Retention Protocol:</h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-xs bg-navy-800 p-3 rounded-lg border border-navy-600 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <Activity className="w-8 h-8 text-navy-600 animate-bounce" />
                  <p className="text-sm">Fill parameters and click evaluate to view model risk predictions.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-navy-800 text-xs text-slate-400 flex justify-between items-center">
              <span>Model: Logistic Regression</span>
              <span>ROC-AUC: 0.7936</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}