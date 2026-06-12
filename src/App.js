import { useState } from "react";
import {
  Sparkles, Scale, GraduationCap, MapPin, Globe, Check, X, Star,
  ChevronRight, ChevronLeft, Copy, Link2, ShieldCheck, Plus,
  ArrowRight, Pencil, BadgeCheck, Wand2, Store, Phone, Mail, Tag,
} from "lucide-react";

/* ---------- Brand tokens (Stripe-inspired) ---------- */
const PURPLE = "#635BFF";
const PURPLE_DK = "#4F46E5";
const NAVY = "#0A2540";
const SLATE = "#425466";
const MUTED = "#697386";
const LIGHT = "#F6F9FC";
const LINE = "#E6EBF1";

const CATEGORIES = [
  { name: "Beauty", icon: Sparkles, grad: "linear-gradient(135deg,#FF7AA2,#FF5C8A,#A855F7)" },
  { name: "Legal", icon: Scale, grad: "linear-gradient(135deg,#0A2540,#1E3A8A,#635BFF)" },
  { name: "Education", icon: GraduationCap, grad: "linear-gradient(135deg,#06B6D4,#3B82F6,#635BFF)" },
];
const catGrad = (c) => (CATEGORIES.find((x) => x.name === c) || CATEGORIES[0]).grad;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- Seed data ---------- */
const SEED_BUSINESSES = [
  { id: 1, name: "Lumière Skincare", categories: ["Beauty"], city: "San Francisco", online: true, commission: 15, discount: 10, status: "approved", blurb: "Clinical-grade serums and facials." },
  { id: 2, name: "Glow Bar", categories: ["Beauty"], city: "Austin", online: false, commission: 12, discount: 15, status: "approved", blurb: "Walk-in glow facials & lash bar." },
  { id: 3, name: "Hartwell Law", categories: ["Legal"], city: "New York", online: true, commission: 8, discount: 0, status: "approved", blurb: "Startup & IP counsel for founders." },
  { id: 4, name: "Sterling Legal", categories: ["Legal"], city: "Chicago", online: false, commission: 10, discount: 0, status: "approved", blurb: "Immigration and family law." },
  { id: 5, name: "BrightPath Tutoring", categories: ["Education"], city: "Boston", online: true, commission: 20, discount: 10, status: "approved", blurb: "1:1 SAT and STEM tutoring." },
  { id: 6, name: "CodeLeap Academy", categories: ["Education"], city: "Online", online: true, commission: 18, discount: 0, status: "approved", blurb: "Live cohort coding bootcamps." },
  { id: 7, name: "Velvet Beauty Co", categories: ["Beauty"], city: "Miami", online: false, commission: 14, discount: 20, status: "pending", blurb: "Luxury bridal makeup studio." },
];
const SEED_INFLUENCERS = [
  { handle: "miaglow", name: "Mia Chen", bio: "Skincare & self-care · SF" },
  { handle: "thelegaledit", name: "Sam Rivera", bio: "Demystifying founder legal" },
];
const SEED_LINKS = [
  { id: 1, handle: "miaglow", businessId: 1 },
  { id: 2, handle: "miaglow", businessId: 5 },
  { id: 3, handle: "thelegaledit", businessId: 3 },
];
const SEED_REVIEWS = [
  { id: 1, handle: "miaglow", businessId: 1, stars: 5, text: "My skin has never looked better. The vitamin C serum is unreal." },
  { id: 2, handle: "miaglow", businessId: 5, stars: 4, text: "Tutors are patient and genuinely good. Score jumped 180 points." },
  { id: 3, handle: "thelegaledit", businessId: 3, stars: 5, text: "Handled our SAFE round in a week. Founder-friendly pricing." },
];

const INVITE_CODE = "EASY2025";
const DEMO_OTP = "123123";

/* ---------- Small UI atoms ---------- */
function Btn({ children, onClick, variant = "primary", className = "", style = {}, disabled, type = "button" }) {
  const base = {
    primary: { background: PURPLE, color: "#fff", boxShadow: "0 2px 6px rgba(99,91,255,.35)" },
    dark: { background: NAVY, color: "#fff" },
    ghost: { background: "#fff", color: NAVY, border: `1px solid ${LINE}` },
    soft: { background: "#EEF0FF", color: PURPLE_DK },
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{ ...base, ...style }}
    >
      {children}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold" style={{ color: NAVY }}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs" style={{ color: MUTED }}>{hint}</span>}
    </label>
  );
}
const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition";
const inputStyle = { border: `1px solid ${LINE}`, color: NAVY, background: "#fff" };

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="transition hover:scale-110">
          <Star size={30} strokeWidth={1.5} fill={n <= value ? "#FFB020" : "none"} color={n <= value ? "#FFB020" : "#C9CFD8"} />
        </button>
      ))}
    </div>
  );
}
function StarsRow({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={15} fill={n <= value ? "#FFB020" : "none"} color={n <= value ? "#FFB020" : "#D6DBE2"} />
      ))}
    </div>
  );
}

function Logo({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: PURPLE, color: "#fff" }}>
        <ArrowRight size={18} />
      </span>
      <span className="text-lg font-bold tracking-tight" style={{ color: NAVY }}>
        Easy<span style={{ color: PURPLE }}>Recommend</span>
      </span>
    </button>
  );
}

function Avatar({ name, image, size = 44 }) {
  if (image) {
    return <img src={image} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="grid place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, fontSize: size / 2.6, background: "linear-gradient(135deg,#635BFF,#A855F7)" }}>
      {initials}
    </span>
  );
}

function Modal({ children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" style={{ background: "rgba(10,37,64,.45)", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div
        className={`relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl`}
        style={{ boxShadow: "0 30px 60px rgba(10,37,64,.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full" style={{ background: LIGHT, color: SLATE }}>
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

function Stepper({ step, total }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="h-1.5 flex-1 rounded-full transition" style={{ background: i <= step ? PURPLE : LINE }} />
      ))}
    </div>
  );
}

/* ---------- Business card ---------- */
function BusinessCard({ b, recommendCount }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white transition hover:-translate-y-0.5" style={{ border: `1px solid ${LINE}`, boxShadow: "0 1px 2px rgba(10,37,64,.06)" }}>
      <div className="relative h-28" style={{ background: catGrad(b.categories[0]) }}>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold" style={{ color: NAVY }}>
          {b.categories[0]}
        </span>
        {b.discount > 0 && (
          <span className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: "rgba(10,37,64,.55)" }}>
            {b.discount}% off
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold" style={{ color: NAVY }}>{b.name}</h3>
          <BadgeCheck size={16} color={PURPLE} />
        </div>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>{b.blurb}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: SLATE }}>
          <span className="inline-flex items-center gap-1">
            {b.online ? <Globe size={13} /> : <MapPin size={13} />} {b.online ? "Online" : b.city}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: LINE }}>
          <span className="text-xs" style={{ color: MUTED }}>
            {recommendCount > 0
              ? <span className="inline-flex items-center gap-1"><Star size={12} fill="#FFB020" color="#FFB020" /> Backed by {recommendCount} creator{recommendCount > 1 ? "s" : ""}</span>
              : "Verified business"}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: PURPLE }}>Visit <ArrowRight size={14} /></span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Brand onboarding ---------- */
function BrandModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", phone: "", email: "", categories: [], city: "", online: false, commission: 15, discount: 0, photos: 2 });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleCat = (c) => set("categories", f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c]);

  const valid = [
    f.name && f.phone && f.email,
    f.categories.length > 0 && (f.online || f.city),
    f.commission > 0,
    otp === DEMO_OTP,
  ];

  const titles = ["About your business", "Where to find you", "Your offer", "Verify your number"];

  return (
    <Modal onClose={onClose} wide>
      <div className="p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: PURPLE }}>List your business</p>
        <h2 className="mt-1 text-2xl font-bold" style={{ color: NAVY }}>{titles[step]}</h2>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>Step {step + 1} of 4 · Creators send you customers, you pay only per result.</p>
        <div className="mt-4"><Stepper step={step} total={4} /></div>

        <div className="mt-6 space-y-4">
          {step === 0 && (
            <>
              <Field label="Brand name">
                <input className={inputCls} style={inputStyle} placeholder="Lumière Skincare" value={f.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Phone number">
                <input className={inputCls} style={inputStyle} placeholder="+1 555 010 2030" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <input className={inputCls} style={inputStyle} placeholder="hello@brand.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Categories" hint="Pick all that apply.">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = f.categories.includes(c.name);
                    return (
                      <button key={c.name} type="button" onClick={() => toggleCat(c.name)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition"
                        style={on ? { background: PURPLE, color: "#fff" } : { background: "#fff", color: SLATE, border: `1px solid ${LINE}` }}>
                        <c.icon size={15} /> {c.name}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: NAVY }}>Online business</p>
                  <p className="text-xs" style={{ color: MUTED }}>Serve customers anywhere, no fixed location.</p>
                </div>
                <button type="button" onClick={() => set("online", !f.online)} className="relative h-7 w-12 rounded-full transition" style={{ background: f.online ? PURPLE : "#C9CFD8" }}>
                  <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all" style={{ left: f.online ? 22 : 2 }} />
                </button>
              </div>
              <Field label="City" hint={f.online ? "Optional for online businesses." : "Where customers visit you."}>
                <input className={inputCls} style={inputStyle} placeholder="San Francisco" value={f.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Commission paid to creators" hint="Percent of each sale you'll share.">
                <div className="flex items-center gap-3">
                  <input type="range" min="5" max="40" value={f.commission} onChange={(e) => set("commission", +e.target.value)} className="flex-1" style={{ accentColor: PURPLE }} />
                  <span className="w-14 rounded-lg px-2 py-1 text-center text-sm font-bold" style={{ background: "#EEFBF3", color: "#0E9F6E" }}>{f.commission}%</span>
                </div>
              </Field>
              <Field label="Discount for customers" hint="Optional incentive shown on your listing.">
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="40" value={f.discount} onChange={(e) => set("discount", +e.target.value)} className="flex-1" style={{ accentColor: PURPLE }} />
                  <span className="w-14 rounded-lg px-2 py-1 text-center text-sm font-bold" style={{ background: "#EEF0FF", color: PURPLE_DK }}>{f.discount}%</span>
                </div>
              </Field>
              <Field label="Photos" hint="Add a couple so creators can showcase you.">
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: f.photos }).map((_, i) => (
                    <div key={i} className="relative h-20 w-20 rounded-xl" style={{ background: catGrad(f.categories[0] || "Beauty") }}>
                      <button type="button" onClick={() => set("photos", Math.max(0, f.photos - 1))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow" style={{ color: SLATE }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => set("photos", f.photos + 1)} className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed" style={{ borderColor: LINE, color: MUTED }}>
                    <Plus size={20} />
                  </button>
                </div>
              </Field>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl px-4 py-3" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
                <p className="text-sm" style={{ color: SLATE }}>We sent a 6-digit code to <b style={{ color: NAVY }}>{f.phone || "your phone"}</b>.</p>
              </div>
              {!otpSent ? (
                <Btn variant="dark" onClick={() => setOtpSent(true)} className="w-full">
                  <Phone size={16} /> Send verification code
                </Btn>
              ) : (
                <>
                  <Field label="Enter code" hint={`Demo code: ${DEMO_OTP}`}>
                    <input className={inputCls} style={{ ...inputStyle, letterSpacing: "0.3em", fontWeight: 700, textAlign: "center" }} placeholder="••••••" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                  </Field>
                  {otp && otp !== DEMO_OTP && <p className="text-xs font-semibold" style={{ color: "#E0245E" }}>That code doesn't match. Try {DEMO_OTP}.</p>}
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-7 flex items-center justify-between">
          {step > 0 ? (
            <Btn variant="ghost" onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> Back</Btn>
          ) : <span />}
          {step < 3 ? (
            <Btn onClick={() => setStep(step + 1)} disabled={!valid[step]}>Continue <ChevronRight size={16} /></Btn>
          ) : (
            <Btn onClick={() => onSubmit(f)} disabled={!valid[3]}><Check size={16} /> Submit for review</Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}

function BrandSuccess({ name, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: "#EEFBF3" }}>
          <ShieldCheck size={28} color="#0E9F6E" />
        </div>
        <h2 className="mt-4 text-xl font-bold" style={{ color: NAVY }}>You're in the queue</h2>
        <p className="mt-2 text-sm" style={{ color: SLATE }}>
          <b style={{ color: NAVY }}>{name}</b> was submitted for review. Our team approves new businesses before they go live under their category. You'll get a text once you're listed.
        </p>
        <Btn onClick={onClose} className="mt-6 w-full">Done</Btn>
      </div>
    </Modal>
  );
}

/* ---------- Creator (influencer) flow ---------- */
function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch (e) { /* sandboxed */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>{label}</p>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
        <Link2 size={15} color={PURPLE} className="shrink-0" />
        <code className="flex-1 truncate text-sm" style={{ color: NAVY }}>{value}</code>
        <button onClick={copy} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ background: copied ? "#EEFBF3" : "#fff", color: copied ? "#0E9F6E" : PURPLE, border: `1px solid ${LINE}` }}>
          {copied ? <span className="inline-flex items-center gap-1"><Check size={13} /> Copied</span> : <span className="inline-flex items-center gap-1"><Copy size={13} /> Copy</span>}
        </button>
      </div>
    </div>
  );
}

function CreatorModal({ businesses, influencers, onClose, onComplete, onViewProfile }) {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [image, setImage] = useState("");
  const [pickedId, setPickedId] = useState(null);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");

  const onPickPhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const approved = businesses.filter((b) => b.status === "approved");
  const picked = approved.find((b) => b.id === pickedId);
  const handleClean = username.replace(/[^a-z0-9_]/gi, "").toLowerCase();

  const finish = (withReview) => {
    onComplete({
      handle: handleClean, name: handleClean, image, businessId: pickedId,
      review: withReview && stars > 0 ? { stars, text } : null,
    });
    setStep(3);
  };

  const refUrl = picked ? `easyrecommend.co/r/${handleClean}/${slug(picked.name)}` : "";
  const profileUrl = `easyrecommend.co/@${handleClean}`;

  return (
    <Modal onClose={onClose} wide>
      <div className="p-6 sm:p-8">
        {step < 3 && (
          <>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: PURPLE }}>For creators</p>
            <div className="mt-2"><Stepper step={step} total={3} /></div>
          </>
        )}

        {step === 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Set up your creator profile</h2>
            <p className="text-sm" style={{ color: MUTED }}>Easy Recommend is invite-only. Add a photo and username — that's your whole profile.</p>
            <Field label="Invite code" hint={`Demo code: ${INVITE_CODE}`}>
              <input className={inputCls} style={{ ...inputStyle, letterSpacing: "0.15em", fontWeight: 700 }} placeholder="EASY2025" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </Field>
            <Field label="Profile photo">
              <div className="flex items-center gap-4">
                {image
                  ? <img src={image} alt="" className="h-16 w-16 rounded-full object-cover" />
                  : <span className="grid h-16 w-16 place-items-center rounded-full" style={{ background: "linear-gradient(135deg,#635BFF,#A855F7)", color: "#fff" }}><Sparkles size={22} /></span>}
                <label className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "#EEF0FF", color: PURPLE_DK }}>
                  {image ? "Change photo" : "Upload photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                </label>
              </div>
            </Field>
            <Field label="Username" hint="This becomes your public profile link.">
              <div className="flex items-center rounded-xl px-3.5 py-2.5" style={inputStyle}>
                <span className="text-sm" style={{ color: MUTED }}>easyrecommend.co/@</span>
                <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: NAVY }} placeholder="miaglow" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </Field>
            <Btn className="w-full" disabled={code !== INVITE_CODE || !handleClean} onClick={() => setStep(1)}>Continue <ArrowRight size={16} /></Btn>
            {code && code !== INVITE_CODE && <p className="text-center text-xs font-semibold" style={{ color: "#E0245E" }}>Invalid code. Try {INVITE_CODE}.</p>}
          </div>
        )}

        {step === 1 && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Pick a business to recommend</h2>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>We'll generate a tracked link so you earn on every sale.</p>
            <div className="mt-5 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {approved.map((b) => {
                const on = pickedId === b.id;
                return (
                  <button key={b.id} onClick={() => setPickedId(b.id)} className="flex items-center gap-3 rounded-xl p-3 text-left transition" style={{ border: `1.5px solid ${on ? PURPLE : LINE}`, background: on ? "#F7F7FF" : "#fff" }}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white" style={{ background: catGrad(b.categories[0]) }}>
                      <Store size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold" style={{ color: NAVY }}>{b.name}</span>
                      <span className="block text-xs font-semibold" style={{ color: "#0E9F6E" }}>You earn {b.commission}%</span>
                    </span>
                    {on && <Check size={18} color={PURPLE} />}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-between">
              <Btn variant="ghost" onClick={() => setStep(0)}><ChevronLeft size={16} /> Back</Btn>
              <Btn disabled={!pickedId} onClick={() => setStep(2)}>Continue <ChevronRight size={16} /></Btn>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Leave a review</h2>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>Your honest take on <b style={{ color: NAVY }}>{picked?.name}</b> shows on your profile. Optional, but it builds trust.</p>
            <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl py-5" style={{ background: LIGHT }}>
              <StarPicker value={stars} onChange={setStars} />
              <span className="text-xs font-semibold" style={{ color: MUTED }}>{["Tap to rate", "Poor", "Fair", "Good", "Great", "Amazing"][stars]}</span>
            </div>
            <div className="mt-4">
              <textarea className={inputCls} style={{ ...inputStyle, minHeight: 90, resize: "none" }} placeholder="What did you love about them?" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => finish(false)} className="text-sm font-semibold" style={{ color: MUTED }}>Skip for now</button>
              <Btn onClick={() => finish(true)}><Wand2 size={16} /> Generate my link</Btn>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-2 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: "#EEF0FF" }}>
              <Sparkles size={26} color={PURPLE} />
            </div>
            <h2 className="mt-4 text-xl font-bold" style={{ color: NAVY }}>Your link is live</h2>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>Share the referral link to earn {picked?.commission}% per sale, and drop your profile link in your bio.</p>
            <div className="mt-5 space-y-4 text-left">
              <CopyRow label="Referral link" value={refUrl} />
              <CopyRow label="Your profile · add to bio" value={profileUrl} />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Btn variant="ghost" onClick={onClose}>Close</Btn>
              <Btn onClick={() => { onViewProfile(handleClean); onClose(); }}>View my profile <ArrowRight size={16} /></Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ---------- Admin panel ---------- */
function AdminPanel({ businesses, onApprove, onReject, onEdit, onBack }) {
  const [editing, setEditing] = useState(null);
  const pending = businesses.filter((b) => b.status === "pending");
  const approved = businesses.filter((b) => b.status === "approved");

  const Row = ({ b }) => {
    const isEdit = editing === b.id;
    const [c, setC] = useState(b.commission);
    const [d, setD] = useState(b.discount);
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center" style={{ border: `1px solid ${LINE}` }}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: catGrad(b.categories[0]) }}>
          <Store size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold" style={{ color: NAVY }}>{b.name}</p>
          <p className="text-xs" style={{ color: MUTED }}>{b.categories.join(", ")} · {b.online ? "Online" : b.city}</p>
        </div>
        {isEdit ? (
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: MUTED }}>Comm
              <input type="number" value={c} onChange={(e) => setC(+e.target.value)} className="ml-1 w-14 rounded-lg px-2 py-1 text-sm" style={inputStyle} />%
            </label>
            <label className="text-xs" style={{ color: MUTED }}>Disc
              <input type="number" value={d} onChange={(e) => setD(+e.target.value)} className="ml-1 w-14 rounded-lg px-2 py-1 text-sm" style={inputStyle} />%
            </label>
            <Btn className="!px-3 !py-2" onClick={() => { onEdit(b.id, { commission: c, discount: d }); setEditing(null); }}><Check size={15} /></Btn>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "#EEFBF3", color: "#0E9F6E" }}>{b.commission}%</span>
            {b.discount > 0 && <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "#EEF0FF", color: PURPLE_DK }}>{b.discount}% off</span>}
            {b.status === "pending" ? (
              <>
                <Btn variant="ghost" className="!px-3 !py-2" onClick={() => onReject(b.id)}><X size={15} /></Btn>
                <Btn className="!px-3 !py-2" onClick={() => onApprove(b.id)}><Check size={15} /> Approve</Btn>
              </>
            ) : (
              <Btn variant="ghost" className="!px-3 !py-2" onClick={() => setEditing(b.id)}><Pencil size={14} /> Edit</Btn>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: PURPLE }}><ChevronLeft size={15} /> Back to site</button>
      <h1 className="text-3xl font-bold" style={{ color: NAVY }}>Admin review</h1>
      <p className="mt-1 text-sm" style={{ color: MUTED }}>Approve businesses to make them visible under their category, or adjust their terms.</p>

      <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: SLATE }}>
        Pending {pending.length > 0 && <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ background: "#FF8A00" }}>{pending.length}</span>}
      </h2>
      <div className="space-y-3">
        {pending.length === 0 ? <p className="rounded-2xl py-8 text-center text-sm" style={{ background: LIGHT, color: MUTED }}>Nothing waiting. You're all caught up.</p> : pending.map((b) => <Row key={b.id} b={b} />)}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide" style={{ color: SLATE }}>Live ({approved.length})</h2>
      <div className="space-y-3">{approved.map((b) => <Row key={b.id} b={b} />)}</div>
    </div>
  );
}

/* ---------- Influencer public profile ---------- */
function InfluencerProfile({ handle, influencers, businesses, links, reviews, onBack, onBrowse }) {
  const inf = influencers.find((i) => i.handle === handle);
  const myLinks = links.filter((l) => l.handle === handle);
  const myBizIds = [...new Set(myLinks.map((l) => l.businessId))];
  const myBiz = myBizIds.map((id) => businesses.find((b) => b.id === id)).filter(Boolean);
  const myReviews = reviews.filter((r) => r.handle === handle);
  const reviewFor = (id) => myReviews.find((r) => r.businessId === id);

  if (!inf) return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center">
      <p style={{ color: MUTED }}>That profile doesn't exist yet.</p>
      <Btn onClick={onBack} className="mt-4">Back home</Btn>
    </div>
  );

  return (
    <div>
      <div className="px-5 pt-6" style={{ background: `linear-gradient(180deg,${LIGHT},#fff)` }}>
        <div className="mx-auto max-w-2xl">
          <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: PURPLE }}><ChevronLeft size={15} /> Easy Recommend</button>
          <div className="mt-6 flex items-center gap-4 pb-8">
            <Avatar name={inf.name} image={inf.image} size={72} />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{inf.name}</h1>
                <BadgeCheck size={20} color={PURPLE} />
              </div>
              <p className="text-sm" style={{ color: MUTED }}>@{inf.handle} · {inf.bio || "Curating brands I trust"}</p>
              <p className="mt-1 text-xs font-semibold" style={{ color: SLATE }}>{myBiz.length} recommendation{myBiz.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: SLATE }}>Brands I recommend</h2>
        {myBiz.length === 0 ? (
          <p className="rounded-2xl py-10 text-center text-sm" style={{ background: LIGHT, color: MUTED }}>No recommendations yet.</p>
        ) : (
          <div className="space-y-4">
            {myBiz.map((b) => {
              const rev = reviewFor(b.id);
              return (
                <div key={b.id} className="overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${LINE}`, boxShadow: "0 1px 2px rgba(10,37,64,.06)" }}>
                  <div className="flex items-center gap-3 p-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white" style={{ background: catGrad(b.categories[0]) }}>
                      <Store size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold" style={{ color: NAVY }}>{b.name}</h3>
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: LIGHT, color: SLATE }}>{b.categories[0]}</span>
                      </div>
                      <p className="text-xs" style={{ color: MUTED }}>{b.online ? "Online" : b.city}{b.discount > 0 ? ` · ${b.discount}% off via this link` : ""}</p>
                    </div>
                    <Btn className="!px-4 !py-2 shrink-0">Visit <ArrowRight size={14} /></Btn>
                  </div>
                  {rev && (
                    <div className="border-t px-4 py-3" style={{ borderColor: LINE, background: LIGHT }}>
                      <div className="flex items-center gap-2">
                        <StarsRow value={rev.stars} />
                        <span className="text-xs font-semibold" style={{ color: SLATE }}>{inf.name.split(" ")[0]}'s review</span>
                      </div>
                      {rev.text && <p className="mt-1.5 text-sm" style={{ color: SLATE }}>"{rev.text}"</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-8 rounded-2xl p-5 text-center" style={{ background: NAVY }}>
          <p className="text-sm font-semibold text-white">Want recommendations like these?</p>
          <Btn variant="soft" className="mt-3" onClick={onBrowse}>Browse all brands <ArrowRight size={15} /></Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- Landing ---------- */
function Landing({ activeCat, setActiveCat, businesses, links, onList, onCreator, onAdmin, influencers, onProfile }) {
  const counts = (id) => links.filter((l) => l.businessId === id).length;
  const visible = businesses.filter((b) => b.status === "approved" && b.categories.includes(activeCat));

  return (
    <div>
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-white/80" style={{ borderColor: LINE, backdropFilter: "blur(10px)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <div className="flex items-center gap-2">
            <button onClick={onAdmin} className="hidden rounded-full px-3 py-2 text-sm font-semibold sm:block" style={{ color: SLATE }}>Admin</button>
            <Btn variant="ghost" onClick={onCreator}>I'm a creator</Btn>
            <Btn variant="dark" onClick={onList}>List business</Btn>
          </div>
        </div>
      </header>

      {/* Hero with Stripe-style angled gradient */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[440px] -z-0"
          style={{ background: "linear-gradient(135deg,#1A1F71 0%,#635BFF 45%,#A855F7 75%,#FF7AA2 100%)", clipPath: "polygon(0 0,100% 0,100% 72%,0 100%)" }} />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Sparkles size={13} /> Creators earn per commission
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] text-white sm:text-6xl">
              Recommendations<br />that actually pay out.
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/85 sm:text-lg">
              Easy Recommend connects vetted local and online businesses with creators. Brands pay only when a referral converts. Creators get a link, a profile, and a cut of every sale.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Btn variant="primary" onClick={onCreator} style={{ background: "#fff", color: PURPLE }}>Start earning <ArrowRight size={16} /></Btn>
              <Btn onClick={onList} style={{ background: "rgba(255,255,255,.16)", color: "#fff", boxShadow: "none" }}>List your business</Btn>
            </div>
          </div>

          {/* Floating stat card */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { k: "Pay per result", v: "No upfront", d: "Brands fund only converted referrals." },
              { k: "Avg. commission", v: "8–20%", d: "Set by each business, paid on every sale." },
              { k: "One link, one bio", v: "Your profile", d: "Every brand you back, in one place." },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white p-5" style={{ boxShadow: "0 20px 40px rgba(10,37,64,.12)", border: `1px solid ${LINE}` }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{s.k}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: NAVY }}>{s.v}</p>
                <p className="mt-1 text-sm" style={{ color: SLATE }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by category */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: PURPLE }}>Browse</p>
            <h2 className="mt-1 text-3xl font-bold" style={{ color: NAVY }}>Vetted businesses by category</h2>
          </div>
          <div className="flex gap-2">
            {CATEGORIES.map((c) => {
              const on = activeCat === c.name;
              return (
                <button key={c.name} onClick={() => setActiveCat(c.name)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition"
                  style={on ? { background: NAVY, color: "#fff" } : { background: "#fff", color: SLATE, border: `1px solid ${LINE}` }}>
                  <c.icon size={15} /> {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((b) => <BusinessCard key={b.id} b={b} recommendCount={counts(b.id)} />)}
        </div>
        {visible.length === 0 && <p className="mt-8 rounded-2xl py-12 text-center text-sm" style={{ background: LIGHT, color: MUTED }}>No live businesses in {activeCat} yet. Check back soon.</p>}
      </section>

      {/* Featured creators */}
      <section className="border-t" style={{ borderColor: LINE, background: LIGHT }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-bold" style={{ color: NAVY }}>Creators on Easy Recommend</h2>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>Tap a profile to see the brands they back and their reviews.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {influencers.map((inf) => {
              const n = links.filter((l) => l.handle === inf.handle).length;
              return (
                <button key={inf.handle} onClick={() => onProfile(inf.handle)} className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left transition hover:-translate-y-0.5" style={{ border: `1px solid ${LINE}` }}>
                  <Avatar name={inf.name} image={inf.image} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold" style={{ color: NAVY }}>{inf.name}</p>
                      <BadgeCheck size={15} color={PURPLE} />
                    </div>
                    <p className="text-xs" style={{ color: MUTED }}>@{inf.handle} · {n} recommendation{n !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight size={18} color={MUTED} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-bold" style={{ color: NAVY }}>How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { t: "Brands list & get approved", d: "Add your details, offer a commission, verify by text. We review before you go live." , i: Store },
            { t: "Creators generate a link", d: "Use your invite code, pick a brand, leave a review, and get a tracked referral link.", i: Link2 },
            { t: "Earn on every sale", d: "Drop your profile link in your bio. Customers save, you earn your commission.", i: BadgeCheck },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ border: `1px solid ${LINE}`, background: "#fff" }}>
              <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "#EEF0FF", color: PURPLE }}><s.i size={20} /></span>
              <p className="mt-4 text-xs font-bold" style={{ color: PURPLE }}>0{i + 1}</p>
              <h3 className="mt-1 text-lg font-bold" style={{ color: NAVY }}>{s.t}</h3>
              <p className="mt-1 text-sm" style={{ color: SLATE }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="overflow-hidden rounded-3xl px-8 py-14 text-center" style={{ background: "linear-gradient(120deg,#0A2540,#1A1F71,#635BFF)" }}>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Start earning per recommendation</h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">Join as a creator with your invite code, or list your business in minutes.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Btn onClick={onCreator} style={{ background: "#fff", color: PURPLE }}>I'm a creator</Btn>
            <Btn onClick={onList} style={{ background: "rgba(255,255,255,.16)", color: "#fff", boxShadow: "none" }}>List your business</Btn>
          </div>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 sm:flex-row">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <p className="text-xs" style={{ color: MUTED }}>© {new Date().getFullYear()} Easy Recommend · Creators earn per commission</p>
          <button onClick={onAdmin} className="text-xs font-semibold" style={{ color: SLATE }}>Admin</button>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Root ---------- */
export default function App() {
  const [view, setView] = useState("home"); // home | admin | profile
  const [profileHandle, setProfileHandle] = useState(null);
  const [activeCat, setActiveCat] = useState("Beauty");

  const [businesses, setBusinesses] = useState(SEED_BUSINESSES);
  const [influencers, setInfluencers] = useState(SEED_INFLUENCERS);
  const [links, setLinks] = useState(SEED_LINKS);
  const [reviews, setReviews] = useState(SEED_REVIEWS);

  const [brandOpen, setBrandOpen] = useState(false);
  const [brandDone, setBrandDone] = useState(null);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const goProfile = (h) => { setProfileHandle(h); setView("profile"); window.scrollTo(0, 0); };
  const goHome = () => { setView("home"); window.scrollTo(0, 0); };

  const submitBrand = (f) => {
    const id = Date.now();
    setBusinesses((p) => [...p, { id, name: f.name, categories: f.categories, city: f.city, online: f.online, commission: f.commission, discount: f.discount, status: "pending", blurb: "Newly submitted business." }]);
    setBrandOpen(false);
    setBrandDone(f.name);
  };

  const completeCreator = ({ handle, name, image, businessId, review }) => {
    setInfluencers((p) => p.find((i) => i.handle === handle) ? p : [...p, { handle, name, image: image || "", bio: "Curating brands I trust" }]);
    setLinks((p) => [...p, { id: Date.now(), handle, businessId }]);
    if (review) setReviews((p) => [...p, { id: Date.now() + 1, handle, businessId, stars: review.stars, text: review.text }]);
  };

  return (
    <div style={{ background: "#fff", fontFamily: "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", color: NAVY, minHeight: "100vh" }}>
      {view === "home" && (
        <Landing
          activeCat={activeCat} setActiveCat={setActiveCat}
          businesses={businesses} links={links} influencers={influencers}
          onList={() => setBrandOpen(true)} onCreator={() => setCreatorOpen(true)}
          onAdmin={() => { setView("admin"); window.scrollTo(0, 0); }}
          onProfile={goProfile}
        />
      )}

      {view === "admin" && (
        <AdminPanel
          businesses={businesses}
          onApprove={(id) => setBusinesses((p) => p.map((b) => b.id === id ? { ...b, status: "approved" } : b))}
          onReject={(id) => setBusinesses((p) => p.filter((b) => b.id !== id))}
          onEdit={(id, patch) => setBusinesses((p) => p.map((b) => b.id === id ? { ...b, ...patch } : b))}
          onBack={goHome}
        />
      )}

      {view === "profile" && (
        <InfluencerProfile
          handle={profileHandle} influencers={influencers} businesses={businesses}
          links={links} reviews={reviews} onBack={goHome} onBrowse={goHome}
        />
      )}

      {brandOpen && <BrandModal onClose={() => setBrandOpen(false)} onSubmit={submitBrand} />}
      {brandDone && <BrandSuccess name={brandDone} onClose={() => setBrandDone(null)} />}
      {creatorOpen && (
        <CreatorModal
          businesses={businesses} influencers={influencers}
          onClose={() => setCreatorOpen(false)}
          onComplete={completeCreator}
          onViewProfile={goProfile}
        />
      )}
    </div>
  );
}