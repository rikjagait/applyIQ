"use client";
import { useState } from "react";
import { Plus, UserRound } from "lucide-react";
import type { SavedContact } from "@/lib/repositories/contacts";
import { ContactStatus } from "@/components/contact-status";

export function ContactCapture({
  jobId,
  initialContacts,
}: {
  jobId: string;
  initialContacts: SavedContact[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Record<
      string,
      string
    >;
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, jobId }),
    });
    const result = (await response.json()) as { id?: string; error?: string };
    if (!response.ok) {
      setError(result.error || "Could not save contact.");
      setPending(false);
      return;
    }
    setContacts((current) => [
      {
        id: result.id!,
        name: values.name,
        title: values.title || null,
        relationship: values.relationship || null,
        publicProfileUrl: values.publicProfileUrl || null,
        contactedAt: null,
        response: null,
        followupDate: null,
      },
      ...current,
    ]);
    form.reset();
    setOpen(false);
    setPending(false);
  }
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2>Contact shortlist</h2>
          <p className="subtle">
            Save only people you have personally reviewed.
          </p>
        </div>
        <button
          className="btn primary"
          onClick={() => setOpen((value) => !value)}
        >
          <Plus size={14} />
          {open ? "Close" : "Add contact"}
        </button>
      </div>
      {open && (
        <form className="form contact-form" onSubmit={submit}>
          <div className="grid two-col">
            <label className="field">
              Name
              <input className="input" name="name" required minLength={2} />
            </label>
            <label className="field">
              Current title
              <input className="input" name="title" />
            </label>
          </div>
          <div className="grid two-col">
            <label className="field">
              Relationship
              <select
                className="input"
                name="relationship"
                defaultValue="Recruiter"
              >
                <option>Recruiter</option>
                <option>Hiring manager</option>
                <option>Team member</option>
                <option>Functional leader</option>
                <option>Mutual connection</option>
              </select>
            </label>
            <label className="field">
              Public profile URL
              <input
                className="input"
                name="publicProfileUrl"
                type="url"
                placeholder="https://www.linkedin.com/in/…"
              />
            </label>
          </div>
          <label className="field">
            Private notes
            <textarea
              className="input"
              name="notes"
              style={{ minHeight: 80 }}
            />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button className="btn primary" disabled={pending}>
            {pending ? "Saving…" : "Save reviewed contact"}
          </button>
        </form>
      )}
      <div
        className="stack"
        style={{ gap: 8, marginTop: contacts.length ? 14 : 0 }}
      >
        {contacts.map((contact) => (
          <div className="saved-contact" key={contact.id}>
            <span className="priority-icon">
              <UserRound size={16} />
            </span>
            <div style={{ flex: 1 }}>
              <strong>{contact.name}</strong>
              <span>{contact.title || contact.relationship || "Contact"}</span>
            </div>
            {contact.publicProfileUrl && (
              <a
                className="btn"
                href={contact.publicProfileUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open profile
              </a>
            )}
            <ContactStatus contact={contact} />
          </div>
        ))}
      </div>
      {!contacts.length && !open && (
        <p className="subtle">
          No reviewed contacts saved for this company yet.
        </p>
      )}
    </section>
  );
}
