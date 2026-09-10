"use client";

import { useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

export function ImageUploadField({
  name,
  label,
  defaultUrl,
  folder,
}: {
  name: string;
  label: string;
  defaultUrl?: string | null;
  folder: string;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(defaultUrl || null);
  const [url, setUrl] = useState<string>(defaultUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not signed in.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("public-media").upload(path, file, {
      upsert: true,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("public-media").getPublicUrl(path);
    setUrl(data.publicUrl);
    setPreview(data.publicUrl);
    setUploading(false);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--chalk-300)" }}>{label}</label>
      <input type="hidden" name={name} value={url} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: "var(--pitch-950)",
            border: "1px solid var(--pitch-700)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 22 }}>📷</span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              fontSize: 12,
              padding: "8px 14px",
              background: "var(--pitch-700)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            {uploading ? "Uploading…" : preview ? "Change photo" : "Add photo"}
          </button>
          {error && <div style={{ color: "var(--danger-500)", fontSize: 12, marginTop: 6 }}>{error}</div>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}
