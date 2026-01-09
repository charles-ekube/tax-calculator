"use client"

import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingDown } from 'lucide-react';

interface TaxBracket {
    limit: number;
    rate: number;
}

interface TaxResults {
    monthlyNaira: number;
    annualNaira: number;
    monthlyTax: number;
    annualTax: number;
    monthlyPension: number;
    annualPension: number;
    monthlyNHF: number;
    annualNHF: number;
    monthlyDeductions: number;
    monthlyTakeHome: number;
    annualTakeHome: number;
    effectiveTaxRate: number;
}

export default function NigerianTaxCalculator() {
    const [usdIncome, setUsdIncome] = useState<string>('');
    const [exchangeRate, setExchangeRate] = useState<string>('1550');
    const [results, setResults] = useState<TaxResults | null>(null);

    // 2024/2025 Nigerian Tax Rates (Progressive)
    const calculateTax = (annualIncome: number): number => {
        let tax = 0;
        const brackets: TaxBracket[] = [
            { limit: 800000, rate: 0.00 },    // First ₦800k tax-free
            { limit: 3000000, rate: 0.15 },   // ₦800k - ₦3M at 15%
            { limit: 15000000, rate: 0.18 },  // ₦3M - ₦15M at 18%
            { limit: 25000000, rate: 0.21 },  // ₦15M - ₦25M at 21%
            { limit: 50000000, rate: 0.23 },  // ₦25M - ₦50M at 23%
            { limit: Infinity, rate: 0.25 }
        ];

        let remaining = annualIncome;
        let previousLimit = 0;

        for (const bracket of brackets) {
            const taxableInBracket = Math.min(remaining, bracket.limit - previousLimit);
            if (taxableInBracket <= 0) break;

            tax += taxableInBracket * bracket.rate;
            remaining -= taxableInBracket;
            previousLimit = bracket.limit;

            if (remaining <= 0) break;
        }

        return tax;
    };

    const calculateTakeHome = (): void => {
        const usdAmount = parseFloat(usdIncome);
        const rate = parseFloat(exchangeRate);

        if (!usdAmount || !rate) return;

        // Monthly income in Naira
        const monthlyNaira = usdAmount * rate;
        const annualNaira = monthlyNaira * 12;

        // Calculate annual tax
        const annualTax = calculateTax(annualNaira);
        const monthlyTax = annualTax / 12;

        // Pension contribution (8% employee contribution)
        const monthlyPension = monthlyNaira * 0.08;
        const annualPension = monthlyPension * 12;

        // NHF (2.5% for those earning above 3000/month)
        const monthlyNHF = monthlyNaira > 3000 ? monthlyNaira * 0.025 : 0;
        const annualNHF = monthlyNHF * 12;

        // Total deductions and take-home
        const monthlyDeductions = monthlyTax + monthlyPension + monthlyNHF;
        const monthlyTakeHome = monthlyNaira - monthlyDeductions;
        const annualTakeHome = monthlyTakeHome * 12;

        setResults({
            monthlyNaira,
            annualNaira,
            monthlyTax,
            annualTax,
            monthlyPension,
            annualPension,
            monthlyNHF,
            annualNHF,
            monthlyDeductions,
            monthlyTakeHome,
            annualTakeHome,
            effectiveTaxRate: (annualTax / annualNaira) * 100
        });
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Calculator className="text-white" size={32} />
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                Nigerian Tax Calculator
                            </h1>
                        </div>
                        <p className="text-green-50">
                            Calculate your take-home pay with 2025 tax rates
                        </p>
                    </div>

                    {/* Input Section */}
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Monthly Income (USD)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="number"
                                        value={usdIncome}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsdIncome(e.target.value)}
                                        placeholder="5000"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Exchange Rate (USD to NGN)
                                </label>
                                <input
                                    type="number"
                                    value={exchangeRate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExchangeRate(e.target.value)}
                                    placeholder="1550"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-black"
                                />
                            </div>
                        </div>

                        <button
                            onClick={calculateTakeHome}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            Calculate Take-Home Pay
                        </button>
                    </div>

                    {/* Results Section */}
                    {results && (
                        <div className="p-6 md:p-8 bg-gray-50 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
                                    <p className="text-sm text-gray-600 mb-1">Gross Income (Monthly)</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(results.monthlyNaira)}
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
                                    <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(results.monthlyDeductions)}
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-emerald-500">
                                    <p className="text-sm text-gray-600 mb-1">Take-Home Pay</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {formatCurrency(results.monthlyTakeHome)}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingDown size={20} className="text-gray-600" />
                                    Deduction Breakdown
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Income Tax</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatCurrency(results.monthlyTax)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Pension (8%)</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatCurrency(results.monthlyPension)}
                                        </span>
                                    </div>

                                    {results.monthlyNHF > 0 && (
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-700">NHF (2.5%)</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(results.monthlyNHF)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3 mt-2">
                                        <span className="font-semibold text-gray-900">Effective Tax Rate</span>
                                        <span className="font-bold text-green-600">
                                            {results.effectiveTaxRate.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Annual Summary */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Annual Summary</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Annual Gross</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {formatCurrency(results.annualNaira)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Annual Take-Home</p>
                                        <p className="text-xl font-bold text-emerald-600">
                                            {formatCurrency(results.annualTakeHome)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="mt-6 text-center text-sm text-gray-600 bg-white rounded-lg p-4 shadow-sm">
                    <p>
                        This calculator uses the 2024/2025 Nigerian progressive tax rates and includes standard deductions.
                        <br />
                        Consult with a tax professional for personalized advice.
                    </p>
                </div>
            </div>
        </div>
    );
}