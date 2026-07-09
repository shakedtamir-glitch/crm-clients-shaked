import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NewTaskDialog } from "@/app/(app)/tasks/task-form";
import { TaskList } from "@/app/(app)/tasks/task-list";
import type { Task } from "@/lib/supabase/types";

export default async function TasksPage() {
  const supabase = await createClient();

  const [{ data: tasksRaw }, { data: clients }, { data: leads }] = await Promise.all([
    supabase.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("clients").select("id, full_name").order("full_name"),
    supabase.from("leads").select("id, full_name").order("full_name"),
  ]);

  const tasks = (tasksRaw ?? []) as Task[];
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.full_name]));
  const leadMap = new Map((leads ?? []).map((l) => [l.id, l.full_name]));

  const enriched = tasks.map((t) => ({
    ...t,
    clientName: t.client_id ? clientMap.get(t.client_id) : null,
    leadName: t.lead_id ? leadMap.get(t.lead_id) : null,
  }));

  const incomplete = enriched.filter((t) => !t.completed);
  const completed = enriched.filter((t) => t.completed);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-0">Tasks</h1>
          <p className="text-sm text-text-2">
            {incomplete.length} open · {completed.length} completed
          </p>
        </div>
        <NewTaskDialog clients={clients ?? []} leads={leads ?? []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <TaskList tasks={incomplete} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <TaskList tasks={completed} />
        </CardContent>
      </Card>
    </div>
  );
}
