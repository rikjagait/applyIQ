"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
export function ResumeUpload() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function upload() {
    if (!file) return;
    setPending(true);
    setMessage("");
    const body = new FormData();
    body.set("resume", file);
    try {
      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body,
      });
      const result = await response
        .json()
        .catch(() => ({ error: "The upload service returned an invalid response. Please try again." }));
      if (!response.ok)
        throw new Error(result.error || "The résumé could not be uploaded.");
      setMessage(
        `Stored privately and extracted ${result.characters.toLocaleString()} characters. Original formatting is now the tailoring template.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="upload">
      <UploadCloud size={30} color="var(--green)" />
      <h3 style={{ marginTop: 12 }}>Upload the original master résumé</h3>
      <p className="subtle">
        DOCX required for exact formatting · maximum 10 MB · private storage
        only
      </p>
      <div className="actions" style={{ justifyContent: "center" }}>
        <label className="btn" style={{ cursor: "pointer" }}>
          Choose file
          <input
            hidden
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              setName(selected?.name ?? "");
              setMessage("");
            }}
          />
        </label>
        {file && (
          <button className="btn primary" onClick={upload} disabled={pending}>
            {pending ? "Storing securely…" : "Use as master template"}
          </button>
        )}
      </div>
      {name && <p className="truth">Selected: {name}</p>}
      {message && (
        <p className="analysis-banner" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
