import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { askAssistant, getAssistantLogs } from "../../api/assistantApi";

const QUICK_PROMPTS = [
  { label: "Who was late the most this month?", icon: "schedule" },
  { label: "مين أكتر موظفين اتأخروا الشهر ده؟", icon: "schedule" },
  { label: "Show high severity anomalies", icon: "warning" },
  { label: "وريني التنبيهات عالية الخطورة", icon: "warning" },
  { label: "Show pending leave requests", icon: "pending_actions" },
  { label: "كام طلب إجازة معلق؟", icon: "pending_actions" },
  { label: "Show promotion review candidates", icon: "auto_awesome" },
  { label: "مين المرشحين للترقية للمراجعة؟", icon: "auto_awesome" },
  { label: "What is the total payroll this month?", icon: "payments" },
  { label: "ملخص المرتبات الشهر ده", icon: "payments" },
  { label: "How many employees are in Engineering?", icon: "groups" }
];

let msgCounter = 0;
function generateId(prefix = "msg") {
  msgCounter += 1;
  return `${prefix}-${msgCounter}`;
}

export default function HRAssistant() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your HR Smart Assistant. You can ask me factual, natural-language questions about your workforce — including attendance trends, pending leaves, payroll aggregates, performance reviews, open anomalies, and promotion/bonus recommendations.",
      sources: []
    }
  ]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: generateId("user"),
      sender: "user",
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await askAssistant(textToSend);
      const data = res.data?.data || {};

      const assistantMsg = {
        id: generateId("assistant"),
        sender: "assistant",
        text: data.answer || "I processed your request, but no additional commentary was generated.",
        intent: data.intent,
        sources: data.sources || [],
        raw: data.raw
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Assistant request error:", err);
      const errMsg =
        err.response?.data?.message ||
        "The smart assistant is temporarily unavailable. Please try again later.";

      const assistantErrorMsg = {
        id: generateId("assistant-err"),
        sender: "assistant",
        isError: true,
        text: errMsg,
        sources: []
      };

      setMessages((prev) => [...prev, assistantErrorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: generateId("welcome-reset"),
        sender: "assistant",
        text: "Conversation cleared. How can I assist you with your HR data today?",
        sources: []
      }
    ]);
  };

  const loadAuditLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsModalOpen(true);
      const res = await getAssistantLogs({ limit: 25 });
      setAuditLogs(res.data?.data?.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Structured UI details depending on tool/intent
  const renderStructuredData = (msg) => {
    if (!msg.raw) return null;
    const { intent, raw } = msg;

    // Attendance summary
    if (intent === "getAttendanceSummary" && typeof raw === "object") {
      return (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/20">
          <div className="bg-surface-container-high/60 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-outline">Present</span>
            <p className="text-base font-bold text-emerald-600 font-headline">{raw.present ?? 0}</p>
          </div>
          <div className="bg-surface-container-high/60 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-outline">Late</span>
            <p className="text-base font-bold text-amber-600 font-headline">{raw.late ?? 0}</p>
          </div>
          <div className="bg-surface-container-high/60 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-outline">Absent</span>
            <p className="text-base font-bold text-rose-600 font-headline">{raw.absent ?? 0}</p>
          </div>
          <div className="bg-surface-container-high/60 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-outline">Avg Hours</span>
            <p className="text-base font-bold text-primary font-headline">{raw.averageWorkingHours ?? 0}h</p>
          </div>
        </div>
      );
    }

    // Late employees list
    if (intent === "getLateEmployees" && Array.isArray(raw) && raw.length > 0) {
      return (
        <div className="mt-3 pt-2 border-t border-outline-variant/20 space-y-1.5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider">Top Late Records</p>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {raw.slice(0, 5).map((emp, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-surface-container-high/50 p-2 rounded-lg">
                <span className="font-semibold text-on-surface">
                  {emp.employee_name} <span className="text-[10px] text-on-surface-variant font-normal">({emp.department})</span>
                </span>
                <span className="font-bold text-amber-600">
                  {emp.late_days} days ({emp.total_late_minutes}m)
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Open anomalies summary
    if (intent === "getOpenAnomalies" && raw && typeof raw === "object") {
      return (
        <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20">
          <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-rose-600">High</span>
            <p className="text-base font-bold text-rose-600 font-headline">{raw.high ?? 0}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600">Medium</span>
            <p className="text-base font-bold text-amber-600 font-headline">{raw.medium ?? 0}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600">Low</span>
            <p className="text-base font-bold text-blue-600 font-headline">{raw.low ?? 0}</p>
          </div>
        </div>
      );
    }

    // Payroll summary
    if (intent === "getPayrollSummary" && raw && typeof raw === "object") {
      return (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/20">
          <div className="bg-surface-container-high/60 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-outline">Employees</span>
            <p className="text-sm font-bold text-on-surface font-headline">{raw.employeeCount ?? 0}</p>
          </div>
          <div className="bg-surface-container-high/60 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-outline">Total Net</span>
            <p className="text-sm font-bold text-emerald-600 font-headline">${(raw.totalNetSalary ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-surface-container-high/60 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-outline">Deductions</span>
            <p className="text-sm font-bold text-rose-600 font-headline">${(raw.totalDeductions ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-surface-container-high/60 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-outline">Bonuses</span>
            <p className="text-sm font-bold text-primary font-headline">${(raw.totalBonuses ?? 0).toLocaleString()}</p>
          </div>
        </div>
      );
    }

    // Recommendations summary
    if (intent === "getRecommendations" && raw?.byType) {
      return (
        <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20">
          <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-primary">Promotion</span>
            <p className="text-base font-bold text-primary font-headline">{raw.byType.promotion_review ?? 0}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Bonus</span>
            <p className="text-base font-bold text-emerald-600 font-headline">{raw.byType.bonus_consideration ?? 0}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600">Support</span>
            <p className="text-base font-bold text-amber-600 font-headline">{raw.byType.support_checkin ?? 0}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-2xl">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-headline text-on-surface">HR Smart Assistant</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                Phase 4 Live
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Conversational intelligence grounded in real-time verified database tools.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAuditLogs}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
            title="Inspect Assistant Audit Logs"
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span className="hidden sm:inline">Audit Log</span>
          </button>
          <button
            onClick={handleClearChat}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
            title="Reset Chat Session"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-thin">
        <span className="text-[11px] font-bold text-outline uppercase tracking-wider whitespace-nowrap pl-1">
          Suggestions:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt.label)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-medium text-on-surface hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap disabled:opacity-50 shrink-0 shadow-2xs"
          >
            <span className="material-symbols-outlined text-sm text-primary">{prompt.icon}</span>
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 sm:p-6 overflow-y-auto space-y-4 shadow-sm">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? "bg-secondary text-white"
                    : msg.isError
                    ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isUser ? "person" : msg.isError ? "error" : "smart_toy"}
                </span>
              </div>

              {/* Message Bubble */}
              <div className="space-y-1 min-w-0">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? "bg-primary text-white rounded-tr-xs"
                      : msg.isError
                      ? "bg-rose-500/10 text-rose-700 border border-rose-500/20 rounded-tl-xs"
                      : "bg-surface-container-low text-on-surface border border-outline-variant/30 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-start leading-relaxed" dir="auto">
                    {msg.text}
                  </p>

                  {/* Optional Structured Card */}
                  {!isUser && renderStructuredData(msg)}
                </div>

                {/* Footer Attribution / Sources */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-1 text-[11px] text-on-surface-variant">
                    <span className="font-semibold text-outline">Data Source:</span>
                    {msg.sources.map((src, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-[10px] font-medium"
                      >
                        <span className="material-symbols-outlined text-[11px] text-primary">verified</span>
                        <span>{src.type} ({src.tool})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-3 rounded-2xl text-xs text-on-surface-variant flex items-center gap-2">
              <span className="font-semibold">Analyzing HR data...</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-surface-container-low p-2.5 sm:p-3 rounded-2xl border border-outline-variant/30 shadow-sm shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            dir="auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask anything about employees, attendance, leaves, payroll, anomalies, or recommendations..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-hidden disabled:opacity-50 text-start"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white hover:opacity-95 disabled:opacity-40 transition-all shadow-md shadow-primary/20 shrink-0"
            title="Send query"
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </form>
      </div>

      {/* Audit Log Modal */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Assistant Audit Logs
                </h3>
              </div>
              <button
                onClick={() => setLogsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {logsLoading ? (
                <div className="p-8 text-center text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl animate-spin text-primary mb-2 block">progress_activity</span>
                  Loading audit logs...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-on-surface-variant">
                  No assistant queries logged yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary font-mono text-[11px]">
                        {log.tool_name || log.intent || "unknown"}
                      </span>
                      <span className="text-[10px] text-outline">
                        {new Date(log.createdAt).toLocaleTimeString()} · {log.execution_time_ms}ms
                      </span>
                    </div>
                    <p className="text-on-surface font-medium">&quot;{log.question}&quot;</p>
                    {log.response_summary && (
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">
                        {log.response_summary}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
