import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const { data: maxIndex } = await supabase
      .from("courses")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const newOrderIndex = (maxIndex?.order_index ?? -1) + 1;

    const { data: newCourse, error: insertError } = await supabase
      .from("courses")
      .insert({
        title: `${course.title} (copia)`,
        product_key: course.product_key,
        description: course.description,
        order_index: newOrderIndex,
        published: false,
      })
      .select()
      .single();

    if (insertError || !newCourse) {
      return NextResponse.json({ error: insertError?.message ?? "Error al crear el curso" }, { status: 500 });
    }

    const { data: modules } = await supabase
      .from("modules")
      .select("*")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (modules) {
      for (const mod of modules) {
        const { data: newModule } = await supabase
          .from("modules")
          .insert({
            course_id: newCourse.id,
            title: mod.title,
            description: mod.description,
            video_url: mod.video_url,
            order_index: mod.order_index,
            published: mod.published,
          })
          .select()
          .single();

        if (!newModule) continue;

        const { data: files } = await supabase
          .from("module_files")
          .select("*")
          .eq("module_id", mod.id);

        if (files && files.length > 0) {
          await supabase.from("module_files").insert(
            files.map((f: any) => ({
              module_id: newModule.id,
              name: f.name,
              file_url: f.file_url,
            }))
          );
        }

        const { data: checklist } = await supabase
          .from("module_checklist_items")
          .select("*")
          .eq("module_id", mod.id)
          .order("order_index", { ascending: true });

        if (checklist && checklist.length > 0) {
          await supabase.from("module_checklist_items").insert(
            checklist.map((c: any) => ({
              module_id: newModule.id,
              text: c.text,
              order_index: c.order_index,
            }))
          );
        }

        const { data: faq } = await supabase
          .from("module_faq_items")
          .select("*")
          .eq("module_id", mod.id)
          .order("order_index", { ascending: true });

        if (faq && faq.length > 0) {
          await supabase.from("module_faq_items").insert(
            faq.map((f: any) => ({
              module_id: newModule.id,
              question: f.question,
              answer: f.answer,
              order_index: f.order_index,
            }))
          );
        }
      }
    }

    return NextResponse.json({ id: newCourse.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
