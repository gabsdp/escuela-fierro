"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Loader2, CheckCircle } from "lucide-react";

interface Props {
  courseId: string;
}

export default function ReminderPanel({ courseId }: Props) {
  const [days, setDays] = useState(5);
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [sent7d, setSent7d] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/reminders/config?course_id=${courseId}`);
        const data = await res.json();
        if (data.config) {
          setDays(data.config.days_inactive);
          setMessage(data.config.message);
          setEnabled(data.config.enabled);
        }
        setSent7d(data.reminders_sent_7d ?? 0);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, [courseId]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await fetch("/api/admin/reminders/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, days_inactive: days, message, enabled }),
      });
    } catch {
      setError("Error al guardar configuración");
    }
    setSaving(false);
  };

  const handleSend = async () => {
    setSending(true);
    setError("");
    setSentCount(null);
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSentCount(data.sent);
        setSent7d((prev) => prev + data.sent);
      } else {
        setError(data.error || "Error al enviar");
      }
    } catch {
      setError("Error de conexión");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-10 bg-gray-200 rounded mb-3" />
        <div className="h-24 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
      <h2 className="text-lg font-semibold text-[#212121] flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-[#F5A623]" />
        Recordatorios automáticos
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-[#212121] font-medium">
            Enviar recordatorio si no hay avances en
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-16 px-2 py-1.5 border border-[#E0E0E0] rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] text-sm"
          />
          <span className="text-sm text-[#666666]">días</span>
        </div>

        <div>
          <label className="block text-sm text-[#212121] font-medium mb-1">
            Mensaje del recordatorio
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E6FBF] text-sm resize-none"
          />
          <p className="text-xs text-[#888888] mt-1">
            Podés usar {"{nombre}"}, {"{curso}"} y {"{dias}"} como variables en el mensaje.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1B3A7A] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#162e63] transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>

          <button
            onClick={handleSend}
            disabled={sending || !enabled}
            className="bg-[#F5A623] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#e09515] transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar recordatorios ahora
              </>
            )}
          </button>
        </div>

        {sentCount !== null && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            {sentCount === 0
              ? "No hay alumnos para recordar (todos están al día o ya recibieron recordatorio)"
              : `Se enviaron ${sentCount} recordatorio${sentCount !== 1 ? "s" : ""}`}
          </div>
        )}

        {sent7d > 0 && sentCount === null && (
          <p className="text-xs text-[#888888]">
            {sent7d} recordatorio{sent7d !== 1 ? "s" : ""} enviado{sent7d !== 1 ? "s" : ""} en los últimos 7 días.
          </p>
        )}
      </div>
    </div>
  );
}
