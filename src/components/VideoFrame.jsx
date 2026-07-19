import React from "react";
import { PlayCircle } from "lucide-react";

export default function VideoFrame({ url, title = "Video thuyết minh" }) {
  const embedUrl = normalizeYoutube(url);
  if (!embedUrl) {
    return (
      <div className="videoPlaceholder">
        <PlayCircle size={26} />
        <span>Chưa cấu hình video thuyết minh</span>
      </div>
    );
  }

  return (
    <iframe
      className="videoFrame"
      src={embedUrl}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function normalizeYoutube(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.searchParams.get("v")) return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    if (parsed.pathname.includes("/embed/")) return url;
  } catch {
    return "";
  }
  return "";
}
