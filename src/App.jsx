import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

/* === 커서 PNG: 번들 URL 우선 === */
import cursorPng from "./assets/cursor.png";

/* === 커서 PNG 후보/옵션 ========================= */
export const CURSOR_PNG_CANDIDATES = [
  cursorPng,
  new URL("./assets/cursor.png", import.meta.url).href,
  "/cursor.png",
  "/assets/cursor.png",
  "/images/cursor.png",
];
export const CURSOR_HOTSPOT_X = 8;
export const CURSOR_HOTSPOT_Y = 8;
export const MAX_CURSOR_SIZE  = 64;
/* ================================================ */

/* posters 폴더 자동 로드 (정적 이미지) */
const posterModules = import.meta.glob("./assets/posters/*.{jpg,jpeg,png}", {
  eager: true,
  as: "url",
});

/* 무빙 포스터 자동 로드 (m1.mp4 ~ m5.mp4) */
const movingModules = import.meta.glob("./assets/m*.mp4", {
  eager: true,
  as: "url",
});

/* 하단 일러스트 */
import starlightIllustration from "./assets/별빛일러스트.jpg";

/* ✅ 키링 스트립 */
import keyringStrip from "./assets/키링.png";

/* 오버레이 PNG */
import k1 from "./assets/k1.png";
import k2 from "./assets/k2.png";
import k3 from "./assets/k3.png";
import k4 from "./assets/k4.png";
import k5 from "./assets/k5.png";

/* ✅ 푸터 이미지 */
import footerImg from "./assets/footer.png";

/* ✅ e1 말풍선(팝업) 이미지 — 안전한 import + 폴백 */
import e1Import from "./assets/e1.png";
const E1_FALLBACKS = [
  e1Import,
  new URL("./assets/e1.png", import.meta.url).href,
  "/assets/e1.png",
  "/e1.png",
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

  /* === 커서 PNG 적용 (보강) ========================================= */
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
      if (i >= CURSOR_PNG_CANDIDATES.length) {
        const root = document.documentElement;
        root.style.removeProperty("--app-cursor");
        root.style.removeProperty("--app-cursor-link");
        const styleEl = document.getElementById("runtime-cursor-style");
        if (styleEl) styleEl.remove();
        return;
      }
      const url = CURSOR_PNG_CANDIDATES[i];
      const img = new Image();
      img.onload = () => {
        if (canceled) return;

        const maxSide = Math.max(img.width, img.height);
        const scale = maxSide > MAX_CURSOR_SIZE ? (MAX_CURSOR_SIZE / maxSide) : 1;

        let finalUrl = url;
        let hx = Math.round(CURSOR_HOTSPOT_X * scale);
        let hy = Math.round(CURSOR_HOTSPOT_Y * scale);

        if (scale < 1) {
          const canvas = document.createElement("canvas");
          canvas.width  = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            finalUrl = canvas.toDataURL("image/png");
          } catch {
            finalUrl = url;
            hx = CURSOR_HOTSPOT_X;
            hy = CURSOR_HOTSPOT_Y;
          }
        }

        applyBoth(finalUrl, hx, hy);
      };
      img.onerror = () => tryLoad(i + 1);
      img.src = url;
    };

    tryLoad();
    return () => { canceled = true; };
  }, []);
  /* ================================================================= */

  /* === 정적 포스터 로드 === */
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
  const allForViewer = useMemo(() => [...firstFive, ...rest], [firstFive, rest]);

  /* === 무빙 포스터 로드 === */
  const movingPosters = useMemo(() => {
    const arr = Object.entries(movingModules)
      .map(([path, url]) => {
        const file = path.split("/").pop() || "";
        const name = file.replace(/\.mp4$/i, "");
        return { url, name };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
    return arr.slice(0, 5);
  }, []);

  /* === 이미지 뷰어 === */
  const [open, setOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = useCallback((globalIndex) => {
    setViewerIndex(globalIndex);
    setOpen(true);
  }, []);
  const closeViewer = useCallback(() => setOpen(false), []);
  const prev = useCallback(
    () => setViewerIndex((i) => (i - 1 + allForViewer.length) % allForViewer.length),
    [allForViewer.length]
  );
  const next = useCallback(
    () => setViewerIndex((i) => (i + 1) % allForViewer.length),
    [allForViewer.length]
  );

  /* === 비디오 뷰어 === */
  const [vOpen, setVOpen] = useState(false);
  const [vIndex, setVIndex] = useState(0);

  const openVideoViewer = useCallback((idx) => {
    setVIndex(idx);
    setVOpen(true);
  }, []);
  const closeVideoViewer = useCallback(() => setVOpen(false), []);
  const vPrev = useCallback(
    () => setVIndex((i) => (i - 1 + movingPosters.length) % movingPosters.length),
    [movingPosters.length]
  );
  const vNext = useCallback(
    () => setVIndex((i) => (i + 1) % movingPosters.length),
    [movingPosters.length]
  );

  useEffect(() => {
    document.body.classList.toggle("no-scroll", open || vOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [open, vOpen]);

  useEffect(() => {
    if (!open && !vOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (open) closeViewer();
        if (vOpen) closeVideoViewer();
      } else if (e.key === "ArrowLeft") {
        if (open) prev();
        if (vOpen) vPrev();
      } else if (e.key === "ArrowRight") {
        if (open) next();
        if (vOpen) vNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, vOpen, closeViewer, closeVideoViewer, prev, next, vPrev, vNext]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  /* === PNG 오버레이 === */
  const overlayImages = [
    { src: k1, top: "58%",  left: "61%",  width: "20%" },
    { src: k2, top: "52%",  left: "45.5%", width: "23%" },
    { src: k3, top: "20.2%",left: "32.5%", width: "14%" },
    { src: k4, top: "65%",  left: "15%",  width: "20%" },
    { src: k5, top: "27%",  left: "88.5%", width: "20%" }, // ← k5 (index = 4)
  ];

  /* === 이중 축 진자 물리 === */
  const [angles1, setAngles1] = useState(new Array(overlayImages.length).fill(0));
  const v1 = useRef(new Array(overlayImages.length).fill(0));
  const [angles2, setAngles2] = useState(new Array(overlayImages.length).fill(0));
  const v2 = useRef(new Array(overlayImages.length).fill(0));

  const DAMPING1 = 0.992;
  const STIFFNESS1 = 0.0025;
  const MAX_ANGLE1 = 28;

  const DAMPING2 = 0.985;
  const STIFFNESS2 = 0.004;
  const MAX_ANGLE2 = 22;

  const COUPLE12 = 0.003;
  const COUPLE21 = 0.001;

  const rafRef = useRef(null);
  useEffect(() => {
    const animate = () => {
      setAngles1((prev1) => {
        const next1 = [...prev1];
        setAngles2((prev2) => {
          const next2 = [...prev2];

          for (let i = 0; i < next1.length; i++) {
            // 1차
            let w1 = v1.current[i];
            let a1 = next1[i];
            w1 -= a1 * STIFFNESS1;
            w1 += next2[i] * COUPLE21;
            w1 *= DAMPING1;
            a1 += w1;
            if (a1 > MAX_ANGLE1) { a1 = MAX_ANGLE1; w1 = -Math.abs(w1) * 0.45; }
            if (a1 < -MAX_ANGLE1){ a1 = -MAX_ANGLE1; w1 =  Math.abs(w1) * 0.45; }
            v1.current[i] = w1;
            next1[i] = a1;

            // 2차
            let w2v = v2.current[i];
            let a2 = next2[i];
            w2v -= a2 * STIFFNESS2;
            w2v += a1 * COUPLE12;
            w2v *= DAMPING2;
            a2 += w2v;
            if (a2 > MAX_ANGLE2) { a2 = MAX_ANGLE2; w2v = -Math.abs(w2v) * 0.45; }
            if (a2 < -MAX_ANGLE2){ a2 = -MAX_ANGLE2; w2v =  Math.abs(w2v) * 0.45; }
            v2.current[i] = w2v;
            next2[i] = a2;
          }
          return next2;
        });
        return next1;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* === e1(말풍선) 안전 로드 + 팝업 상태 === */
  const [e1Url, setE1Url] = useState("");
  const [e1Loaded, setE1Loaded] = useState(false);

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
    return () => { alive = false; };
  }, []);

  const [showE1, setShowE1] = useState(false);
  const hideTimerRef = useRef(null);
  const [e1Pos, setE1Pos]   = useState({ x: 0, y: 0 });

  // hover 중력 주입 + k5 근처일 때 e1 팝업
  const handleHover = (e, i) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const bottomY = rect.top + rect.height;
    const midY    = (centerY + bottomY) / 2;
    const radius  = rect.height * 0.25;

    const dx = e.clientX - centerX;
    const dy = e.clientY - midY;
    const distance = Math.hypot(dx, dy);

    if (distance < radius) {
      const direction = dx > 0 ? 1 : -1;
      const strength  = (radius - distance) / radius;
      v1.current[i] += direction * strength * 0.65;
      v2.current[i] += direction * strength * 0.35;
      if (typeof e.movementY === "number") {
        v2.current[i] += (e.movementY / rect.height) * 0.6;
      }

      // ✅ k5(index=4)인 경우: e1 팝업 표시 + 위치 업데이트
      if (i === 4 && e1Loaded) {
        setE1Pos({
          x: rect.left + window.scrollX - rect.width * 0.28,
          y: rect.top  + window.scrollY - rect.height * 0.18,
        });
        setShowE1(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowE1(false), 1200);
      }
    }
  };

  const SEAM = 0.30;

  /* 캡션 타이틀 */
  const posterTitles = useMemo(
    () => ["패턴 포스터 (타마)", "패턴 포스터 (마크)", "패턴 포스터 (노바)", "패턴 포스터 (삐상)", "패턴 포스터 (따옥)"],
    []
  );
  const movingTitles = useMemo(
    () => ["무빙 포스터 (타마)", "무빙 포스터 (마크)", "무빙 포스터 (노바)", "무빙 포스터 (따옥)", "무빙 포스터 (삐상)"],
    []
  );

  // ✅ 뷰어(전체 화면) 캡션 전용 타이틀
  const viewerTitles = useMemo(
    () => [
      "패턴 포스터 (타마)",
      "패턴 포스터 (마크)",
      "패턴 포스터 (노바)",
      "패턴 포스터 (따옥)",
      "패턴 포스터 (삐상)",
    ],
    []
  );

  const captionStyle = {
    fontFamily:
      '"Hakgyoansim Monggeulmonggeul", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    letterSpacing: "0.2px",
    fontSize: "14px",
    lineHeight: 1.2,
  };

  return (
    <div className="page-1920">
      <p className="page-sub"></p>

      {/* ===== 무빙 포스터(비디오) 섹션 — 위쪽에 배치 ===== */}
      {movingPosters.length > 0 && (
        <>
          {/* ✅ moving-title 클래스 추가 */}
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
                    title="클릭하면 전체 화면으로 보기"
                  >
                    <video
                      src={url}
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="metadata"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </button>
                </div>

                <div className="moving-caption">
                  <figcaption className="poster-caption" style={captionStyle}>
                    {movingTitles[i] ?? `무빙 포스터 ${i + 1}`}
                  </figcaption>
                </div>
              </figure>
            ))}
          </section>
        </>
      )}

      {/* ✅ 키링 스트립 */}
      <section className="keyring-divider">
        <img src={keyringStrip} alt="keyring strip" className="keyring-img" />
      </section>

      {/* ===== 별빛 일러스트 + 오버레이 ===== */}
      <section
        className="starlight-illustration"
        style={{ position: "relative", width: "100%", overflow: "visible", perspective: "800px" }}
      >
        <img
          src={starlightIllustration}
          alt="starlight illustration"
          style={{ width: "100%", height: "auto", display: "block" }}
        />

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
              willChange: "transform",
              pointerEvents: "auto",
            }}
          >
            {/* TOP PART */}
            <img
              src={src}
              alt={`overlay-top-${i + 1}`}
              style={{
                width: "100%",
                display: "block",
                clipPath: `inset(0 0 ${100 - SEAM * 100}% 0)`,
                WebkitClipPath: `inset(0 0 ${100 - SEAM * 100}% 0)`,
                pointerEvents: "none",
                willChange: "transform",
              }}
            />

            {/* BOTTOM PART */}
            <img
              src={src}
              alt={`overlay-bottom-${i + 1}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                display: "block",
                clipPath: `inset(${SEAM * 100}% 0 0 0)`,
                WebkitClipPath: `inset(${SEAM * 100}% 0 0 0)`,
                transformOrigin: `50% ${SEAM * 100}%`,
                transform: `rotate(${angles2[i]}deg)`,
                pointerEvents: "none",
                willChange: "transform",
              }}
            />
          </div>
        ))}

        {/* ✅ e1 팝업 (k5 근처) */}
        {e1Loaded && (
          <img
            src={e1Url}
            alt="e1 bubble"
            style={{
              position: "absolute",
              left: `${e1Pos.x}px`,
              top:  `${e1Pos.y}px`,
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

      {/* ===== Pattern Posters 섹션 — 아래쪽에 배치 ===== */}
      <h2 className="section-title pattern-title">Pattern Posters</h2>

      {/* 패턴 포스터 섹션 (처음 5개) */}
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
                <img src={url} alt={`poster-${i + 1}`} loading="lazy" />
              </button>
            </div>
            <div className="pattern-caption">
              <figcaption className="poster-caption" style={captionStyle}>
                {posterTitles[i] ?? `패턴 포스터 ${i + 1}`}
              </figcaption>
            </div>
          </figure>
        ))}
      </section>

      {/* 나머지 포스터 */}
      {rest.length > 0 && (
        <section className="poster-container">
          {rest.map(({ url, name }, i) => {
            const globalIndex = firstFive.length + i;
            return (
              <figure key={url} className="pattern-item">
                <div className="pattern-media">
                  <button
                    className="poster-card"
                    onClick={() => openViewer(globalIndex)}
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
                  <figcaption className="poster-caption">{name}</figcaption>
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

            {/* ✅ 'Viewing' 배지(이미지용) */}
            <div className="viewer-badge">Viewing</div>

            {/* 상단바(풀스크린/닫기만 유지) */}
            <div className="viewer-topbar">
              <div className="viewer-spacer" />
              <button className="viewer-btn" onClick={toggleFullscreen}>Full screen</button>
              <button className="viewer-btn" onClick={closeViewer}>Close</button>
            </div>

            {allForViewer.length > 1 && (
              <>
                <button className="viewer-nav prev" onClick={prev} aria-label="previous">
                  &lsaquo;
                </button>
                <button className="viewer-nav next" onClick={next} aria-label="next">
                  &rsaquo;
                </button>
              </>
            )}

            {/* 캡션 */}
            <div className="viewer-caption">
              {viewerTitles[viewerIndex] ?? allForViewer[viewerIndex].name ?? `#${viewerIndex + 1}`}
            </div>
          </>
        )}
      </div>

      {/* ===== 무빙 포스터(비디오) 뷰어 ===== */}
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

            {/* ✅ 'Viewing video' 배지(비디오용) */}
            <div className="viewer-badge">Viewing video</div>

            <div className="viewer-topbar">
              <div className="viewer-spacer" />
              <button className="viewer-btn" onClick={toggleFullscreen}>Full screen</button>
              <button className="viewer-btn" onClick={closeVideoViewer}>Close</button>
            </div>

            {movingPosters.length > 1 && (
              <>
                <button className="viewer-nav prev" onClick={vPrev} aria-label="previous video">
                  &lsaquo;
                </button>
                <button className="viewer-nav next" onClick={vNext} aria-label="next video">
                  &rsaquo;
                </button>
              </>
            )}

            <div className="viewer-caption">
              {movingTitles[vIndex] || movingPosters[vIndex].name}
            </div>
          </>
        )}
      </div>

      {/* ====================== FULL-BLEED FOOTER ====================== */}
      <footer className="site-footer">
        <div className="footer-full">
          <img src={footerImg} alt="footer artwork" className="footer-img" />
        </div>
        <div className="footer-meta">© TammaDuo — Endangered Friends, Beautiful Memories</div>
      </footer>
    </div>
  );
}
