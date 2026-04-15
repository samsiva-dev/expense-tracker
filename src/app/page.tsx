"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Github, DollarSign, PieChart, TrendingUp, Shield } from "lucide-react";

const features = [
  {
    icon: DollarSign,
    title: "Track Expenses",
    description: "Log every expense with categories, dates, and descriptions.",
  },
  {
    icon: PieChart,
    title: "Category Breakdown",
    description: "See where your money goes with visual category summaries.",
  },
  {
    icon: TrendingUp,
    title: "Monthly Trends",
    description: "Spot spending patterns with a 6-month trend view.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is tied to your GitHub account — only you can see it.",
  },
];

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">
            Expense<span className="text-indigo-600">Tracker</span>
          </span>
        </div>
        <button
          onClick={() => signIn("github")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Github className="w-4 h-4" />
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-medium text-indigo-600 mb-6">
          <Github className="w-3.5 h-3.5" />
          Sign in with GitHub — no passwords needed
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
          Take control of{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            your spending
          </span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
          A clean, fast, and personal expense tracker. Log expenses, visualize trends, and
          understand your finances — all in one place.
        </p>

        <button
          onClick={() => signIn("github")}
          className="inline-flex items-center gap-3 px-7 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <Github className="w-5 h-5" />
          Continue with GitHub
        </button>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                <p className="text-gray-500 text-sm mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pb-8 text-xs text-gray-400">
        Built with Next.js, Prisma &amp; PostgreSQL
      </footer>
    </div>
  );
}
