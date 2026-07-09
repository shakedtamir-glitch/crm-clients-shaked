"use client";

import { useActionState } from "react";
import { Plus, FileText, Video, Image as ImageIcon, File, Trash2 } from "lucide-react";
import type { AttachmentType } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { uploadAttachmentAction, deleteAttachmentAction, type FormState } from "@/app/(app)/clients/actions";
import { formatDate } from "@/lib/utils";

const ICONS: Record<AttachmentType, typeof FileText> = {
  pdf: FileText,
  video: Video,
  image: ImageIcon,
  document: File,
};

const initialState: FormState = { error: null };

export type AttachmentWithUrl = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: AttachmentType;
  created_at: string;
  url: string | null;
};

export function AttachmentsTab({ clientId, attachments }: { clientId: string; attachments: AttachmentWithUrl[] }) {
  const action = uploadAttachmentAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> Upload file
            </Button>
          </DialogTrigger>
          <DialogContent title="Upload attachment">
            <form action={formAction} className="flex flex-col gap-3">
              <div>
                <Label htmlFor="file">File (PDF, video, image, document)</Label>
                <Input id="file" name="file" type="file" required />
              </div>
              {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
              <Button type="submit" disabled={pending} className="justify-center">
                {pending ? "Uploading…" : "Upload"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
        {attachments.length === 0 && <p className="text-sm text-text-3">No files uploaded yet.</p>}
        {attachments.map((a) => {
          const Icon = ICONS[a.file_type];
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-text-2">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                {a.url ? (
                  <a href={a.url} target="_blank" rel="noreferrer" className="block truncate text-[13px] font-medium text-text-0 hover:text-accent-strong">
                    {a.file_name}
                  </a>
                ) : (
                  <p className="truncate text-[13px] font-medium text-text-0">{a.file_name}</p>
                )}
                <p className="text-[11px] text-text-3">{formatDate(a.created_at)}</p>
              </div>
              <button
                onClick={() => deleteAttachmentAction(clientId, a.id, a.file_path)}
                className="shrink-0 rounded-lg p-1.5 text-text-3 hover:bg-danger-soft hover:text-danger"
                aria-label="Delete file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
