import { Phone, MessageCircle, Mail } from "lucide-react";
import { InstagramGlyph } from "../common/icons";
import { emailLink, instagramLink, phoneLink, whatsappLink } from "../../utils/format";

function Action({ href, icon: Icon, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-pitch-600/70 bg-pitch-850 py-3 text-ink-200 transition-colors hover:border-gold-500/40 active:bg-pitch-800"
    >
      <Icon size={20} strokeWidth={1.75} className="text-gold-400" />
      <span className="text-xs font-medium">{label}</span>
    </a>
  );
}

export default function QuickActions({ phone, whatsapp, email, instagram }) {
  const actions = [
    { href: phoneLink(phone), icon: Phone, label: "Llamar" },
    { href: whatsappLink(whatsapp), icon: MessageCircle, label: "WhatsApp" },
    { href: emailLink(email), icon: Mail, label: "Email" },
    { href: instagramLink(instagram), icon: InstagramGlyph, label: "Instagram" },
  ].filter((a) => a.href);

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2">
      {actions.map((a) => (
        <Action key={a.label} {...a} />
      ))}
    </div>
  );
}
