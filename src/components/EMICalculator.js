'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  Maximize2,
  PiggyBank,
  ArrowLeftRight,
} from 'lucide-react';

// ─── Land Conversion Units (Base: Square Feet) ────────────────────────────────
const LAND_UNITS = [
  { id: 'sqft', name: 'Square Feet', short: 'Sq.Ft', toSqft: 1 },
  { id: 'meter', name: 'Square Metres', short: 'Sq.M', toSqft: 10.7639 },
  { id: 'yard', name: 'Square Yards', short: 'Sq.Yd', toSqft: 9 },
  { id: 'acre', name: 'Acres', short: 'Acre', toSqft: 43560 },
];

export default function EMICalculator() {
  const [activeTab, setActiveTab] = useState('emi'); // 'emi' | 'land' | 'budget'

  // 1. EMI State
  const [loanAmount, setLoanAmount] = useState(5000000); // ₹50 Lakh
  const [interestRate, setInterestRate] = useState(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState(20); // 20 years

  // 2. Land Converter State (Sq.Ft, Metres, Yards, Acres only)
  const [landValue, setLandValue] = useState(1000);
  const [fromUnit, setFromUnit] = useState('sqft');
  const [toUnit, setToUnit] = useState('yard');

  // 3. Budget Calculator State
  const [monthlyIncome, setMonthlyIncome] = useState(150000); // ₹1.5 Lakh/mo
  const [downPayment, setDownPayment] = useState(2000000); // ₹20 Lakh
  const [budgetTenure, setBudgetTenure] = useState(20); // 20 years

  // ─── Formatters ─────────────────────────────────────────────────────────────
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.round(val || 0));
  };

  const formatCompactINR = (val) => {
    if (!val || val <= 0) return '₹0';
    if (val >= 10000000) {
      const cr = val / 10000000;
      return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      const lk = val / 100000;
      return `₹${lk % 1 === 0 ? lk.toFixed(0) : lk.toFixed(1)} Lakh`;
    }
    return formatINR(val);
  };

  const getSliderStyle = (val, min, max) => {
    const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    return {
      background: `linear-gradient(to right, #000000 ${pct}%, #e7e5e4 ${pct}%)`,
    };
  };

  // ─── Calculations ───────────────────────────────────────────────────────────

  // 1. EMI
  const calculateEMI = () => {
    const P = Number(loanAmount);
    const r = Number(interestRate) / (12 * 100);
    const n = Number(tenureYears) * 12;

    if (P <= 0 || r <= 0 || n <= 0) {
      return { emi: 0, totalPayment: 0, totalInterest: 0 };
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
    };
  };
  const { emi, totalPayment, totalInterest } = calculateEMI();

  // 2. Land Conversion
  const fromObj = LAND_UNITS.find((u) => u.id === fromUnit) || LAND_UNITS[0];
  const toObj = LAND_UNITS.find((u) => u.id === toUnit) || LAND_UNITS[2];
  const totalSqft = (Number(landValue) || 0) * fromObj.toSqft;
  const convertedLandValue = totalSqft / toObj.toSqft;

  const swapLandUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  // 3. Budget & Affordability
  const calculateBudget = () => {
    const income = Number(monthlyIncome) || 0;
    const savings = Number(downPayment) || 0;
    // Standard safe debt ratio: 50% of income for EMI
    const safeEmi = income * 0.5;
    const r = 8.5 / (12 * 100);
    const n = Number(budgetTenure) * 12;

    let maxLoan = 0;
    if (safeEmi > 0 && r > 0 && n > 0) {
      maxLoan = (safeEmi * (1 - Math.pow(1 + r, -n))) / r;
    }

    const maxBudget = savings + maxLoan;

    return {
      maxBudget: Math.round(maxBudget),
      maxLoan: Math.round(maxLoan),
      safeEmi: Math.round(safeEmi),
    };
  };
  const budget = calculateBudget();

  return (
    <section
      id="emi-calculator"
      className="w-full py-12 sm:py-16 bg-stone-50/60 border-t border-stone-200/60 scroll-mt-20 font-sans"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Clean Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight mb-2">
            Property Calculators
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Simple tools to calculate your loan EMI, land conversion, and home budget.
          </p>
        </div>

        {/* Minimal Segmented Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-stone-200/80 rounded-xl gap-1 border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab('emi')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'emi'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>EMI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('land')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'land'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Land Converter</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'budget'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Budget</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-8">
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">

            {/* ================================================================ */}
            {/* LEFT COLUMN: SIMPLE CONTROLS (lg:col-span-7)                      */}
            {/* ================================================================ */}
            <div className="lg:col-span-7 space-y-5">

              {/* 1. EMI Controls */}
              {activeTab === 'emi' && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-stone-700">Loan Amount</span>
                      <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        {formatCompactINR(loanAmount)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000000"
                      max="30000000"
                      step="500000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      style={getSliderStyle(loanAmount, 1000000, 30000000)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-stone-700">Interest Rate</span>
                      <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        {interestRate}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="7.5"
                      max="12.0"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      style={getSliderStyle(interestRate, 7.5, 12.0)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-stone-700">Loan Tenure</span>
                      <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        {tenureYears} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={tenureYears}
                      onChange={(e) => setTenureYears(Number(e.target.value))}
                      style={getSliderStyle(tenureYears, 5, 30)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>
                </>
              )}

              {/* 2. Land Converter Controls */}
              {activeTab === 'land' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Enter Area / Land Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={landValue}
                      onChange={(e) => setLandValue(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-stone-900"
                      placeholder="e.g. 1000"
                    />
                  </div>

                  <div className="flex items-end gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Convert From
                      </label>
                      <select
                        value={fromUnit}
                        onChange={(e) => setFromUnit(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold bg-white cursor-pointer focus:outline-none focus:border-stone-900"
                      >
                        {LAND_UNITS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.short})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={swapLandUnits}
                      title="Swap units"
                      className="h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 cursor-pointer shadow-xs transition"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Convert To
                      </label>
                      <select
                        value={toUnit}
                        onChange={(e) => setToUnit(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold bg-white cursor-pointer focus:outline-none focus:border-stone-900"
                      >
                        {LAND_UNITS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.short})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Budget Calculator Controls */}
              {activeTab === 'budget' && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-stone-700">Monthly Net Income</span>
                      <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        {formatCompactINR(monthlyIncome)} / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="500000"
                      step="10000"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      style={getSliderStyle(monthlyIncome, 50000, 500000)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-stone-700">Down Payment (Savings)</span>
                      <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        {formatCompactINR(downPayment)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="500000"
                      max="10000000"
                      step="250000"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      style={getSliderStyle(downPayment, 500000, 10000000)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-stone-700">Loan Tenure</span>
                      <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        {budgetTenure} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="30"
                      step="5"
                      value={budgetTenure}
                      onChange={(e) => setBudgetTenure(Number(e.target.value))}
                      style={getSliderStyle(budgetTenure, 10, 30)}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>
                </>
              )}

            </div>

            {/* ================================================================ */}
            {/* RIGHT COLUMN: SIGNATURE RESULT CARD (lg:col-span-5)              */}
            {/* ================================================================ */}
            <div className="lg:col-span-5 w-full">
              <div className="p-5 sm:p-6 rounded-2xl bg-stone-900 text-white shadow-lg">

                {/* TAB 1 RESULT: EMI */}
                {activeTab === 'emi' && (
                  <>
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                        Monthly EMI
                      </span>
                      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
                        {formatINR(emi)}
                        <span className="text-xs font-normal text-stone-400 ml-1">/ month</span>
                      </div>
                    </div>

                    <div className="space-y-2 py-3 border-y border-stone-800 text-xs">
                      <div className="flex justify-between text-stone-300">
                        <span>Principal Amount</span>
                        <span className="font-semibold text-white">{formatCompactINR(loanAmount)}</span>
                      </div>
                      <div className="flex justify-between text-stone-300">
                        <span>Total Interest</span>
                        <span className="font-semibold text-stone-300">{formatCompactINR(totalInterest)}</span>
                      </div>
                      <div className="flex justify-between text-white pt-1.5 border-t border-stone-800 font-medium">
                        <span>Total Payable</span>
                        <span className="font-bold text-white">{formatCompactINR(totalPayment)}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link
                        href="/profile"
                        className="w-full py-2.5 px-3 rounded-xl bg-white text-stone-900 text-xs font-semibold text-center hover:bg-stone-100 transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Check Loan Eligibility</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                )}

                {/* TAB 2 RESULT: LAND CONVERTER */}
                {activeTab === 'land' && (
                  <>
                    <div className="py-1">
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                        Converted Area
                      </span>
                      <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1 truncate">
                        {convertedLandValue >= 1000
                          ? convertedLandValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                          : convertedLandValue.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                        <span className="text-sm font-normal text-stone-400 ml-2">{toObj.short}</span>
                      </div>
                      <p className="text-xs text-stone-400 mt-2">
                        {landValue} {fromObj.short} = {convertedLandValue >= 1000 ? convertedLandValue.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : convertedLandValue.toLocaleString('en-IN', { maximumFractionDigits: 3 })} {toObj.short}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-stone-800">
                      <Link
                        href="/#collection"
                        className="w-full py-2.5 px-3 rounded-xl bg-white text-stone-900 text-xs font-semibold text-center hover:bg-stone-100 transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Browse Verified Plots</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                )}

                {/* TAB 3 RESULT: BUDGET */}
                {activeTab === 'budget' && (
                  <>
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                        Affordable Property Budget
                      </span>
                      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
                        {formatCompactINR(budget.maxBudget)}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Savings of {formatCompactINR(downPayment)} + eligible loan
                      </p>
                    </div>

                    <div className="space-y-2 py-3 border-y border-stone-800 text-xs">
                      <div className="flex justify-between text-stone-300">
                        <span>Max Eligible Loan</span>
                        <span className="font-semibold text-white">{formatCompactINR(budget.maxLoan)}</span>
                      </div>
                      <div className="flex justify-between text-stone-300">
                        <span>Down Payment</span>
                        <span className="font-semibold text-stone-300">{formatCompactINR(downPayment)}</span>
                      </div>
                      <div className="flex justify-between text-white pt-1.5 border-t border-stone-800 font-medium">
                        <span>Safe Monthly EMI</span>
                        <span className="font-bold text-emerald-400">{formatINR(budget.safeEmi)} / mo</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link
                        href="/#collection"
                        className="w-full py-2.5 px-3 rounded-xl bg-white text-stone-900 text-xs font-semibold text-center hover:bg-stone-100 transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Browse Homes in this Budget</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
