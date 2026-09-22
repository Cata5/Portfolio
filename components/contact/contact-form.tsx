"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { gsap } from "@/components/motion/gsap";
import { holeState } from "@/components/triangle-world/black-hole";
import { prefersReducedMotion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactFormProps {
  recipientEmail?: string;
}

export function ContactForm({
  recipientEmail = "cata.manu06@gmail.com",
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    _botField: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const formWrapperRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot field protection
    if (formData._botField) {
      setStatus("success");
      return;
    }

    const scriptUrl =
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ||
      "https://script.google.com/macros/s/AKfycbxVQP7DtOk4uj0j13DR-_UzKSSQJksNFslVDo__TYsE5mp2hUQPeab-dM22i1wEFCEXZQ/exec";

    const payload = JSON.stringify({
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim() || "Portfolio Message",
      message: formData.message.trim(),
    });

    setStatus("submitting");
    setErrorMessage("");

    // POST with a readable response (text/plain avoids a CORS preflight but
    // still lets us read the result). The form previously used mode:"no-cors",
    // which made the response opaque — and success was shown unconditionally,
    // so visitors could see "Message Sent" after a failed delivery.
    let delivered = false;
    try {
      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload,
      });
      delivered = res.ok;
    } catch {
      delivered = false;
    }

    if (!delivered) {
      setStatus("error");
      setErrorMessage(
        "The message could not be sent right now — please try again or email me directly.",
      );
      return;
    }

    const formEl = formWrapperRef.current;
    // Reduced motion: skip the theatrical hand-off entirely.
    if (!formEl || prefersReducedMotion()) {
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        _botField: "",
      });
      return;
    }

    // Shortened signature moment: the hole glides over the form while the
    // message settles into it — one quick beat instead of a 3-second takeover.
    {
      const rect = formEl.getBoundingClientRect();
      const formCenterX = (rect.left + rect.width / 2) / window.innerWidth;
      const formCenterY = (rect.top + rect.height / 2) / window.innerHeight;
      const initialCx = window.innerWidth < 640 ? 0.5 : 0.84;
      const initialOy = 0.50;
      // Elevate canvas above the text & content
      holeState.suctionActive = true;
      holeState.canvasZIndex = 50;
      holeState.targetCx = initialCx;
      holeState.targetOy = initialOy;
      holeState.scaleMul = 1.0;

      const tl = gsap.timeline({
        onComplete: () => {
          // Reset canvas z-index and state
          holeState.canvasZIndex = 0;
          holeState.suctionActive = false;
          holeState.targetCx = initialCx;
          holeState.targetOy = initialOy;
          holeState.scaleMul = 1.0;
          holeState.finalSpin = 1.0;
          holeState.finalPower = 0;

          // Clear GSAP transforms on the form element
          gsap.set(formEl, { clearProps: "all" });

          setStatus("success");
          setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
            _botField: "",
          });
        },
      });

      // Phase 1: Black Hole glides directly over the form text (0.0s -> 0.7s)
      tl.to(
        holeState,
        {
          targetCx: formCenterX,
          targetOy: formCenterY,
          scaleMul: 1.5,
          finalSpin: 3.5,
          finalPower: 1,
          duration: 0.7,
          ease: "power2.inOut",
        },
        0,
      );

      // Phase 2: the form recedes into the hole, no whirl (0.35s -> 0.95s)
      tl.to(
        formEl,
        {
          scale: 0.6,
          opacity: 0,
          filter: "blur(6px)",
          transformOrigin: "50% 50%",
          duration: 0.6,
          ease: "power2.in",
        },
        0.35,
      );

      // Phase 3: the hole returns to rest while the success panel mounts (0.9s -> 1.4s)
      tl.to(
        holeState,
        {
          targetCx: initialCx,
          targetOy: initialOy,
          scaleMul: 1.0,
          finalSpin: 1.0,
          finalPower: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        0.9,
      );
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
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center backdrop-blur-md"
          >
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <CheckCircle2 className="size-7" />
            </div>
            <h3 className="font-mono text-lg font-medium text-foreground">
              Message Sent
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Thank you for reaching out — your message is in my inbox and I will reply shortly.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="mt-6 font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              Send Another Note
            </Button>
          </motion.div>
        ) : (
          <div ref={formWrapperRef}>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Software Role / AI Collaboration / Question"
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
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive-foreground">
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
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full sm:w-auto h-11 px-8 rounded-lg bg-saffron text-black hover:bg-saffron/90 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 shadow-md hover:shadow-saffron/20 cursor-pointer"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-3.5" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
