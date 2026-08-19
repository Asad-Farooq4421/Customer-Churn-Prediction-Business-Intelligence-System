'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { 
  Users, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Activity,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  UserCheck,
  AlertCircle,
  Download
} from 'lucide-react';

const PRESETS = {
  highRisk: {
    label: '🔥 High-Risk Persona',
    data: {
      TenureMonths: 2,
      MonthlyCharges: 89.9,
      TotalCharges: 179.8,
      SupportTickets: 6,
      PaymentDelays: 3,
      Contract: 'Month-to-month',
      PaperlessBilling: 'Yes',
      OnlineSecurity: 'No',
      TechSupport: 'No',
    }
  },
  lowRisk: {
    label: '🛡️ Enterprise Persona',
    data: {
      TenureMonths: 48,
      MonthlyCharges: 45.0,
      TotalCharges: 2160.0,
      SupportTickets: 0,
      PaymentDelays: 0,
      Contract: 'Two year',
      PaperlessBilling: 'No',
      OnlineSecurity: 'Yes',
      TechSupport: 'Yes',
    }
  },
  moderateRisk: {
    label: '⚠️ Moderate Persona',
    data: {
      TenureMonths: 14,
      MonthlyCharges: 70.0,
      TotalCharges: 980.0,
      SupportTickets: 2,
      PaymentDelays: 1,
      Contract: 'One year',
      PaperlessBilling: 'Yes',
      OnlineSecurity: 'No',
      TechSupport: 'Yes',
    }
  }
};

export default function ChurnDashboard() {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [formData, setFormData] = useState(PRESETS.highRisk.data);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Batch evaluation state
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const handlePresetSelect = (key: keyof typeof PRESETS) => {
    setFormData(PRESETS[key].data);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMessage(null);

    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://customer-churn-backend-v2uq.onrender.com';
    const API_URL = rawUrl.replace(/[\[\]\(\)]/g, '').replace(/\/$/, '');

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `HTTP Error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setErrorMessage(
        err.message?.includes('Failed to fetch') 
          ? 'Backend server is offline or waking up. Retry in 15 seconds.' 
          : err.message || 'Error connecting to prediction server.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Process uploaded CSV file dynamically
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBatchLoading(true);
    setErrorMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://customer-churn-backend-v2uq.onrender.com';
        const API_URL = rawUrl.replace(/[\[\]\(\)]/g, '').replace(/\/$/, '');

        try {
          const parsedRows = results.data as any[];
          const predictions = await Promise.all(
            parsedRows.map(async (row, index) => {
              const payload = {
                TenureMonths: parseInt(row.TenureMonths) || 1,
                MonthlyCharges: parseFloat(row.MonthlyCharges) || 50.0,
                TotalCharges: parseFloat(row.TotalCharges) || 50.0,
                SupportTickets: parseInt(row.SupportTickets) || 0,
                PaymentDelays: parseInt(row.PaymentDelays) || 0,
                Contract: row.Contract || 'Month-to-month',
                PaperlessBilling: row.PaperlessBilling || 'Yes',
                OnlineSecurity: row.OnlineSecurity || 'No',
                TechSupport: row.TechSupport || 'No',
              };

              const res = await fetch(`${API_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              const resData = res.ok ? await res.json() : { churn_probability: 'N/A', risk_level: 'ERROR' };
              return { 
                id: row.CustomerID || `CUST-${1000 + index}`, 
                name: row.CustomerName || `Account #${index + 1}`,
                ...payload, 
                ...resData 
              };
            })
          );

          setBatchResults(predictions);
        } catch (err) {
          setErrorMessage('Failed to evaluate CSV dataset against backend API.');
        } finally {
          setBatchLoading(false);
        }
      },
      error: () => {
        setErrorMessage('Failed to parse CSV file formatting.');
        setBatchLoading(false);
      }
    });
  };

  // Download Sample CSV Template
  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "CustomerID,CustomerName,TenureMonths,MonthlyCharges,TotalCharges,SupportTickets,PaymentDelays,Contract,PaperlessBilling,OnlineSecurity,TechSupport\n" +
      "CUST-801,Acme Logistics,3,95.50,286.50,5,2,Month-to-month,Yes,No,No\n" +
      "CUST-802,Omni Global,36,42.00,1512.00,0,0,Two year,No,Yes,Yes\n" +
      "CUST-803,Apex Dynamic,12,68.00,816.00,2,1,One year,Yes,No,Yes\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_churn_batch.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode(mode === 'single' ? 'batch' : 'single')}
              className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 border border-navy-600 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              {mode === 'single' ? <FileSpreadsheet className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              {mode === 'single' ? 'Switch to Batch CSV Mode' : 'Switch to Single Assessor'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Executive KPI Header */}
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

        {mode === 'single' ? (
          /* Single Customer Assessor + Persona Presets */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-navy-900">Customer Risk Assessor</h2>
                  <p className="text-xs text-slate-500">Select a persona preset or customize variables manually.</p>
                </div>
              </div>

              {/* Persona Quick Selectors */}
              <div className="mb-6 grid grid-cols-3 gap-2">
                {Object.entries(PRESETS).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key as keyof typeof PRESETS)}
                    className="px-3 py-2 text-xs font-semibold bg-navy-100 hover:bg-navy-600 hover:text-white text-navy-900 rounded-lg transition border border-navy-600/20 text-center"
                  >
                    {val.label}
                  </button>
                ))}
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

            {/* Inference Results Output Panel */}
            <div className="lg:col-span-5 bg-navy-900 text-white p-6 rounded-xl border border-navy-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-navy-500" />
                  <h3 className="text-lg font-bold">Predictive Risk Analysis</h3>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-rose-500/20 border border-rose-500 rounded-lg text-rose-200 text-xs flex items-start gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}

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
                  !errorMessage && (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                      <Activity className="w-8 h-8 text-navy-600 animate-bounce" />
                      <p className="text-sm">Click a persona or evaluate parameters to view ML risk predictions.</p>
                    </div>
                  )
                )}
              </div>

              <div className="pt-4 border-t border-navy-800 text-xs text-slate-400 flex justify-between items-center">
                <span>Model: Logistic Regression</span>
                <span>ROC-AUC: 0.7936</span>
              </div>
            </div>
          </div>
        ) : (
          /* Batch CSV File Processing Mode */
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-navy-900">CSV Batch Risk Analysis</h2>
                <p className="text-xs text-slate-500">Upload customer datasets to perform bulk churn inference.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadSampleCSV}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold rounded-lg text-xs flex items-center gap-2 transition border border-slate-300"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>

                <label className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white font-semibold rounded-lg text-xs flex items-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  {batchLoading ? 'Evaluating Dataset...' : 'Upload Customer CSV'}
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={batchLoading} />
                </label>
              </div>
            </div>

            {batchResults.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-navy-900 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Account ID</th>
                      <th className="px-4 py-3">Account Name</th>
                      <th className="px-4 py-3">Tenure</th>
                      <th className="px-4 py-3">Contract</th>
                      <th className="px-4 py-3">Monthly ($)</th>
                      <th className="px-4 py-3">Churn Score</th>
                      <th className="px-4 py-3">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {batchResults.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-navy-900">{row.id}</td>
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3">{row.TenureMonths} mo</td>
                        <td className="px-4 py-3">{row.Contract}</td>
                        <td className="px-4 py-3">${row.MonthlyCharges}</td>
                        <td className="px-4 py-3 font-bold">{row.churn_probability}%</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                            row.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                            'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          }`}>
                            {row.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-lg text-center space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-navy-600 mx-auto" />
                <p className="text-sm font-semibold text-navy-900">Upload a Customer CSV File</p>
                <p className="text-xs text-slate-400">Click "Download CSV Template" above to see the required column format.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}