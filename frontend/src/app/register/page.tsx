"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { GraduationCap, BookOpen, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [classId, setClassId] = useState("10-A");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const user = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          role,
          identifier,
          password,
          class_id: classId,
        }),
      });

      localStorage.setItem("sl_school_user", JSON.stringify(user));
      setSuccess("Account created! Redirecting to your portal...");

      setTimeout(() => {
        if (user.role === "teacher") {
          router.push("/teacher");
        } else {
          router.push("/student");
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white p-6 text-center">
          <div className="mx-auto bg-blue-800 w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner">
            <UserPlus className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold tracking-wide">CREATE ACCOUNT</h1>
          <p className="text-xs text-blue-200 mt-1">
            Register as a Student or Teacher in the School Portal
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 p-1 m-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setRole("student");
              setIdentifier("");
              setError("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
              role === "student"
                ? "bg-white text-blue-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("teacher");
              setIdentifier("");
              setError("");
            }}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
              role === "teacher"
                ? "bg-white text-blue-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Teacher
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder={role === "student" ? "e.g., Sahan Perera" : "e.g., Mrs. N. Silva"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {role === "student" ? "Student Admission Number" : "Teacher Email Address"}
            </label>
            <input
              type={role === "student" ? "text" : "email"}
              required
              placeholder={role === "student" ? "e.g., ST2026006" : "e.g., silva@school.lk"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Assigned Class
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="10-A">Grade 10-A</option>
              <option value="10-B">Grade 10-B</option>
              <option value="11-A">Grade 11-A</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={4}
              placeholder="Minimum 4 characters"
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
            {loading ? "Creating Account..." : `Register as ${role === "student" ? "Student" : "Teacher"}`}
          </button>

          <p className="text-center text-xs text-slate-600 pt-2">
            Already have an account?{" "}
            <Link href="/" className="text-blue-700 font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}