"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { GraduationCap, BookOpen, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ role, identifier, password }),
      });

      localStorage.setItem("sl_school_user", JSON.stringify(user));

      if (user.role === "teacher") {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
    } catch (err: any) {
      setError(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoRole: "teacher" | "student", id: string, pass: string) => {
    setRole(demoRole);
    setIdentifier(id);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white p-6 text-center">
          <div className="mx-auto bg-blue-800 w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner">
            <GraduationCap className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold tracking-wide">
            SRI LANKA SCHOOL PORTAL
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Automated Term Report Card & Mark Appeal System (Grades 6–11)
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 p-1 m-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setRole("student");
              setIdentifier("");
              setPassword("");
              setError("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
              role === "student"
                ? "bg-white text-blue-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Login
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("teacher");
              setIdentifier("");
              setPassword("");
              setError("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
              role === "teacher"
                ? "bg-white text-blue-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Teacher Login
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {role === "student" ? "Student Admission Number" : "Teacher Email Address"}
            </label>
            <input
              type={role === "student" ? "text" : "email"}
              required
              placeholder={role === "student" ? "e.g., ST2026001" : "e.g., teacher@school.lk"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm"
          >
            {loading ? "Signing in..." : `Sign in as ${role === "student" ? "Student" : "Teacher"}`}
          </button>

          <p className="text-center text-xs text-slate-600 pt-2">
  Don&apos;t have an account?{" "}
  <Link href="/register" className="text-blue-700 font-bold hover:underline">
    Create a Student or Teacher account
  </Link>
</p>

          {/* Quick Demo Fill Buttons for Viva / Presentation */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Quick Demo Credentials (One-Click Fill):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials("teacher", "teacher@school.lk", "teacher123")}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md font-medium"
              >
                Teacher (Mr. Perera)
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("student", "ST2026001", "student123")}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium"
              >
                Student 1 (ST2026001)
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("student", "ST2026002", "student123")}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium"
              >
                Student 2 (ST2026002)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}