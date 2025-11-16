import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

/* === 커서 PNG: import 기본 === */
import cursorPng from "./assets/cursor.png";

/* === 커서 PNG 후보 (GitHub Pages에서도 깨지지 않음) === */
export const CURSOR_PNG_CANDIDATES = [
  cursorPng,
  new URL("./assets/cursor.png", import.meta.url).href,
];

export const CURSOR_HOTSPOT_X = 8;
export const CURSOR_HOTSPOT_Y = 8;
export const MAX_CURSOR_SIZE = 64;

/* === posters 자동 로드 === */
const posterModules = import.meta.glob("./assets/posters/*.{jpg,jpeg,png}", {
  eager: true,
  as: "url",
});

/* === 무빙 포스터(m1~m5) 자동 로드 === */
const movingModules = import.meta.glob("./assets/m*.mp4", {
  eager: true,
  as: "url",
});

/* === 정적 이미지 import === */
import starlightIllustration from "./assets/별빛일러스트.jpg";
import keyringStrip from "./assets/키링.png";

/* === 오버레이 PNG === */
import k1 from "./assets/k1.png";
import k2 from "./assets/k2.png";
import k3 from "./assets/k3.png";
import k4 from "./assets/k4.png";
import k5 from "./assets/k5.png";

/* === footer === */
import footerImg from "./assets/footer.png";

/* === e1 말풍선: 안전한 import + fallback (절대 404 안 뜸) === */
import e1Import from "./assets/e1.png";
const E1_FALLBACKS = [
  e1Import,
  new URL("./assets/e1.png", import.meta.url).href,
];

export default function App() {
  /* 폰트 로드 */
  useEffect(() => {
    const id = "hakgyoansim-monggeul-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Hakgyoansim+Monggeulmonggeul&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  /* === 커서 적용 === */
  useEffect(() => {
    let canceled = false;

    const applyBoth = (finalUrl, hx, hy) => {
      const root = document.documentElement;
      root.style.setProperty("--app-cursor", `url("${finalUrl}") ${hx} ${hy}, auto`);
      root.style.setProperty("--app-cursor-link", `url("${finalUrl}") ${hx} ${hy}, pointer`);

      const styleId = "runtime-cursor-style";
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        html, body, * { cursor: url("${finalUrl}") ${hx} ${hy}, auto !important; }
        a, button       { cursor: url("${finalUrl}") ${hx} ${hy}, pointer !important; }
      `;
    };

    const tryLoad = (i = 0) => {
      if (i >= CURSOR_PNG_CANDIDATES.length) return;

      const url = CURSOR_PNG_CANDIDATES[i];
      const img = new Image();

      img.onload = () => {
        if (canceled) return;

        let finalUrl = url;
        const maxSide = Math.max(img.width, img.height);
        const scale = maxSide > MAX_CURSOR_SIZE ? MAX_CURSOR_SIZE / maxSide : 1;

        let hx = Math.round(CURSOR_HOTSPOT_X * scale);
        let hy = Math.round(CURSOR_HOTSPOT_Y * scale);

        if (scale < 1) {
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            finalUrl = canvas.toDataURL("image/png");
          } catch {
            finalUrl = url;
          }
        }

        applyBoth(finalUrl, hx, hy);
      };

      img.onerror = () => tryLoad(i + 1);
      img.src = url;
    };

    tryLoad();
    return () => (canceled = true);
  }, []);

  /* === 포스터 정렬 === */
  const posters = useMemo(() => {
    return Object.entries(posterModules)
      .map(([path, url]) => {
        const file = path.split("/").pop() || "";
        const name = file.replace(/\.(jpg|jpeg|png)$/i, "");
        return { url, name };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  }, []);

  const firstFive = posters.slice(0, 5);
  const rest = posters.slice(5);
  const allForViewer = [...firstFive, ...rest];

  /* === 무빙 포스터 === */
  const movingPosters = useMemo(() => {
    const arr = Object.entries(movingModules)
      .map(([path, url]) => {
        const file = path.split("/").pop() || "";
        const name = file.replace(/\.mp4$/, "");
        return { url, name };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
    return arr.slice(0, 5);
  }, []);

  /* === 이미지 뷰어 === */
  const [open, setOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (i) => {
    setViewerIndex(i);
    setOpen(true);
  };
  const closeViewer = () => setOpen(false);

  const prev = () =>
    setViewerIndex((i) => (i - 1 + allForViewer.length) % allForViewer.length);

  const next = () =>
    setViewerIndex((i) => (i + 1) % allForViewer.length);

  /* === 비디오 뷰어 === */
  const [vOpen, setVOpen] = useState(false);
  const [vIndex, setVIndex] = useState(0);

  const openVideoViewer = (i) => {
    setVIndex(i);
    setVOpen(true);
  };
  const closeVideoViewer = () => setVOpen(false);

  const vPrev = () =>
    setVIndex((i) => (i - 1 + movingPosters.length) % movingPosters.length);

  const vNext = () =>
    setVIndex((i) => (i + 1) % movingPosters.length);

  /* === 뷰어 강제 스크롤 방지 === */
  useEffect(() => {
    document.body.classList.toggle("no-scroll", open || vOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [open, vOpen]);

  /* === ESC & 방향키 === */
  useEffect(() => {
    if (!open && !vOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        if (open) closeViewer();
        if (vOpen) closeVideoViewer();
      }
      if (e.key === "ArrowLeft") {
        if (open) prev();
        if (vOpen) vPrev();
      }
      if (e.key === "ArrowRight") {
        if (open) next();
        if (vOpen) vNext();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, vOpen]);

  /* === 전체 화면 === */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement)
        await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  /* === PNG 오버레이 === */
  const overlayImages = [
    { src: k1, top: "58%", left: "61%", width: "20%" },
    { src: k2, top: "52%", left: "45.5%", width: "23%" },
    { src: k3, top: "20.2%", left: "32.5%", width: "14%" },
    { src: k4, top: "65%", left: "15%", width: "20%" },
    { src: k5, top: "27%", left: "88.5%", width: "20%" },
  ];

  /* === 오버레이 물리 시뮬 === */
  const [angles1, setAngles1] = useState(new Array(overlayImages.length).fill(0));
  const [angles2, setAngles2] = useState(new Array(overlayImages.length).fill(0));
  const v1 = useRef(new Array(overlayImages.length).fill(0));
  const v2 = useRef(new Array(overlayImages.length).fill(0));

  const SEAM = 0.30;

  useEffect(() => {
    const DAMPING1 = 0.992;
    const STIFFNESS1 = 0.0025;
    const MAX_ANGLE1 = 28;

    const DAMPING2 = 0.985;
    const STIFFNESS2 = 0.004;
    const MAX_ANGLE2 = 22;

    const COUPLE12 = 0.003;
    const COUPLE21 = 0.001;

    const animate = () => {
      setAngles1((prev1) => {
        const next1 = [...prev1];

        setAngles2((prev2) => {
          const next2 = [...prev2];

          for (let i = 0; i < next1.length; i++) {
            let w1 = v1.current[i];
            let a1 = next1[i];

            w1 -= a1 * STIFFNESS1;
            w1 += next2[i] * COUPLE21;
            w1 *= DAMPING1;
            a1 += w1;

            if (a1 > MAX_ANGLE1) {
              a1 = MAX_ANGLE1;
              w1 = -Math.abs(w1) * 0.45;
            } else if (a1 < -MAX_ANGLE1) {
              a1 = -MAX_ANGLE1;
              w1 = Math.abs(w1) * 0.45;
            }

            v1.current[i] = w1;
            next1[i] = a1;

            let w2 = v2.current[i];
            let a2 = next2[i];

            w2 -= a2 * STIFFNESS2;
            w2 += a1 * COUPLE12;
            w2 *= DAMPING2;
            a2 += w2;

            if (a2 > MAX_ANGLE2) {
              a2 = MAX_ANGLE2;
              w2 = -Math.abs(w2) * 0.45;
            } else if (a2 < -MAX_ANGLE2) {
              a2 = -MAX_ANGLE2;
              w2 = Math.abs(w2) * 0.45;
            }

            v2.current[i] = w2;
            next2[i] = a2;
          }

          return next2;
        });

        return next1;
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  /* === e1 말풍선 === */
  const [e1Url, setE1Url] = useState("");
  const [e1Loaded, setE1Loaded] = useState(false);
  const [showE1, setShowE1] = useState(false);
  const [e1Pos, setE1Pos] = useState({ x: 0, y: 0 });
  const hideTimerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const tryOne = (idx = 0) => {
      if (!alive) return;
      if (idx >= E1_FALLBACKS.length) return;

      const url = E1_FALLBACKS[idx];
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        setE1Url(url);
        setE1Loaded(true);
      };
      img.onerror = () => tryOne(idx + 1);
      img.src = url;
    };

    tryOne();
    return () => (alive = false);
  }, []);

  const handleHover = (e, i) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const bottomY = rect.top + rect.height;
    const midY = (centerY + bottomY) / 2;
    const radius = rect.height * 0.25;

    const dx = e.clientX - centerX;
    const dy = e.clientY - midY;
    const dist = Math.hypot(dx, dy);

    if (dist < radius) {
      const direction = dx > 0 ? 1 : -1;
      const strength = (radius - dist) / radius;

      v1.current[i] += direction * strength * 0.65;
      v2.current[i] += direction * strength * 0.35;

      if (typeof e.movementY === "number") {
        v2.current[i] += (e.movementY / rect.height) * 0.6;
      }

      if (i === 4 && e1Loaded) {
        setE1Pos({
          x: rect.left + window.scrollX - rect.width * 0.28,
          y: rect.top + window.scrollY - rect.height * 0.18,
        });
        setShowE1(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowE1(false), 1200);
      }
    }
  };

  const captionStyle = {
    fontFamily:
      '"Hakgyoansim Monggeulmonggeul", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    letterSpacing: "0.2px",
    fontSize: "14px",
    lineHeight: 1.2,
  };

  /* === 캐릭터 타이틀 === */
  const posterTitles = [
    "패턴 포스터 (타마)",
    "패턴 포스터 (마크)",
    "패턴 포스터 (노바)",
    "패턴 포스터 (삐상)",
    "패턴 포스터 (따옥)",
  ];

  const movingTitles = [
    "무빙 포스터 (타마)",
    "무빙 포스터 (마크)",
    "무빙 포스터 (노바)",
    "무빙 포스터 (따옥)",
    "무빙 포스터 (삐상)",
  ];

  const viewerTitles = posterTitles;

  /* =============================================
   * ============   RETURN (UI)   ================
   * ============================================= */

  return (
    <div className="page-1920">
      {/* ===== Moving Posters ===== */}
      {movingPosters.length > 0 && (
        <>
          <h2 className="section-title moving-title">Moving Posters</h2>

          <section className="moving-grid">
            {movingPosters.map(({ url }, i) => (
              <figure key={url} className="moving-item">
                <div className="moving-media">
                  <button
                    className="poster-card"
                    onClick={() => openVideoViewer(i)}
                    style={{
                      appearance: "none",
                      border: "none",
                      padding: 0,
                      background: "transparent",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <video
                      src={url}
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="metadata"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </button>
                </div>

                <div className="moving-caption">
                  <figcaption className="poster-caption" style={captionStyle}>
                    {movingTitles[i]}
                  </figcaption>
                </div>
              </figure>
            ))}
          </section>
        </>
      )}

      {/* ===== Keyring Strip ===== */}
      <section className="keyring-divider">
        <img src={keyringStrip} alt="keyring strip" className="keyring-img" />
      </section>

      {/* ===== Starlight + Overlays ===== */}
      <section
        className="starlight-illustration"
        style={{
          position: "relative",
          width: "100%",
          overflow: "visible",
          perspective: "800px",
        }}
      >
        <img
          src={starlightIllustration}
          alt="starlight illustration"
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        {/* 오버레이 */}
        {overlayImages.map(({ src, top, left, width }, i) => (
          <div
            key={i}
            onMouseMove={(e) => handleHover(e, i)}
            style={{
              position: "absolute",
              top,
              left,
              width,
              overflow: "visible",
              zIndex: 2,
              transformOrigin: "50% 0%",
              transform: `translate(-50%, -50%) rotate(${angles1[i]}deg)`,
              pointerEvents: "auto",
            }}
          >
            {/* TOP */}
            <img
              src={src}
              alt=""
              style={{
                width: "100%",
                display: "block",
                clipPath: `inset(0 0 ${100 - SEAM * 100}% 0)`,
                WebkitClipPath: `inset(0 0 ${100 - SEAM * 100}% 0)`,
                pointerEvents: "none",
              }}
            />

            {/* BOTTOM */}
            <img
              src={src}
              alt=""
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                clipPath: `inset(${SEAM * 100}% 0 0 0)`,
                WebkitClipPath: `inset(${SEAM * 100}% 0 0 0)`,
                transformOrigin: `50% ${SEAM * 100}%`,
                transform: `rotate(${angles2[i]}deg)`,
                pointerEvents: "none",
              }}
            />
          </div>
        ))}

        {/* e1 팝업 */}
        {e1Loaded && (
          <img
            src={e1Url}
            alt="e1"
            style={{
              position: "absolute",
              left: `${e1Pos.x}px`,
              top: `${e1Pos.y}px`,
              width: "240px",
              opacity: showE1 ? 1 : 0,
              transform: `translate(-10%, -30%) scale(${showE1 ? 1 : 0.9})`,
              transformOrigin: "70% 80%",
              transition: "opacity 180ms ease, transform 180ms ease",
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
        )}
      </section>

      {/* ===== Pattern Posters ===== */}
      <h2 className="section-title pattern-title">Pattern Posters</h2>

      <section className="poster-container">
        {firstFive.map(({ url }, i) => (
          <figure key={url} className="pattern-item">
            <div className="pattern-media">
              <button
                className="poster-card"
                onClick={() => openViewer(i)}
                style={{
                  appearance: "none",
                  border: "none",
                  padding: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <img src={url} alt="" loading="lazy" />
              </button>
            </div>

            <div className="pattern-caption">
              <figcaption className="poster-caption" style={captionStyle}>
                {posterTitles[i]}
              </figcaption>
            </div>
          </figure>
        ))}
      </section>

      {rest.length > 0 && (
        <section className="poster-container">
          {rest.map(({ url, name }, i) => {
            const idx = firstFive.length + i;
            return (
              <figure key={url} className="pattern-item">
                <div className="pattern-media">
                  <button
                    className="poster-card"
                    onClick={() => openViewer(idx)}
                    style={{
                      appearance: "none",
                      border: "none",
                      padding: 0,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <img src={url} alt={name} loading="lazy" />
                  </button>
                </div>

                <div className="pattern-caption">
                  <figcaption className="poster-caption" style={captionStyle}>
                    {name}
                  </figcaption>
                </div>
              </figure>
            );
          })}
        </section>
      )}

      {/* ===== 이미지 뷰어 ===== */}
      <div className={`viewer viewer--image ${open ? "open" : ""}`}>
        {open && (
          <>
            <div
              className="viewer-inner"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeViewer();
              }}
            >
              <img
                className="viewer-img"
                src={allForViewer[viewerIndex].url}
                alt={allForViewer[viewerIndex].name}
              />
            </div>

            <div className="viewer-badge">Viewing</div>

            <div className="viewer-topbar">
              <div className="viewer-spacer" />
              <button className="viewer-btn" onClick={toggleFullscreen}>
                Full screen
              </button>
              <button className="viewer-btn" onClick={closeViewer}>
                Close
              </button>
            </div>

            {allForViewer.length > 1 && (
              <>
                <button className="viewer-nav prev" onClick={prev}>
                  &lsaquo;
                </button>
                <button className="viewer-nav next" onClick={next}>
                  &rsaquo;
                </button>
              </>
            )}

            <div className="viewer-caption">
              {viewerTitles[viewerIndex]}
            </div>
          </>
        )}
      </div>

      {/* ===== 비디오 뷰어 ===== */}
      <div className={`viewer viewer--video ${vOpen ? "open" : ""}`}>
        {vOpen && (
          <>
            <div
              className="viewer-inner"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeVideoViewer();
              }}
            >
              <video
                className="viewer-img"
                src={movingPosters[vIndex].url}
                controls
                autoPlay
                playsInline
                loop
                style={{ background: "#000", maxHeight: "90vh" }}
              />
            </div>

            <div className="viewer-badge">Viewing video</div>

            <div className="viewer-topbar">
              <div className="viewer-spacer" />
              <button className="viewer-btn" onClick={toggleFullscreen}>
                Full screen
              </button>
              <button className="viewer-btn" onClick={closeVideoViewer}>
                Close
              </button>
            </div>

            {movingPosters.length > 1 && (
              <>
                <button className="viewer-nav prev" onClick={vPrev}>
                  &lsaquo;
                </button>
                <button className="viewer-nav next" onClick={vNext}>
                  &rsaquo;
                </button>
              </>
            )}

            <div className="viewer-caption">
              {movingTitles[vIndex]}
            </div>
          </>
        )}
      </div>

      {/* ===== Footer ===== */}
      <footer className="site-footer">
        <div className="footer-full">
          <img src={footerImg} alt="footer artwork" className="footer-img" />
        </div>
        <div className="footer-meta">
          © TammaDuo — Endangered Friends, Beautiful Memories
        </div>
      </footer>
    </div>
  );
}
