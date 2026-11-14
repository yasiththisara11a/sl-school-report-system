"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, previewSLGrade } from "@/lib/api";
import {
  BookOpen,
  CheckCircle2,
  LogOut,
  Save,
  AlertTriangle,
  Trophy,
  MessageSquareWarning,
} from "lucide-react";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [term, setTerm] = useState("Term 1");
  const [activeTab, setActiveTab] = useState<"grid" | "appeals">("grid");

  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  // gridState[student_id][subject_id] = { score: number | "", is_absent: boolean }
  const [gridState, setGridState] = useState<Record<string, Record<string, { score: string; is_absent: boolean }>>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [summaries, setSummaries] = useState<Record<string, any>>({});
  const [appeals, setAppeals] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // State for resolving an appeal
  const [resolveNote, setResolveNote] = useState<Record<string, string>>({});
  const [resolveScore, setResolveScore] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem("sl_school_user");
    if (!stored) {
      router.push("/");
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "teacher") {
      router.push("/");
      return;
    }
    setUser(parsed);
  }, [router]);

  const loadTermData = async (selectedTerm: string) => {
    setLoading(true);
    setStatusMsg("");
    try {
      const data = await apiFetch(`/api/marks/grid/10-A/${encodeURIComponent(selectedTerm)}`);
      setStudents(data.students || []);
      setSubjects(data.subjects || []);

      // Initialize grid state
      const initialGrid: Record<string, Record<string, { score: string; is_absent: boolean }>> = {};
      for (const st of data.students) {
        initialGrid[st.id] = {};
        for (const sub of data.subjects) {
          initialGrid[st.id][sub.id] = { score: "", is_absent: false };
        }
      }

      for (const m of data.marks || []) {
        if (initialGrid[m.student_id] && initialGrid[m.student_id][m.subject_id]) {
          initialGrid[m.student_id][m.subject_id] = {
            score: m.score !== null && m.score !== undefined ? String(m.score) : "",
            is_absent: Boolean(m.is_absent),
          };
        }
      }
      setGridState(initialGrid);

      const sumMap: Record<string, any> = {};
      const remMap: Record<string, string> = {};
      for (const s of data.summaries || []) {
        sumMap[s.student_id] = s;
        remMap[s.student_id] = s.teacher_remark || "Good progress. Keep it up!";
      }
      setSummaries(sumMap);
      setRemarks(remMap);

      const appealsData = await apiFetch(`/api/appeals/teacher/${encodeURIComponent(selectedTerm)}`);
      setAppeals(appealsData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTermData(term);
    }
  }, [user, term]);

  const handleScoreChange = (studentId: string, subjectId: string, val: string) => {
    // Allow empty, "AB", or 0-100
    if (val.toUpperCase() === "AB") {
      setGridState((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [subjectId]: { score: "", is_absent: true },
        },
      }));
      return;
    }

    const num = Number(val);
    if (val !== "" && (Number.isNaN(num) || num < 0 || num > 100)) return;

    setGridState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: { score: val, is_absent: false },
      },
    }));
  };

  const toggleAbsent = (studentId: string, subjectId: string) => {
    setGridState((prev) => {
      const current = prev[studentId][subjectId];
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [subjectId]: {
            score: !current.is_absent ? "" : current.score,
            is_absent: !current.is_absent,
          },
        },
      };
    });
  };

  const handlePublishResults = async () => {
    setSaving(true);
    setStatusMsg("");
    try {
      const marksPayload: any[] = [];
      for (const st of students) {
        for (const sub of subjects) {
          const cell = gridState[st.id]?.[sub.id];
          if (!cell) continue;
          if (cell.is_absent) {
            marksPayload.push({
              student_id: st.id,
              subject_id: sub.id,
              score: null,
              is_absent: true,
            });
          } else if (cell.score !== "") {
            marksPayload.push({
              student_id: st.id,
              subject_id: sub.id,
              score: Number(cell.score),
              is_absent: false,
            });
          }
        }
      }

      await apiFetch("/api/marks/publish", {
        method: "POST",
        body: JSON.stringify({
          class_id: "10-A",
          term,
          marks: marksPayload,
          remarks,
        }),
      });

      await loadTermData(term);
      setStatusMsg("Results published! Grades, Totals, Averages, and Class Ranks updated.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResolveAppeal = async (appealId: string, status: "Resolved" | "Rejected", currentScore: number) => {
    try {
      const newScoreVal = resolveScore[appealId];
      const noteVal =
        resolveNote[appealId] ||
        (status === "Resolved" ? "Mark verified and updated." : "Checked paper; original mark is correct.");

      await apiFetch(`/api/appeals/${appealId}/resolve`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          new_score: status === "Resolved" ? Number(newScoreVal ?? currentScore) : null,
          teacher_note: noteVal,
        }),
      });

      await loadTermData(term);
      setStatusMsg(`Appeal ${status} and class rankings automatically recalculated.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const pendingAppealsCount = appeals.filter((a) => a.status === "Pending").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="bg-blue-900 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-amber-400" />
            <div>
              <h1 className="text-lg font-bold">Teacher Assessment & Grading Portal</h1>
              <p className="text-xs text-blue-200">
                Class: Grade 10-A | Teacher: {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-blue-800 text-white text-sm font-semibold px-3 py-2 rounded-lg border border-blue-700 focus:outline-none"
            >
              <option value="Term 1">1st Term Examination</option>
              <option value="Term 2">2nd Term Examination</option>
              <option value="Term 3">3rd Term Examination</option>
            </select>

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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 bg-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("grid")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "grid" ? "bg-white text-blue-900 shadow-sm" : "text-slate-700"
              }`}
            >
              Marks Entry & Class Rankings
            </button>
            <button
              onClick={() => setActiveTab("appeals")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "appeals" ? "bg-white text-blue-900 shadow-sm" : "text-slate-700"
              }`}
            >
              <MessageSquareWarning className="w-4 h-4" />
              Student Mark Appeals
              {pendingAppealsCount > 0 && (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingAppealsCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === "grid" && (
            <button
              onClick={handlePublishResults}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm text-sm transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "Publishing & Ranking..." : "Publish Results & Calculate Ranks"}
            </button>
          )}
        </div>

        {statusMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
            Loading Grade 10-A records for {term}...
          </div>
        ) : activeTab === "grid" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
              <p className="text-xs text-slate-600">
                <strong>Tip:</strong> Enter marks between <strong>0–100</strong> or type <strong>AB</strong> (or click the AB button) if a student was absent. Grades (A/B/C/S/W) preview automatically.
              </p>
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                A: 75–100 | B: 65–74 | C: 50–64 | S: 35–49 | W: 0–34
              </span>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                  <th className="p-3 sticky left-0 bg-slate-100">Student</th>
                  {subjects.map((sub) => (
                    <th key={sub.id} className="p-3 text-center min-w-[130px]">
                      {sub.name}
                    </th>
                  ))}
                  <th className="p-3 text-center bg-blue-50">Total</th>
                  <th className="p-3 text-center bg-blue-50">Avg %</th>
                  <th className="p-3 text-center bg-amber-50">Rank</th>
                  <th className="p-3 min-w-[200px]">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {students.map((st) => {
                  const sum = summaries[st.id];
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-medium sticky left-0 bg-white">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-xs text-slate-500">{st.admission_no}</div>
                      </td>

                      {subjects.map((sub) => {
                        const cell = gridState[st.id]?.[sub.id] || { score: "", is_absent: false };
                        const numScore = cell.score === "" ? null : Number(cell.score);
                        const grade = previewSLGrade(numScore, cell.is_absent);

                        return (
                          <td key={sub.id} className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="text"
                                disabled={cell.is_absent}
                                placeholder={cell.is_absent ? "AB" : "0-100"}
                                value={cell.is_absent ? "AB" : cell.score}
                                onChange={(e) => handleScoreChange(st.id, sub.id, e.target.value)}
                                className={`w-14 px-2 py-1.5 text-center border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                                  cell.is_absent
                                    ? "bg-amber-50 border-amber-300 text-amber-800"
                                    : "border-slate-300"
                                }`}
                              />
                              <button
                                type="button"
                                title="Toggle Absent (AB)"
                                onClick={() => toggleAbsent(st.id, sub.id)}
                                className={`text-[10px] font-bold px-1.5 py-1 rounded border ${
                                  cell.is_absent
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                                }`}
                              >
                                AB
                              </button>
                              <span
                                className={`text-xs font-bold w-6 text-center rounded py-0.5 ${
                                  grade === "A"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : grade === "B"
                                    ? "bg-blue-100 text-blue-800"
                                    : grade === "C"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : grade === "S"
                                    ? "bg-amber-100 text-amber-800"
                                    : grade === "W"
                                    ? "bg-red-100 text-red-800"
                                    : "text-slate-400"
                                }`}
                              >
                                {grade}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center font-bold text-blue-900 bg-blue-50/40">
                        {sum ? sum.total_marks : "-"}
                      </td>
                      <td className="p-3 text-center font-semibold text-blue-900 bg-blue-50/40">
                        {sum ? `${sum.average}%` : "-"}
                      </td>
                      <td className="p-3 text-center bg-amber-50/50">
                        {sum ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            #{sum.class_rank}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={remarks[st.id] || ""}
                          onChange={(e) =>
                            setRemarks((prev) => ({ ...prev, [st.id]: e.target.value }))
                          }
                          placeholder="Enter teacher remark..."
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Mark Appeals Resolution Tab */
          <div className="space-y-4">
            {appeals.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
                No mark appeals submitted for {term}.
              </div>
            ) : (
              appeals.map((ap) => (
                <div
                  key={ap.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ap.status === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : ap.status === "Resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ap.status}
                      </span>
                      <h3 className="font-bold text-slate-900">
                        {ap.users?.name} ({ap.users?.admission_no}) — {ap.subject_name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Recorded Score: <strong>{ap.current_score ?? "AB"}</strong> | Term: {ap.term}
                    </p>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                      <strong>Student Reason:</strong> &ldquo;{ap.reason}&rdquo;
                    </p>
                    {ap.teacher_note && (
                      <p className="text-xs text-blue-800 mt-1">
                        <strong>Teacher Note:</strong> {ap.teacher_note}
                      </p>
                    )}
                  </div>

                  {ap.status === "Pending" && (
                    <div className="flex flex-col gap-2 min-w-[280px] bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-700 w-28">
                          Corrected Mark:
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder={String(ap.current_score ?? 0)}
                          value={resolveScore[ap.id] ?? String(ap.current_score ?? "")}
                          onChange={(e) =>
                            setResolveScore((prev) => ({ ...prev, [ap.id]: e.target.value }))
                          }
                          className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-bold"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Teacher response note..."
                        value={resolveNote[ap.id] || ""}
                        onChange={(e) =>
                          setResolveNote((prev) => ({ ...prev, [ap.id]: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleResolveAppeal(ap.id, "Resolved", ap.current_score)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition"
                        >
                          Approve & Update Rank
                        </button>
                        <button
                          onClick={() => handleResolveAppeal(ap.id, "Rejected", ap.current_score)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition"
                        >
                          Reject Appeal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}