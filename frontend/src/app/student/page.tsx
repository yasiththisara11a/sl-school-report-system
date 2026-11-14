"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  GraduationCap,
  Printer,
  LogOut,
  Flag,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export default function StudentPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [term, setTerm] = useState("Term 1");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Appeal Modal State
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [appealReason, setAppealReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sl_school_user");
    if (!stored) {
      router.push("/");
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "student") {
      router.push("/");
      return;
    }
    setUser(parsed);
  }, [router]);

  const fetchReport = async (studentId: string, selectedTerm: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/marks/report-card/${studentId}/${encodeURIComponent(selectedTerm)}`
      );
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReport(user.id, term);
    }
  }, [user, term]);

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !appealReason.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/appeals/", {
        method: "POST",
        body: JSON.stringify({
          mark_id: selectedSubject.mark_id,
          student_id: user.id,
          subject_name: selectedSubject.subject_name,
          term,
          current_score: selectedSubject.score,
          reason: appealReason,
        }),
      });
      setSelectedSubject(null);
      setAppealReason("");
      await fetchReport(user.id, term);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const appealsByMarkId: Record<string, any> = {};
  for (const ap of report?.appeals || []) {
    appealsByMarkId[ap.mark_id] = ap;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12">
      {/* Top Navbar (Hidden when printing PDF) */}
      <header className="bg-blue-900 text-white shadow print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-amber-400" />
            <div>
              <h1 className="text-lg font-bold">Student Academic Report Portal</h1>
              <p className="text-xs text-blue-200">
                {user?.name} ({user?.admission_no}) — Class {user?.class_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-blue-800 text-white text-sm font-semibold px-3 py-2 rounded-lg border border-blue-700"
            >
              <option value="Term 1">1st Term Report</option>
              <option value="Term 2">2nd Term Report</option>
              <option value="Term 3">3rd Term Report</option>
            </select>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save A4 PDF
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("sl_school_user");
                router.push("/");
              }}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main A4 Report Card Sheet */}
      <main className="max-w-4xl mx-auto mt-6 px-4 print:mt-0 print:px-0">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500">
            Loading your {term} report card...
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-slate-300 p-8 print:shadow-none print:border-2 print:border-black print:rounded-none">
            {/* Official School Report Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl font-extrabold uppercase tracking-wider text-blue-950">
                Ministry of Education — Sri Lanka
              </h2>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                G.C.E. Ordinary Level Section (Grades 6–11) — Official Student Progress Report
              </p>
              <span className="inline-block mt-2 bg-blue-900 text-white text-xs font-bold px-4 py-1 rounded-full uppercase">
                {term} Examination — Academic Year 2026
              </span>
            </div>

            {/* Student Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Student Name</span>
                <strong className="text-slate-900">{report?.student?.name}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Admission No.</span>
                <strong className="text-slate-900">{report?.student?.admission_no}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Grade & Class</span>
                <strong className="text-slate-900">Grade {report?.student?.class_id}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Class Rank</span>
                <strong className="text-amber-700 text-base">
                  {report?.summary ? `#${report.summary.class_rank}` : "Not Published"}
                </strong>
              </div>
            </div>

            {/* Subject Marks Table */}
            <table className="w-full text-left border-collapse border border-slate-300 mb-6 text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-xs font-bold uppercase text-slate-700">
                  <th className="p-3 border-r border-slate-300">Subject Code</th>
                  <th className="p-3 border-r border-slate-300">Subject Name</th>
                  <th className="p-3 text-center border-r border-slate-300">Marks (100)</th>
                  <th className="p-3 text-center border-r border-slate-300">Grade</th>
                  <th className="p-3 text-center print:hidden">Mark Verification / Appeal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {report?.subjects?.map((sub: any) => {
                  const appeal = sub.mark_id ? appealsByMarkId[sub.mark_id] : null;
                  return (
                    <tr key={sub.subject_id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs border-r border-slate-300">
                        {sub.subject_code}
                      </td>
                      <td className="p-3 font-semibold border-r border-slate-300">
                        {sub.subject_name}
                      </td>
                      <td className="p-3 text-center font-bold border-r border-slate-300">
                        {sub.is_absent ? "AB" : sub.score ?? "-"}
                      </td>
                      <td className="p-3 text-center font-extrabold border-r border-slate-300">
                        {sub.grade}
                      </td>
                      <td className="p-3 text-center print:hidden">
                        {!sub.mark_id ? (
                          <span className="text-xs text-slate-400">Awaiting results</span>
                        ) : appeal ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                appeal.status === "Pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : appeal.status === "Resolved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {appeal.status === "Pending" && <Clock className="w-3 h-3" />}
                              {appeal.status === "Resolved" && <CheckCircle2 className="w-3 h-3" />}
                              {appeal.status === "Rejected" && <XCircle className="w-3 h-3" />}
                              Appeal {appeal.status}
                            </span>
                            {appeal.teacher_note && (
                              <span className="text-[11px] text-slate-600 mt-0.5">
                                Note: {appeal.teacher_note}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedSubject(sub)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                          >
                            <Flag className="w-3 h-3" />
                            Appeal Mark
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                <span className="text-xs font-semibold uppercase text-blue-700 block">
                  Total Marks
                </span>
                <span className="text-2xl font-extrabold text-blue-950">
                  {report?.summary ? report.summary.total_marks : "-"} / 600
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <span className="text-xs font-semibold uppercase text-emerald-700 block">
                  Term Average
                </span>
                <span className="text-2xl font-extrabold text-emerald-950">
                  {report?.summary ? `${report.summary.average}%` : "-"}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                <span className="text-xs font-semibold uppercase text-amber-800 block">
                  Class Position (Rank)
                </span>
                <span className="text-2xl font-extrabold text-amber-900">
                  {report?.summary ? `Rank #${report.summary.class_rank}` : "-"}
                </span>
              </div>
            </div>

            {/* Class Teacher Remarks & Signature Footer */}
            <div className="border-t border-slate-300 pt-4 space-y-6">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm">
                <strong className="text-slate-700">Class Teacher&apos;s Remark: </strong>
                <span className="text-slate-900 italic">
                  {report?.summary?.teacher_remark || "Results not yet published by class teacher."}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs text-slate-600">
                <div className="border-t border-slate-400 pt-1.5">Class Teacher Signature</div>
                <div className="border-t border-slate-400 pt-1.5">Principal Signature</div>
                <div className="border-t border-slate-400 pt-1.5">Parent / Guardian Signature</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Appeal Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Submit Mark Appeal — {selectedSubject.subject_name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Current Recorded Score:{" "}
              <strong>{selectedSubject.is_absent ? "AB" : selectedSubject.score}</strong> (Grade:{" "}
              <strong>{selectedSubject.grade}</strong>)
            </p>

            <form onSubmit={handleAppealSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Reason for Mark Re-Check
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., My returned paper total is 78, but the report card shows 42. Please re-check."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject(null);
                    setAppealReason("");
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white"
                >
                  {submitting ? "Submitting..." : "Submit Appeal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}