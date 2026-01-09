"use client"

import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingDown, ChevronDown, ChevronUp, Info, Calendar } from 'lucide-react';

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
    monthlyNHIS: number;
    annualNHIS: number;
    annualLifeInsurance: number;
    annualMortgageInterest: number;
    annualRentRelief: number;
    monthlyDeductions: number;
    monthlyTakeHome: number;
    annualTakeHome: number;
    effectiveTaxRate: number;
    isExempt: boolean;
}

type TaxYear = 'current' | '2026';
type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN';

const CURRENCIES: Record<Currency, { symbol: string, label: string }> = {
    USD: { symbol: '$', label: 'US Dollar' },
    EUR: { symbol: '€', label: 'Euro' },
    GBP: { symbol: '£', label: 'British Pound' },
    NGN: { symbol: '₦', label: 'Nigerian Naira' }
};

export default function NigerianTaxCalculator() {
    const [income, setIncome] = useState<string>('');
    const [inputCurrency, setInputCurrency] = useState<Currency>('USD');
    const [exchangeRate, setExchangeRate] = useState<string>('1550');
    const [taxYear, setTaxYear] = useState<TaxYear>('2026');

    // Advanced Deduction States
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [nhis, setNhis] = useState<string>('');
    const [lifeInsurance, setLifeInsurance] = useState<string>('');
    const [mortgageInterest, setMortgageInterest] = useState<string>('');
    const [annualRent, setAnnualRent] = useState<string>('');

    const [results, setResults] = useState<TaxResults | null>(null);

    const brackets2025: TaxBracket[] = [
        { limit: 800000, rate: 0.00 },    // First ₦800k tax-free
        { limit: 3000000, rate: 0.15 },   // ₦800k - ₦3M at 15%
        { limit: 15000000, rate: 0.18 },  // ₦3M - ₦15M at 18%
        { limit: 25000000, rate: 0.21 },  // ₦15M - ₦25M at 21%
        { limit: 50000000, rate: 0.23 },  // ₦25M - ₦50M at 23%
        { limit: Infinity, rate: 0.25 }
    ];

    const brackets2026: TaxBracket[] = [
        { limit: 800000, rate: 0.00 },    // First ₦800k tax-free
        { limit: 3000000, rate: 0.15 },   // Income from ₦800k to ₦3M at 15%
        { limit: 12000000, rate: 0.18 },  // Income from ₦3M to ₦12M at 18%
        { limit: 25000000, rate: 0.21 },  // Income from ₦12M to ₦25M at 21%
        { limit: 50000000, rate: 0.23 },  // Income from ₦25M to ₦50M at 23%
        { limit: Infinity, rate: 0.25 }
    ];

    const calculateTax = (taxableIncome: number, year: TaxYear): number => {
        if (taxableIncome <= 0) return 0;

        let tax = 0;
        const brackets = year === '2026' ? brackets2026 : brackets2025;

        let remaining = taxableIncome;
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
        const incomeAmount = parseFloat(income);
        const rate = inputCurrency === 'NGN' ? 1 : parseFloat(exchangeRate);

        if (!incomeAmount || !rate) return;

        // Monthly income in Naira
        const monthlyNaira = incomeAmount * rate;
        const annualNaira = monthlyNaira * 12;

        let annualTax = 0;
        let isExempt = false;

        // Apply 2026 low-income exemption (Gross annual < 1.2M)
        if (taxYear === '2026' && annualNaira <= 1200000) {
            isExempt = true;
        }

        // Standard Deductions
        const monthlyPension = monthlyNaira * 0.08;
        const annualPension = monthlyPension * 12;
        const monthlyNHF = monthlyNaira > 3000 ? monthlyNaira * 0.025 : 0;
        const annualNHF = monthlyNHF * 12;

        // Advanced Deductions (Reliefs)
        const annualNHIS = (parseFloat(nhis) || 0) * 12;
        const annualLifeInsurance = parseFloat(lifeInsurance) || 0;
        const annualMortgageInterest = parseFloat(mortgageInterest) || 0;
        const rentPaid = parseFloat(annualRent) || 0;

        // Rent Relief: 20% of annual rent, capped at ₦500k (2026 rule)
        const annualRentRelief = taxYear === '2026' ? Math.min(rentPaid * 0.2, 500000) : 0;

        if (!isExempt) {
            // Taxable Income = Gross - Allowable Deductions
            const totalReliefs = annualPension + annualNHF + annualNHIS + annualLifeInsurance + annualMortgageInterest + annualRentRelief;
            const taxableIncome = Math.max(0, annualNaira - totalReliefs);
            annualTax = calculateTax(taxableIncome, taxYear);
        }

        const monthlyTax = annualTax / 12;
        const monthlyNHIS = annualNHIS / 12;

        // Total deductions and take-home
        const monthlyDeductions = monthlyTax + monthlyPension + monthlyNHF + monthlyNHIS;
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
            monthlyNHIS,
            annualNHIS,
            annualLifeInsurance,
            annualMortgageInterest,
            annualRentRelief,
            monthlyDeductions,
            monthlyTakeHome,
            annualTakeHome,
            effectiveTaxRate: annualNaira > 0 ? (annualTax / annualNaira) * 100 : 0,
            isExempt
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calculator className="text-white" size={32} />
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    Nigerian Tax Calculator
                                </h1>
                            </div>
                            <div className="hidden md:flex bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                <button
                                    onClick={() => setTaxYear('current')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${taxYear === 'current' ? 'bg-white text-green-700 shadow-sm' : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    Current
                                </button>
                                <button
                                    onClick={() => setTaxYear('2026')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${taxYear === '2026' ? 'bg-white text-green-700 shadow-sm' : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    2026 Law
                                </button>
                            </div>
                        </div>
                        <p className="text-green-50 mt-2">
                            {taxYear === '2026'
                                ? "Using the new 2026 tax reforms (exemptions & reduced rates)"
                                : "Using standard 2024/2025 PAYE tax rates"
                            }
                        </p>

                        {/* Mobile Year Selector */}
                        <div className="flex md:hidden mt-4 bg-white/20 p-1 rounded-lg">
                            <button
                                onClick={() => setTaxYear('current')}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${taxYear === 'current' ? 'bg-white text-green-700' : 'text-white'
                                    }`}
                            >
                                Current
                            </button>
                            <button
                                onClick={() => setTaxYear('2026')}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${taxYear === '2026' ? 'bg-white text-green-700' : 'text-white'
                                    }`}
                            >
                                2026 Law
                            </button>
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Select Currency
                                    </label>
                                    <div className="flex gap-2">
                                        {(Object.keys(CURRENCIES) as Currency[]).map((curr) => (
                                            <button
                                                key={curr}
                                                onClick={() => setInputCurrency(curr)}
                                                className={`flex-1 py-2 px-3 rounded-lg border-2 font-bold text-sm transition-all ${inputCurrency === curr
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {curr}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Monthly Income ({inputCurrency})
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold w-6 text-center">
                                            {CURRENCIES[inputCurrency].symbol}
                                        </div>
                                        <input
                                            type="number"
                                            value={income}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncome(e.target.value)}
                                            placeholder="5000"
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-end">
                                {inputCurrency !== 'NGN' ? (
                                    <>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Exchange Rate (1 {inputCurrency} to NGN)
                                        </label>
                                        <input
                                            type="number"
                                            value={exchangeRate}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExchangeRate(e.target.value)}
                                            placeholder="1550"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-black"
                                        />
                                    </>
                                ) : (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex gap-2 text-blue-700">
                                            <Info size={18} className="shrink-0 mt-0.5" />
                                            <p className="text-sm">Calculating directly in Naira. No exchange rate needed.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Advanced Reliefs Section */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Info size={18} className="text-green-600" />
                                    <span className="font-semibold text-gray-700">Advanced Reliefs & Deductions</span>
                                </div>
                                {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {showAdvanced && (
                                <div className="p-4 grid md:grid-cols-2 gap-4 bg-white">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                Monthly NHIS Contribution
                                            </label>
                                            <input
                                                type="number"
                                                value={nhis}
                                                onChange={(e) => setNhis(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black outline-none focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                Annual Life Insurance Premium
                                            </label>
                                            <input
                                                type="number"
                                                value={lifeInsurance}
                                                onChange={(e) => setLifeInsurance(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black outline-none focus:border-green-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                Annual Mortgage Interest
                                            </label>
                                            <input
                                                type="number"
                                                value={mortgageInterest}
                                                onChange={(e) => setMortgageInterest(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black outline-none focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                Annual Rent Paid
                                                {taxYear === '2026' && <span className="text-green-600 ml-1">(20% Relief applied)</span>}
                                            </label>
                                            <input
                                                type="number"
                                                value={annualRent}
                                                onChange={(e) => setAnnualRent(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-black outline-none focus:border-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={calculateTakeHome}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <Calendar size={20} />
                            Calculate {taxYear === '2026' ? '2026' : 'Current'} Take-Home Pay
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
                                    Deduction Breakdown (Monthly)
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-700">Income Tax (PAYE)</span>
                                            {results.isExempt && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    EXEMPT
                                                </span>
                                            )}
                                        </div>
                                        <span className={`font-semibold ${results.isExempt ? 'text-green-600' : 'text-gray-900'}`}>
                                            {formatCurrency(results.monthlyTax)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Pension Contribution (8%)</span>
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

                                    {results.monthlyNHIS > 0 && (
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-700">NHIS Contribution</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(results.monthlyNHIS)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3 mt-2">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">Effective Tax Rate</span>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Tax / Gross Annual</span>
                                        </div>
                                        <span className="font-bold text-green-600">
                                            {results.effectiveTaxRate.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Annual Summary & Reliefs */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Annual Summary</h3>
                                    <span className="text-xs font-bold text-green-700 bg-white px-3 py-1 rounded-full border border-green-200">
                                        FY {taxYear === '2026' ? '2026' : '2024/25'}
                                    </span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
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

                                    {(results.annualRentRelief > 0 || results.annualLifeInsurance > 0 || results.annualMortgageInterest > 0) && (
                                        <div className="bg-white/50 p-4 rounded-lg">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Applied Reliefs (Annual)</p>
                                            <div className="space-y-1">
                                                {results.annualRentRelief > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Rent Relief</span>
                                                        <span className="font-medium text-gray-900">{formatCurrency(results.annualRentRelief)}</span>
                                                    </div>
                                                )}
                                                {results.annualLifeInsurance > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Life Insurance</span>
                                                        <span className="font-medium text-gray-900">{formatCurrency(results.annualLifeInsurance)}</span>
                                                    </div>
                                                )}
                                                {results.annualMortgageInterest > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Mortgage Interest</span>
                                                        <span className="font-medium text-gray-900">{formatCurrency(results.annualMortgageInterest)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="mt-6 text-center text-sm text-gray-600 bg-white rounded-lg p-4 shadow-sm">
                    <p className="leading-relaxed">
                        {taxYear === '2026'
                            ? "This calculator includes 2026 reforms: Gross annual < ₦1.2m exemption, Rent relief (20% cap ₦500k), and updated progressive brackets."
                            : "This calculator uses the 2024/2025 Nigerian progressive tax rates and standard deductions."
                        }
                        <br />
                        <span className="text-xs font-medium text-gray-400 mt-2 block italic">Consult with a tax professional for official advice.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}