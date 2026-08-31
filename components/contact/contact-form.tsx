"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactFormProps {
  recipientEmail?: string;
}

export function ContactForm({ recipientEmail = "cata.manu06@gmail.com" }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    _botField: "", // Honeypot field
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check: If bot filled this hidden field, fake success
    if (formData._botField) {
      setStatus("success");
      return;
    }

    const scriptUrl =
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ||
      "https://script.google.com/macros/s/AKfycbxVQP7DtOk4uj0j13DR-_UzKSSQJksNFslVDo__TYsE5mp2hUQPeab-dM22i1wEFCEXZQ/exec";

    if (!scriptUrl) {
      setStatus("error");
      setErrorMessage(
        "Contact endpoint is not configured. Please set NEXT_PUBLIC_GOOGLE_SCRIPT_URL or email directly."
      );
      return;
    }

    try {
      setStatus("submitting");
      setErrorMessage("");

      const payload = JSON.stringify({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || "Portfolio Message",
        message: formData.message.trim(),
      });

      // Send to Google Apps Script Web App
      // text/plain prevents CORS preflight, mode: 'no-cors' allows Google redirect
      await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: payload,
        mode: "no-cors",
      });

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        _botField: "",
      });
    } catch (err) {
      console.error("Failed to submit contact form:", err);
      setStatus("error");
      setErrorMessage("Transmission failed. Please check your connection or send an email directly.");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setErrorMessage("");
  };

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center backdrop-blur-md"
          >
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
              <CheckCircle2 className="size-7" />
            </div>
            <h3 className="font-mono text-lg font-medium text-foreground">
              Message Transmitted
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Thank you for reaching out. Your note has been logged directly into my sheet and sent to my inbox. I will get back to you shortly!
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="mt-6 font-mono text-xs uppercase tracking-wider"
            >
              Send Another Note
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form-state"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Honeypot field (hidden from real users) */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="_botField">Do not fill this field</label>
              <input
                id="_botField"
                type="text"
                name="_botField"
                value={formData._botField}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                  Name <span className="text-saffron">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Ada Lovelace"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={status === "submitting"}
                  className="h-10 border-border/60 bg-background/50 text-sm focus-visible:border-saffron/60 focus-visible:ring-saffron/20"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                  Email <span className="text-saffron">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ada@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={status === "submitting"}
                  className="h-10 border-border/60 bg-background/50 text-sm focus-visible:border-saffron/60 focus-visible:ring-saffron/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="subject"
                className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                placeholder="Software Role / Collaboration / Question"
                value={formData.subject}
                onChange={handleChange}
                disabled={status === "submitting"}
                className="h-10 border-border/60 bg-background/50 text-sm focus-visible:border-saffron/60 focus-visible:ring-saffron/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="message"
                className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                Message <span className="text-saffron">*</span>
              </label>
              <Textarea
                id="message"
                name="message"
                required
                rows={4}
                placeholder="Tell me about your project, idea, or role..."
                value={formData.message}
                onChange={handleChange}
                disabled={status === "submitting"}
                className="min-h-[110px] resize-none border-border/60 bg-background/50 text-sm focus-visible:border-saffron/60 focus-visible:ring-saffron/20"
              />
            </div>

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive-foreground"
              >
                <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">{errorMessage}</p>
                  <p className="text-muted-foreground">
                    You can also email me directly at{" "}
                    <a
                      href={`mailto:${recipientEmail}`}
                      className="text-saffron underline hover:text-foreground"
                    >
                      {recipientEmail}
                    </a>
                  </p>
                </div>
              </motion.div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={status === "submitting"}
                className="w-full sm:w-auto h-11 px-8 rounded-lg bg-saffron text-black hover:bg-saffron/90 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 shadow-md hover:shadow-saffron/20"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Transmitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-3.5" />
                    Transmit Message
                  </>
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
