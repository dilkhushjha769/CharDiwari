'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sliders, ShieldCheck, ArrowRight, CheckCircle2, Calculator, Sparkles } from 'lucide-react';

export default function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState(7500000); // 75 Lakhs
  const [interestRate, setInterestRate] = useState(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState(20); // 20 years

  // Calculate EMI
  const calculateEMI = () => {
    const principal = Number(loanAmount);
    const monthlyRate = Number(interestRate) / (12 * 100);
    const totalMonths = Number(tenureYears) * 12;

    if (principal <= 0 || monthlyRate <= 0 || totalMonths <= 0) {
      return { emi: 0, totalPayment: 0, totalInterest: 0, principalRatio: 50 };
    }

    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - principal;
    const principalRatio = Math.round((principal / totalPayment) * 100);

    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      principalRatio,
    };
  };

  const { emi, totalPayment, totalInterest, principalRatio } = calculateEMI();

  // Indian Currency Formatter
  const formatINR = (val) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="emi-calculator" className="w-full py-24 bg-stone-50/70 border-t border-stone-200/60 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700 text-xs font-medium tracking-wide mb-4 shadow-xs">
            <Calculator className="w-3.5 h-3.5 text-stone-800" />
            <span>Mortgage & Financial Advisory</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-3">
            Home Loan EMI Calculator
          </h2>
          <p className="text-base text-stone-600 font-normal leading-relaxed">
            Plan your monthly investment with accurate amortization schedules and tax-saving benefits.
          </p>
        </div>

        {/* Calculator Main Card */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-lg shadow-stone-900/5 p-8 sm:p-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Controls (7 Cols) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Slider 1: Loan Amount */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="loan-amount-slider" className="text-sm font-semibold text-stone-800">
                    Loan Amount
                  </label>
                  <span className="font-semibold text-base text-stone-900 bg-stone-100 px-3.5 py-1 rounded-xl">
                    {formatINR(loanAmount)}
                  </span>
                </div>
                <input
                  id="loan-amount-slider"
                  type="range"
                  min="1000000"
                  max="100000000"
                  step="500000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                />
                <div className="flex justify-between items-center text-xs text-stone-500 mt-2.5">
                  <span>₹10 Lakh</span>
                  <div className="flex gap-2">
                    {[5000000, 10000000, 25000000, 50000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setLoanAmount(amt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          loanAmount === amt
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {formatINR(amt)}
                      </button>
                    ))}
                  </div>
                  <span>₹10 Crore</span>
                </div>
              </div>

              {/* Slider 2: Interest Rate */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="interest-rate-slider" className="text-sm font-semibold text-stone-800">
                    Interest Rate (% per annum)
                  </label>
                  <span className="font-semibold text-base text-stone-900 bg-stone-100 px-3.5 py-1 rounded-xl">
                    {interestRate}%
                  </span>
                </div>
                <input
                  id="interest-rate-slider"
                  type="range"
                  min="6.5"
                  max="14.0"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                />
                <div className="flex justify-between text-xs text-stone-500 mt-2.5">
                  <span>6.5%</span>
                  <div className="flex gap-2">
                    {[7.5, 8.5, 9.5].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setInterestRate(rate)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          interestRate === rate
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                  <span>14.0%</span>
                </div>
              </div>

              {/* Slider 3: Tenure */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="tenure-years-slider" className="text-sm font-semibold text-stone-800">
                    Loan Tenure (Years)
                  </label>
                  <span className="font-semibold text-base text-stone-900 bg-stone-100 px-3.5 py-1 rounded-xl">
                    {tenureYears} Years ({tenureYears * 12} Months)
                  </span>
                </div>
                <input
                  id="tenure-years-slider"
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                />
                <div className="flex justify-between text-xs text-stone-500 mt-2.5">
                  <span>5 Years</span>
                  <div className="flex gap-2">
                    {[10, 15, 20, 25].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setTenureYears(yr)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          tenureYears === yr
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {yr}Y
                      </button>
                    ))}
                  </div>
                  <span>30 Years</span>
                </div>
              </div>

              {/* Pro-Tips & Tax Notes */}
              <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center gap-5 text-xs text-stone-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Section 24(b): Up to ₹2 Lakh annual interest deduction</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Section 80C: Up to ₹1.5 Lakh principal exemption</span>
                </span>
              </div>

            </div>

            {/* Right Output Card (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="p-8 rounded-2xl bg-stone-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-stone-800/60 rounded-full blur-3xl pointer-events-none" />
                
                <span className="text-xs uppercase tracking-wider text-stone-400 font-medium block mb-1">
                  Monthly Installment
                </span>
                
                <div className="text-4xl font-serif font-bold text-white mb-2">
                  {formatINR(emi)}
                  <span className="text-sm font-sans font-normal text-stone-400 ml-2">/ month</span>
                </div>

                <p className="text-xs text-stone-400 font-normal mb-6">
                  Principal of ₹{formatINR(loanAmount)} at {interestRate}% over {tenureYears} years.
                </p>

                {/* Progress Ratio Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-stone-300 font-medium mb-1.5">
                    <span>Principal: {principalRatio}%</span>
                    <span>Interest: {100 - principalRatio}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden flex">
                    <div
                      className="bg-white h-full transition-all duration-300 rounded-l-full"
                      style={{ width: `${principalRatio}%` }}
                    />
                    <div
                      className="bg-stone-600 h-full transition-all duration-300 rounded-r-full"
                      style={{ width: `${100 - principalRatio}%` }}
                    />
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-3 pt-5 border-t border-stone-800 text-xs">
                  <div className="flex justify-between text-stone-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Loan Amount (Principal):
                    </span>
                    <span className="font-semibold text-white">{formatINR(loanAmount)}</span>
                  </div>

                  <div className="flex justify-between text-stone-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-stone-500" />
                      Total Interest Due:
                    </span>
                    <span className="font-semibold text-stone-300">{formatINR(totalInterest)}</span>
                  </div>

                  <div className="flex justify-between text-stone-200 pt-3 border-t border-stone-800 font-medium">
                    <span>Total Amount Payable:</span>
                    <span className="font-bold text-white text-sm">{formatINR(totalPayment)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-4 border-t border-stone-800 flex flex-col gap-2.5">
                  <Link
                    href="/dashboard"
                    className="w-full py-3.5 px-4 rounded-xl bg-white text-stone-900 text-sm font-semibold text-center hover:bg-stone-100 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Check Instant Loan Pre-Approval</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#collection"
                    className="w-full py-3 px-4 rounded-xl border border-stone-700 text-stone-300 text-xs font-medium text-center hover:bg-stone-800 transition flex items-center justify-center"
                  >
                    View Sanctuaries in This Budget
                  </a>
                </div>

              </div>

              {/* Partners Footer */}
              <div className="mt-4 flex items-center justify-between text-xs text-stone-500 px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-stone-600" />
                  SBI • HDFC • ICICI • Kotak
                </span>
                <span>Fast 48-Hour Sanctions</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
