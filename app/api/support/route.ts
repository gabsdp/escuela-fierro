import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, moduleTitle, attachments } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const resendAttachments: { filename: string; content: string }[] = [];

    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        try {
          const response = await fetch(att.url);
          if (!response.ok) continue;
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          resendAttachments.push({
            filename: att.name,
            content: base64,
          });
        } catch {
          continue;
        }
      }
    }

    const emailSubject = subject
      ? `[Escuela] ${subject} — ${name}`
      : `[Escuela] Consulta de ${name} — ${moduleTitle || "Sin módulo"}`;

    const { data, error } = await resend.emails.send({
      from: "Escuela Fierro <onboarding@resend.dev>",
      to: "soporte@fierro.com.ar",
      replyTo: email,
      subject: emailSubject,
      html: `
        <h2>Consulta desde Escuela Fierro</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Módulo:</strong> ${moduleTitle || "No especificado"}</p>
        ${subject ? `<p><strong>Asunto:</strong> ${subject}</p>` : ""}
        ${attachments?.length ? `<p><strong>Adjuntos:</strong> ${attachments.map((a: { name: string }) => a.name).join(", ")}</p>` : ""}
        <hr />
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Error al enviar el mail" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("Support API error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
