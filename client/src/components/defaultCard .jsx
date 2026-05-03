import { useState, useRef } from "react";

const defaultCard = {
  beforeLabel: "לפני",
  afterLabel: "אחרי",
  amount: "₪350",
  date: "29/04/2025",
  description: "ספה תלת מושבית במצב טוב, נקייה ומוכנה למסירה",
};

function DonationCard({ card, onUpdate }) {
  const [hovered, setHovered] = useState(false);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const beforeRef = useRef();
  const afterRef = useRef();

  const handleImage = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === "before") setBeforePreview(ev.target.result);
      else setAfterPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-xl, 20px)",
      overflow: "hidden",
      maxWidth: 400,
      width: "100%",
      fontFamily: "var(--font-sans)",
      boxShadow: "none",
      direction: "rtl",
    }}>
      {/* תמונה עם אנימציה */}
      <div
        style={{ position: "relative", width: "100%", height: 240, cursor: "pointer", overflow: "hidden", background: "var(--color-background-secondary)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* שכבה "לפני" */}
        <div style={{
          position: "absolute", inset: 0,
          opacity: hovered ? 0 : 1,
          transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 1,
        }}>
          {beforePreview
            ? <img src={beforePreview} alt="לפני" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (
              <div
                style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                onClick={() => beforeRef.current.click()}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.2">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>העלה תמונה — לפני</span>
              </div>
            )
          }
          <input ref={beforeRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImage(e, "before")} />
          {/* תגית לפני */}
          <div style={{
            position: "absolute", bottom: 14, right: 14, zIndex: 2,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            color: "#fff", fontSize: 13, fontWeight: 500,
            padding: "4px 14px", borderRadius: 20,
          }}>
            {card.beforeLabel}
          </div>
          {/* כפתור החלפת תמונה */}
          {beforePreview && (
            <button
              onClick={e => { e.stopPropagation(); beforeRef.current.click(); }}
              style={{
                position: "absolute", top: 10, left: 10, zIndex: 3,
                background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 20,
                color: "#fff", fontSize: 11, padding: "3px 10px", cursor: "pointer"
              }}
            >החלף</button>
          )}
        </div>

        {/* שכבה "אחרי" */}
        <div style={{
          position: "absolute", inset: 0,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 1,
        }}>
          {afterPreview
            ? <img src={afterPreview} alt="אחרי" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (
              <div
                style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                onClick={() => afterRef.current.click()}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.2">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>העלה תמונה — אחרי</span>
              </div>
            )
          }
          <input ref={afterRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImage(e, "after")} />
          {/* תגית אחרי */}
          <div style={{
            position: "absolute", bottom: 14, right: 14, zIndex: 2,
            background: "rgba(15,110,86,0.85)",
            backdropFilter: "blur(4px)",
            color: "#fff", fontSize: 13, fontWeight: 500,
            padding: "4px 14px", borderRadius: 20,
          }}>
            {card.afterLabel}
          </div>
          {afterPreview && (
            <button
              onClick={e => { e.stopPropagation(); afterRef.current.click(); }}
              style={{
                position: "absolute", top: 10, left: 10, zIndex: 3,
                background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 20,
                color: "#fff", fontSize: 11, padding: "3px 10px", cursor: "pointer"
              }}
            >החלף</button>
          )}
        </div>

        {/* פס מחוון */}
        <div style={{
          position: "absolute", top: 10, right: 10, left: 10, zIndex: 4,
          display: "flex", gap: 4,
        }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: hovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.9)", transition: "background 0.5s" }} />
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", transition: "background 0.5s" }} />
        </div>
      </div>

      {/* תוכן הכרטיסייה */}
      <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* שורה עליונה: כמות + תאריך */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <EditableField
            value={card.amount}
            onChange={v => onUpdate({ ...card, amount: v })}
            style={{ fontSize: 22, fontWeight: 500, color: "#0F6E56" }}
            prefix="סכום: "
          />
          <EditableField
            value={card.date}
            onChange={v => onUpdate({ ...card, date: v })}
            style={{ fontSize: 13, color: "var(--color-text-secondary)" }}
          />
        </div>

        {/* תיאור */}
        <EditableTextarea
          value={card.description}
          onChange={v => onUpdate({ ...card, description: v })}
        />

        {/* כיתובי לפני / אחרי */}
        <div style={{ display: "flex", gap: 10, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>כיתוב לפני</div>
            <input
              value={card.beforeLabel}
              onChange={e => onUpdate({ ...card, beforeLabel: e.target.value })}
              style={{ width: "100%", fontSize: 13, padding: "5px 8px", boxSizing: "border-box", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "inherit", direction: "rtl" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>כיתוב אחרי</div>
            <input
              value={card.afterLabel}
              onChange={e => onUpdate({ ...card, afterLabel: e.target.value })}
              style={{ width: "100%", fontSize: 13, padding: "5px 8px", boxSizing: "border-box", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "inherit", direction: "rtl" }}
            />
          </div>
        </div>

        {/* כפתור תרומה */}
        <button style={{
          width: "100%", padding: "11px 0", borderRadius: "var(--border-radius-md)",
          background: "#0F6E56", border: "none", color: "#fff",
          fontSize: 15, fontWeight: 500, cursor: "pointer",
          letterSpacing: "0.01em", transition: "opacity 0.2s",
          fontFamily: "inherit",
        }}
          onMouseEnter={e => e.target.style.opacity = "0.85"}
          onMouseLeave={e => e.target.style.opacity = "1"}
        >
          תרום עכשיו ✦
        </button>
      </div>
    </div>
  );
}

function EditableField({ value, onChange, style, prefix }) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <input
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      style={{ ...style, border: "none", borderBottom: "1px solid var(--color-border-secondary)", background: "transparent", outline: "none", fontFamily: "inherit", direction: "rtl", minWidth: 60 }}
    />
  ) : (
    <span onClick={() => setEditing(true)} title="לחץ לעריכה" style={{ ...style, cursor: "text", borderBottom: "1px dashed var(--color-border-tertiary)" }}>
      {prefix}{value}
    </span>
  );
}

function EditableTextarea({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <textarea
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      rows={3}
      style={{ width: "100%", fontSize: 14, lineHeight: 1.6, color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: "6px 10px", background: "var(--color-background-secondary)", fontFamily: "inherit", direction: "rtl", resize: "none", boxSizing: "border-box", outline: "none" }}
    />
  ) : (
    <p
      onClick={() => setEditing(true)}
      title="לחץ לעריכה"
      style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: 0, cursor: "text", borderBottom: "1px dashed var(--color-border-tertiary)" }}
    >
      {value}
    </p>
  );
}

export default function Capp() {
  const [card, setCard] = useState(defaultCard);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "var(--color-background-tertiary)", direction: "rtl" }}>
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 6px", color: "var(--color-text-primary)" }}>כרטיס תרומת ריהוט</h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>רחף על התמונה לראות לפני ואחרי · לחץ על טקסט לעריכה</p>
      </div>
      <DonationCard card={card} onUpdate={setCard} />
    </div>
  );
}