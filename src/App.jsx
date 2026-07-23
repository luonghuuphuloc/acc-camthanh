import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal, flushSync } from "react-dom";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Edit3,
  LocateFixed,
  Lock,
  MapPin,
  Minus,
  Move,
  Navigation,
  Plus,
  RotateCcw,
  Save,
  Search,
  Star,
  X,
} from "lucide-react";
import HeritageDetailPage from "./HeritageDetailPage";
import CamThanhMap from "./components/CamThanhMap";
import VideoFrame from "./components/VideoFrame";
import { heritageSites, heritageSitesByRoute } from "./heritageSites";
import "./styles.css";

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:5174" : "");
const BOOT_TIMEOUT_MS = 12000;
const HOME_VIDEO_URL = "https://youtu.be/BlluoKb81bQ";

function App() {
  const [route, setRoute] = useState(initialRoute());
  const [settings, setSettings] = useState(null);
  const [graves, setGraves] = useState([]);
  const [bootError, setBootError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const selected = graves.find((grave) => grave.id === selectedId);

  useScrollReveal(route, Boolean(settings));

  function navigate(nextRoute, pathname) {
    const update = () => {
      history.pushState(null, "", pathname);
      flushSync(() => setRoute(nextRoute));
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(update);
    else update();
  }

  useEffect(() => {
    const syncRoute = () => {
      setRoute(initialRoute());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route]);

  useEffect(() => {
    let ignore = false;

    async function boot() {
      setBootError("");
      try {
        const [nextSettings, nextGraves] = await Promise.all([
          fetchJson("/api/settings", { timeoutMs: BOOT_TIMEOUT_MS }),
          fetchJson("/api/graves", { timeoutMs: BOOT_TIMEOUT_MS }),
        ]);
        if (ignore) return;
        setSettings(nextSettings);
        setGraves(nextGraves);
        const deepId = new URLSearchParams(location.search).get("tomb_id") || location.hash.replace("#mo=", "");
        if (deepId && nextGraves.some((grave) => grave.id === deepId)) setSelectedId(deepId);
      } catch (error) {
        if (!ignore) setBootError(error.message || "Không tải được dữ liệu.");
      }
    }

    boot();
    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    const identified = graves.filter((grave) => !fold(grave.ten || "").startsWith("chua xac dinh")).length;
    const special = graves.filter((grave) => grave.type === "special").length;
    return { total: graves.length, identified, special };
  }, [graves]);

  if (!settings) {
    return (
      <div className="boot">
        <div className="bootBox">
          <p>{bootError ? "Không tải được dữ liệu" : "Đang khởi động dữ liệu..."}</p>
          {bootError && (
            <>
              <small>Vui lòng kiểm tra kết nối mạng rồi tải lại trang.</small>
              <button onClick={() => location.reload()}>Thử lại</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className={`routeView route-${route}`} key={route}>
      {route === "admin" ? (
        <AdminPage
          settings={settings}
          setSettings={setSettings}
          graves={graves}
          setGraves={setGraves}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onPublic={() => navigate("cemetery", "/nghia-trang")}
        />
      ) : route === "home" ? (
        <HomePage
          settings={settings}
          onCemetery={() => navigate("cemetery", "/nghia-trang")}
          onHeritage={(site) => navigate(site.route, site.path)}
        />
      ) : heritageSitesByRoute[route] ? (
        <HeritageDetailPage
          site={heritageSitesByRoute[route]}
          onHome={() => navigate("home", "/")}
          footer={<SiteFooter settings={settings} />}
        />
      ) : (
        <CemeteryPage
          settings={settings}
          graves={graves}
          selected={selected}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          query={query}
          setQuery={setQuery}
          stats={stats}
          onHome={() => navigate("home", "/")}
        />
      )}
      </div>
    </div>
  );
}

function useScrollReveal(route, ready) {
  useEffect(() => {
    if (!ready) return undefined;
    const nodes = [...document.querySelectorAll("[data-reveal]")];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("revealVisible"));
      return undefined;
    }

    document.documentElement.classList.add("motion-ready");
    nodes.forEach((node) => node.classList.add("revealItem"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealVisible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7%" });
    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, [route, ready]);
}

function initialRoute() {
  if (location.pathname.startsWith("/admin")) return "admin";
  if (location.pathname.startsWith("/nghia-trang")) return "cemetery";
  const heritageSite = heritageSites.find((site) => location.pathname.startsWith(site.path));
  if (heritageSite) return heritageSite.route;
  return "home";
}

const heritagePlaces = [
  {
    id: "nghia-trang-thien-but",
    name: "Nghĩa trang Liệt sĩ Thiên Bút",
    address: "Phường Cẩm Thành, Quảng Ngãi",
    category: "heritage",
    lat: 15.106445,
    lng: 108.8124696,
    to: 12,
    image: "/cemetery-tower-thumbnail.png",
    route: "cemetery",
  },
  ...heritageSites.map((site) => ({
    id: site.slug,
    name: site.title,
    address: site.address,
    category: "heritage",
    lat: site.lat,
    lng: site.lng,
    to: site.to,
    image: site.heroImage,
    site,
  })),
];

function HomePage({ settings, onCemetery, onHeritage }) {
  const [activeId, setActiveId] = useState(null);
  const activePlace = heritagePlaces.find((place) => place.id === activeId);
  const mapRef = useRef(null);

  function openPlace(place) {
    if (place.route === "cemetery") onCemetery();
    else onHeritage(place.site);
  }

  return (
    <>
      <header className="travelHero">
        <div className="heroImage">
          <img
            src="/homepage-sunset-heritage.png"
            alt="Ba địa điểm di sản lịch sử và văn hoá phường Cẩm Thành trong ánh hoàng hôn"
          />
          <div className="heroLogo" aria-label="Logo Tuổi trẻ Cẩm Thành">
            <img src="/cam-thanh-logo.png" alt="Tuổi trẻ Cẩm Thành" />
          </div>
          <div className="heroOverlay">
            <p>Di sản và địa phương</p>
            <h1>KHÁM PHÁ DI SẢN LỊCH SỬ & VĂN HOÁ PHƯỜNG CẨM THÀNH</h1>
            <span>{settings.heritageIntro}</span>
            <div className="heroActions">
              <button
                className="heroSecondary"
                onClick={() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <MapPin size={18} /> Khám phá bản đồ di sản
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="homePage">
        <section className="homeVideoSection" aria-label="Video giới thiệu di sản Cẩm Thành" data-reveal>
          <VideoFrame url={HOME_VIDEO_URL} title="Video giới thiệu di sản Cẩm Thành" />
        </section>

        <section className="heritageMapShell" ref={mapRef} data-reveal>
          <div className="heritageMapFrame">
            <CamThanhMap
              places={heritagePlaces}
              activeId={activeId}
              onSelect={setActiveId}
              onOpen={(id) => {
                const place = heritagePlaces.find((item) => item.id === id);
                if (place) openPlace(place);
              }}
            />
            <div className="mapCaption">
              <MapPin size={16} />
              <span>
                Ranh giới phường Cẩm Thành và 15 tổ dân phố. Ba điểm di sản được đánh dấu theo tọa độ thực tế.
                {activePlace ? ` Đang chọn: ${activePlace.name} (Tổ ${activePlace.to}).` : ""}
              </span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Ph%C6%B0%E1%BB%9Dng%20C%E1%BA%A9m%20Th%C3%A0nh%2C%20Qu%E1%BA%A3ng%20Ng%C3%A3i"
                target="_blank"
                rel="noreferrer"
              >
                Mở toàn màn hình
              </a>
            </div>
          </div>

          <div className="collectionHeading">
            <div>
              <p className="eyebrow">Hành trình di sản</p>
              <h2>Ba địa điểm, ba lớp ký ức của Quảng Ngãi</h2>
            </div>
            <span>Chọn một địa điểm để xem câu chuyện, ảnh tư liệu và hướng dẫn tham quan.</span>
          </div>

          <div className="placeList">
            {heritagePlaces.map((place, index) => (
              <button
                key={place.id}
                className={`placeCard ${place.category} ${activeId === place.id ? "active" : ""}`}
                onClick={() => openPlace(place)}
                data-reveal
                style={{ "--reveal-delay": `${index * 70}ms` }}
              >
                <img src={place.image} alt="" />
                <span className="placeCardBody">
                  <small className="placeCardKicker">Điểm di sản {String(index + 1).padStart(2, "0")}</small>
                  <strong>{place.name}</strong>
                  <small>{place.address}</small>
                  <span className="placeCardLink">Khám phá <ChevronRight size={17} /></span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}

function SiteFooter({ settings }) {
  const phone = settings.footerPhone?.trim();
  const showPhone = phone && !fold(phone).includes("dang cap nhat");
  const email = settings.footerEmail?.trim() || "Email: tuoitrecamthanh@gmail.com";
  const emailAddress = email.replace(/^email:\s*/i, "");
  const website = settings.footerWebsite?.trim() || "https://tuoitrecamthanh.com.vn";
  return (
    <footer className="siteFooter" data-reveal>
      <div className="footerIdentity">
        <img src="/cam-thanh-logo.png" alt="Logo Tuổi trẻ Cẩm Thành" />
        <div>
          <strong>Di sản Cẩm Thành</strong>
          <span>Không gian số hóa ký ức và di sản địa phương</span>
        </div>
      </div>
      <div className="footerGroup">
        <p>Cơ quan quản lý</p>
        <strong>{settings.footerAgency || "Đoàn phường Cẩm Thành"}</strong>
        <span>{settings.footerAddress || "Tổ 12, phường Cẩm Thành, tỉnh Quảng Ngãi"}</span>
      </div>
      <div className="footerGroup footerContact">
        <p>Liên hệ</p>
        {showPhone && <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>}
        <a href={`mailto:${emailAddress}`}>{email}</a>
        <a href={normalizeWebsite(website)} target="_blank" rel="noreferrer">
          {displayWebsite(website)}
        </a>
        <small>{settings.footerCopyright || "Bản quyền thuộc về ACC Heritage Pro"}</small>
      </div>
    </footer>
  );
}

function CemeteryPage({ settings, graves, selected, selectedId, setSelectedId, query, setQuery, stats, onHome }) {
  const [sheetOpen, setSheetOpen] = useState(Boolean(selectedId));
  const [visibleCount, setVisibleCount] = useState(() => (
    query ? 5 : graves.filter((grave) => grave.type === "special").length
  ));
  const results = useMemo(() => prioritizeGraves(searchGraves(graves, query)), [graves, query]);
  const defaultResults = useMemo(
    () => prioritizeGraves(graves.filter((grave) => grave.type === "special")),
    [graves],
  );
  const visibleResults = query ? results : defaultResults;
  const mapSectionRef = useRef(null);

  useEffect(() => {
    if (selectedId) setSheetOpen(true);
    else setSheetOpen(false);
  }, [selectedId]);

  useEffect(() => {
    setVisibleCount(query ? 5 : defaultResults.length);
  }, [query, defaultResults.length]);

  function clearSelectedGrave() {
    setSelectedId(null);
    setSheetOpen(false);
    history.replaceState(null, "", "/nghia-trang");
  }

  function selectGrave(id) {
    if (!id || id === selectedId) {
      clearSelectedGrave();
      return;
    }
    setSelectedId(id);
    setSheetOpen(true);
    history.replaceState(null, "", `?tomb_id=${encodeURIComponent(id)}`);
  }

  function showInternalRoute() {
    setSheetOpen(false);
    window.requestAnimationFrame(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
    });
  }

  return (
    <>
      <header className="heritageDetailHero cemeteryDetailHero">
        <img src="/cemetery-hero.jpg" alt="Toàn cảnh Nghĩa trang Liệt sĩ Thiên Bút" />
        <div className="heritageDetailShade" />
        <button className="detailBack" onClick={onHome}>
          <ArrowLeft size={18} /> Khám phá Cẩm Thành
        </button>
        <div className="heritageDetailTitle">
          <p>Công trình thanh niên số hóa</p>
          <h1>Nghĩa trang Liệt sĩ Thiên Bút</h1>
          <span>{settings.cemeteryIntro}</span>
        </div>
      </header>

      <main className="heritageDetailPage cemeteryDetailPage">
        <section className="cemeteryStats cemeteryHeroStats" aria-label="Thống kê nghĩa trang" data-reveal>
          <Stat label="Tổng mộ" value={stats.total} />
          <Stat label="Đã xác định" value={stats.identified} />
          <Stat label="Đặc biệt" value={stats.special} />
        </section>

        <section className="cemeteryExplorer">
          <div className="cemeteryWorkspace">
            <section className="mapStage" ref={mapSectionRef} aria-label="Sa bàn vị trí phần mộ">
              <CemeteryMap
                settings={settings}
                graves={graves.filter((grave) => grave.placed)}
                selectedId={selectedId}
                onSelect={selectGrave}
                interactive
                showRoute
              />
            </section>

            <aside className="sidePanel cemeteryResultsPanel">
              <div className="searchBox cemeterySearchBox cemeteryPanelSearch">
                <Search size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm họ tên, khu, hàng, mộ..." />
                {query && (
                  <button className="ghostIcon" onClick={() => setQuery("")} aria-label="Xóa nội dung tìm kiếm">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="cemeteryResultsHead">
                <div>
                  <p className="eyebrow">Danh sách phần mộ</p>
                  <strong>{query ? `${results.length} kết quả phù hợp` : `${defaultResults.length} mộ đặc biệt`}</strong>
                </div>
                <span aria-live="polite">
                  {Math.min(visibleCount, visibleResults.length)} / {visibleResults.length}
                </span>
              </div>

              <div className="resultList publicResultList" role="region" aria-label="Danh sách phần mộ" tabIndex={0}>
                {visibleResults.slice(0, visibleCount).map((grave) => (
                  <button className={grave.id === selectedId ? "resultItem active" : "resultItem"} key={grave.id} onClick={() => selectGrave(grave.id)}>
                    <span className={grave.type === "special" ? "dot special" : "dot"} />
                    <span>
                      <strong>{grave.ten}</strong>
                      <small>{graveLabel(grave)}</small>
                    </span>
                  </button>
                ))}
              </div>

              {visibleCount < visibleResults.length && (
                <button className="loadMoreGraves" onClick={() => setVisibleCount((current) => current + 5)}>
                  Xem thêm phần mộ <ChevronRight size={17} />
                </button>
              )}
            </aside>
          </div>
        </section>

        <ProfileSheet grave={sheetOpen ? selected : null} onClose={clearSelectedGrave} onGuide={showInternalRoute} />

        <section className="heritageVideoSection cemeteryVideoSection" data-reveal>
          <div className="sectionHeading">
            <p className="eyebrow">Thuyết minh nghĩa trang</p>
            <h2>Câu chuyện qua hình ảnh</h2>
            <p>
              Phim tư liệu giới thiệu không gian tưởng niệm và hành trình số hóa thông tin
              tại Nghĩa trang Liệt sĩ Thiên Bút.
            </p>
          </div>
          <VideoFrame url={settings.youtubeUrl} title="Video thuyết minh Nghĩa trang Liệt sĩ Thiên Bút" />
        </section>

        <section className="heritageVisit cemeteryVisit" data-reveal>
          <div>
            <MapPin size={28} />
            <p className="eyebrow">Thăm viếng và tưởng niệm</p>
            <h2>Đi đến đúng địa điểm</h2>
            <p>Tổ 12, phường Cẩm Thành, tỉnh Quảng Ngãi</p>
          </div>
          <a
            className="primaryBtn mapLink"
            href="https://www.google.com/maps/search/?api=1&query=15.106445%2C108.8124696"
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={18} /> Mở Google Maps
          </a>
        </section>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}

function AdminPage({ settings, setSettings, graves, setGraves, selectedId, setSelectedId, onPublic }) {
  const [token, setToken] = useState(localStorage.getItem("camthanh.admin") || "");
  const [loginValue, setLoginValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [palette, setPalette] = useState("all");
  const selected = graves.find((grave) => grave.id === selectedId) || null;
  const authed = Boolean(token);

  const filtered = useMemo(() => {
    return prioritizeGraves(searchGraves(graves, filter).filter((grave) => {
      if (palette === "unplaced") return !grave.placed;
      if (palette === "special") return grave.type === "special";
      if (palette === "normal") return grave.type !== "special";
      return true;
    }));
  }, [graves, filter, palette]);

  function login(event) {
    event.preventDefault();
    localStorage.setItem("camthanh.admin", loginValue);
    setToken(loginValue);
    setLoginValue("");
  }

  async function updateGrave(id, patch) {
    const previous = graves;
    const next = graves.map((grave) => (grave.id === id ? { ...grave, ...patch } : grave));
    setGraves(next);
    setSaving(true);
    try {
      await api(`/api/graves/${id}`, {
        method: "PUT",
        token,
        body: JSON.stringify(patch),
      });
    } catch (error) {
      setGraves(previous);
      alert("Không lưu được. Kiểm tra mật khẩu admin hoặc server.");
    } finally {
      setSaving(false);
    }
  }

  async function addGrave() {
    const previous = graves;
    const nextTt = Math.max(0, ...graves.map((grave) => Number(grave.tt) || 0)) + 1;
    const id = `NEW-${Date.now().toString(36).toUpperCase()}`;
    const newGrave = {
      id,
      tt: nextTt,
      ten: "Mộ mới",
      namSinh: "",
      queQuan: "",
      capBac: "",
      donVi: "",
      hySinh: "",
      noiHySinh: "",
      ghiChu: "",
      khu: "",
      hang: null,
      mo: null,
      lo: "",
      type: "normal",
      placed: false,
      x: null,
      y: null,
    };
    const next = [...graves, newGrave];
    setGraves(next);
    setSelectedId(id);
    setFilter("");
    setPalette("all");
    setSaving(true);
    try {
      await api("/api/graves", {
        method: "PUT",
        token,
        body: JSON.stringify(next),
      });
    } catch (error) {
      setGraves(previous);
      setSelectedId(previous[0]?.id || null);
      alert("Không thêm được mộ. Kiểm tra mật khẩu admin hoặc server.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(nextSettings) {
    setSettings(nextSettings);
    await api("/api/settings", { method: "PUT", token, body: JSON.stringify(nextSettings) });
  }

  if (!authed) {
    return (
      <main className="loginShell">
        <form className="loginBox" onSubmit={login}>
          <div className="loginLogo">
            <img src="/cam-thanh-logo.png" alt="Logo Cẩm Thành" />
          </div>
          <div className="loginLockIcon">
            <Lock size={22} />
          </div>
          <h1>Đăng nhập Admin</h1>
          <p>Nhập mật khẩu quản trị để mở công cụ kéo-thả sa bàn.</p>
          <input type="password" value={loginValue} onChange={(event) => setLoginValue(event.target.value)} autoFocus />
          <button className="primaryBtn">Vào trang cấu hình</button>
        </form>
      </main>
    );
  }

  return (
    <>
      <header className="topbar compact">
        <div className="topbarBrand">
          <button className="iconText" onClick={onPublic}>
            <ArrowLeft size={18} /> Xem trang public
          </button>
          <img src="/cam-thanh-logo.png" alt="Logo Cẩm Thành" className="topbarLogo" />
          <div>
            <p className="eyebrow">Admin sa bàn</p>
            <h1>Kéo thả vị trí mộ</h1>
          </div>
        </div>
        <div className="saveState">
          {saving ? <Save size={17} /> : <Check size={17} />} {saving ? "Đang lưu" : "Đã sẵn sàng"}
        </div>
      </header>

      <main className="adminGrid">
        <section className="adminMap">
          <CemeteryMap
            settings={settings}
            graves={graves}
            selectedId={selected?.id}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
            onMove={(id, position) => updateGrave(id, { ...position, placed: true })}
            editable
            interactive
          />
        </section>

        <aside className="adminPanel">
          <div className="toolGroup">
            <label>Tiêu đề sa bàn</label>
            <input
              value={settings.cemeteryTitle}
              onChange={(event) => setSettings({ ...settings, cemeteryTitle: event.target.value })}
              onBlur={() => saveSettings(settings)}
            />
          </div>

          <div className="toolGroup">
            <label>Mô tả trang chủ</label>
            <textarea
              value={settings.heritageIntro}
              onChange={(event) => setSettings({ ...settings, heritageIntro: event.target.value })}
              onBlur={() => saveSettings(settings)}
              rows={3}
            />
          </div>

          <div className="toolGroup">
            <label>Mô tả nghĩa trang</label>
            <textarea
              value={settings.cemeteryIntro}
              onChange={(event) => setSettings({ ...settings, cemeteryIntro: event.target.value })}
              onBlur={() => saveSettings(settings)}
              rows={3}
            />
          </div>

          <div className="toolGroup">
            <label>Link YouTube thuyết minh</label>
            <input
              value={settings.youtubeUrl}
              onChange={(event) => setSettings({ ...settings, youtubeUrl: event.target.value })}
              onBlur={() => saveSettings(settings)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="footerSettings">
            <p className="eyebrow">Footer trang chủ</p>
            <div className="toolGroup">
              <label>Cơ quan quản lý</label>
              <input
                value={settings.footerAgency || ""}
                onChange={(event) => setSettings({ ...settings, footerAgency: event.target.value })}
                onBlur={() => saveSettings(settings)}
                placeholder="Đoàn phường Cẩm Thành"
              />
            </div>
            <div className="toolGroup">
              <label>Địa chỉ</label>
              <input
                value={settings.footerAddress || ""}
                onChange={(event) => setSettings({ ...settings, footerAddress: event.target.value })}
                onBlur={() => saveSettings(settings)}
                placeholder="Phường Cẩm Thành, Quảng Ngãi"
              />
            </div>
            <div className="toolGroup">
              <label>SĐT liên hệ</label>
              <input
                value={settings.footerPhone || ""}
                onChange={(event) => setSettings({ ...settings, footerPhone: event.target.value })}
                onBlur={() => saveSettings(settings)}
                placeholder="SĐT: đang cập nhật"
              />
            </div>
            <div className="toolGroup">
              <label>Email liên hệ</label>
              <input
                value={settings.footerEmail || ""}
                onChange={(event) => setSettings({ ...settings, footerEmail: event.target.value })}
                onBlur={() => saveSettings(settings)}
                placeholder="Email: tuoitrecamthanh@gmail.com"
              />
            </div>
            <div className="toolGroup">
              <label>Website</label>
              <input
                value={settings.footerWebsite || ""}
                onChange={(event) => setSettings({ ...settings, footerWebsite: event.target.value })}
                onBlur={() => saveSettings(settings)}
                placeholder="https://tuoitrecamthanh.com.vn"
              />
            </div>
            <div className="toolGroup">
              <label>Bản quyền</label>
              <input
                value={settings.footerCopyright || ""}
                onChange={(event) => setSettings({ ...settings, footerCopyright: event.target.value })}
                onBlur={() => saveSettings(settings)}
                placeholder="Bản quyền thuộc về ACC Heritage Pro"
              />
            </div>
          </div>

          <div className="toolGroup">
            <label>Tìm mộ để kéo thả</label>
            <div className="searchBox tight">
              <Search size={17} />
              <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Tên, khu, hàng, mộ" />
            </div>
          </div>

          <button className="ghostWide addGraveBtn" onClick={addGrave}>
            <Plus size={17} /> Thêm mộ
          </button>

          <div className="adminHint">
            Chọn một mộ trong danh sách, sau đó bấm lên sa bàn để đặt nhanh. Bạn vẫn có thể kéo marker để tinh chỉnh vị trí.
          </div>

          <div className="tabs">
            {[
              ["all", "Tất cả"],
              ["unplaced", "Chưa đặt"],
              ["normal", "Mộ thường"],
              ["special", "Đặc biệt"],
            ].map(([key, label]) => (
              <button className={palette === key ? "active" : ""} key={key} onClick={() => setPalette(key)}>
                {label}
              </button>
            ))}
          </div>

          {selected && <AdminEditor grave={selected} updateGrave={updateGrave} />}

          <div className="graveList">
            {filtered.map((grave) => (
              <button
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", grave.id)}
                className={grave.id === selected?.id ? "graveRow active" : "graveRow"}
                key={grave.id}
                onClick={() => setSelectedId(grave.id === selected?.id ? null : grave.id)}
              >
                <Move size={15} />
                <span className={grave.type === "special" ? "dot special" : "dot"} />
                <span>
                  <strong>{grave.ten}</strong>
                  <small>{graveLabel(grave)} {grave.placed ? "· đã đặt" : "· chưa đặt"}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </main>
    </>
  );
}

function CemeteryMap({ settings, graves, selectedId, onSelect, onMove, editable = false, interactive = false, showRoute = false }) {
  const ref = useRef(null);
  const contentRef = useRef(null);
  const gestureRef = useRef(null);
  const didPanRef = useRef(false);
  const lastPanEndRef = useRef(0);
  const pointersRef = useRef(new Map());
  const viewRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const fitZoomRef = useRef(1);
  const frameRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const [touchMode, setTouchMode] = useState(false);
  const selectedGrave = graves.find((grave) => grave.id === selectedId);

  useLayoutEffect(() => {
    const viewport = ref.current;
    if (!viewport) return undefined;

    const fitView = getFitView();
    fitZoomRef.current = fitView.zoom;
    commitView(fitView);

    const observer = new ResizeObserver(() => {
      const wasAtFit = Math.abs(viewRef.current.zoom - fitZoomRef.current) < 0.02;
      const nextFit = getFitView();
      fitZoomRef.current = nextFit.zoom;
      commitView(wasAtFit ? nextFit : viewRef.current);
    });
    observer.observe(viewport);

    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedGrave?.placed || editable) return;
    focusGrave(selectedGrave, 2.65);
  }, [selectedGrave?.id, editable]);

  function clampView(nextView) {
    const viewport = ref.current;
    const content = contentRef.current;
    if (!viewport || !content) return nextView;
    const baseW = content.offsetWidth || viewport.clientWidth;
    const baseH = content.offsetHeight || viewport.clientHeight;
    const scaledW = baseW * nextView.zoom;
    const scaledH = baseH * nextView.zoom;
    const minX = Math.min(0, viewport.clientWidth - scaledW);
    const minY = Math.min(0, viewport.clientHeight - scaledH);
    const maxX = scaledW < viewport.clientWidth ? (viewport.clientWidth - scaledW) / 2 : 0;
    const maxY = scaledH < viewport.clientHeight ? (viewport.clientHeight - scaledH) / 2 : 0;
    return {
      zoom: nextView.zoom,
      panX: clamp(nextView.panX, minX, maxX),
      panY: clamp(nextView.panY, minY, maxY),
    };
  }

  function getFitView() {
    const viewport = ref.current;
    const content = contentRef.current;
    if (!viewport || !content) return { zoom: 1, panX: 0, panY: 0 };
    const baseW = content.offsetWidth || viewport.clientWidth;
    const baseH = content.offsetHeight || viewport.clientHeight;
    const zoom = Math.min(1, viewport.clientWidth / baseW, viewport.clientHeight / baseH);
    return {
      zoom,
      panX: (viewport.clientWidth - baseW * zoom) / 2,
      panY: (viewport.clientHeight - baseH * zoom) / 2,
    };
  }

  function writeTransform(nextView) {
    if (!contentRef.current) return;
    contentRef.current.style.transform = `translate3d(${nextView.panX}px, ${nextView.panY}px, 0) scale(${nextView.zoom})`;
  }

  function commitView(nextView) {
    const clamped = clampView(nextView);
    viewRef.current = clamped;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    writeTransform(clamped);
    setView((current) => (
      Math.abs(current.zoom - clamped.zoom) < 0.0001
      && Math.abs(current.panX - clamped.panX) < 0.1
      && Math.abs(current.panY - clamped.panY) < 0.1
        ? current
        : clamped
    ));
    return clamped;
  }

  function scheduleView(nextView) {
    viewRef.current = clampView(nextView);
    if (frameRef.current) return viewRef.current;
    frameRef.current = requestAnimationFrame(() => {
      writeTransform(viewRef.current);
      frameRef.current = null;
    });
    return viewRef.current;
  }

  function setZoom(nextZoom, anchor, commit = true) {
    const viewport = ref.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const zoom = clamp(nextZoom, fitZoomRef.current, 4.5);
    const point = anchor || { x: rect.width / 2, y: rect.height / 2 };
    const current = viewRef.current;
    const localX = (point.x - current.panX) / current.zoom;
    const localY = (point.y - current.panY) / current.zoom;
    const nextView = {
      zoom,
      panX: point.x - localX * zoom,
      panY: point.y - localY * zoom,
    };
    return commit ? commitView(nextView) : scheduleView(nextView);
  }

  function resetView() {
    const fitView = getFitView();
    fitZoomRef.current = fitView.zoom;
    commitView(fitView);
  }

  function focusGrave(grave, zoom = 2.65) {
    const viewport = ref.current;
    const content = contentRef.current;
    if (!viewport || !content || !Number.isFinite(grave.x) || !Number.isFinite(grave.y)) return;
    const baseW = content.offsetWidth || viewport.clientWidth;
    const baseH = content.offsetHeight || viewport.clientHeight;
    commitView(
      {
        zoom,
        panX: viewport.clientWidth / 2 - (grave.x / 100) * baseW * zoom,
        panY: viewport.clientHeight / 2 - (grave.y / 100) * baseH * zoom,
      },
    );
  }

  function beginPan(pointer) {
    gestureRef.current = {
      type: "pan",
      x: pointer.x,
      y: pointer.y,
      view: { ...viewRef.current },
    };
  }

  function beginPinch() {
    const viewport = ref.current;
    const pointers = [...pointersRef.current.values()];
    if (!viewport || pointers.length < 2) return;
    const [first, second] = pointers;
    const rect = viewport.getBoundingClientRect();
    const center = {
      x: (first.x + second.x) / 2 - rect.left,
      y: (first.y + second.y) / 2 - rect.top,
    };
    const current = viewRef.current;
    gestureRef.current = {
      type: "pinch",
      distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
      zoom: current.zoom,
      localX: (center.x - current.panX) / current.zoom,
      localY: (center.y - current.panY) / current.zoom,
    };
  }

  function pointFromEvent(event) {
    const rect = contentRef.current.getBoundingClientRect();
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function drop(event) {
    if (!editable) return;
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || dragId;
    if (!id) return;
    onMove(id, pointFromEvent(event));
    onSelect(id);
    setDragId(null);
  }

  function handleCanvasClick(event) {
    if (!editable) {
      if (performance.now() - lastPanEndRef.current < 180) return;
      if (selectedId && interactive && !event.target.closest?.(".graveMarker") && !event.target.closest?.(".mapControls")) {
        onSelect(null);
      }
      return;
    }
    if (!editable || !selectedId || !onMove) return;
    if (event.target.closest?.(".graveMarker") || event.target.closest?.(".mapControls")) return;
    onMove(selectedId, pointFromEvent(event));
  }

  function handlePointerDown(event) {
    if (editable || event.target.closest?.(".mapControls")) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.pointerType === "touch" && !touchMode && pointersRef.current.size < 2) return;
    event.preventDefault();
    event.target.setPointerCapture?.(event.pointerId);
    contentRef.current.style.willChange = "transform";
    if (pointersRef.current.size > 1) beginPinch();
    else beginPan({ x: event.clientX, y: event.clientY });
    didPanRef.current = false;
  }

  function handlePointerMove(event) {
    if (event.pointerType === "touch" && !touchMode && pointersRef.current.size < 2) return;
    const gesture = gestureRef.current;
    if (!gesture || editable || !pointersRef.current.has(event.pointerId)) return;
    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size > 1) {
      if (gesture.type !== "pinch") beginPinch();
      const pinch = gestureRef.current;
      const pointers = [...pointersRef.current.values()];
      const [first, second] = pointers;
      const rect = ref.current.getBoundingClientRect();
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const centerX = (first.x + second.x) / 2 - rect.left;
      const centerY = (first.y + second.y) / 2 - rect.top;
      const zoom = clamp(pinch.zoom * (distance / pinch.distance), fitZoomRef.current, 4.5);
      didPanRef.current = true;
      scheduleView({
        zoom,
        panX: centerX - pinch.localX * zoom,
        panY: centerY - pinch.localY * zoom,
      });
      return;
    }

    if (gesture.type !== "pan") beginPan({ x: event.clientX, y: event.clientY });
    const pan = gestureRef.current;
    if (Math.abs(event.clientX - pan.x) + Math.abs(event.clientY - pan.y) > 6) didPanRef.current = true;
    scheduleView({
      zoom: pan.view.zoom,
      panX: pan.view.panX + event.clientX - pan.x,
      panY: pan.view.panY + event.clientY - pan.y,
    });
  }

  function handlePointerUp(event) {
    if (editable) {
      if (dragId && onMove) onMove(dragId, pointFromEvent(event));
      setDragId(null);
      return;
    }
    const passiveTouch = event.pointerType === "touch" && !touchMode;
    pointersRef.current.delete(event.pointerId);
    if (passiveTouch && gestureRef.current?.type !== "pinch") return;
    if (passiveTouch) {
      gestureRef.current = null;
      contentRef.current.style.willChange = "auto";
      commitView(viewRef.current);
      return;
    }
    if (pointersRef.current.size === 1) {
      beginPan([...pointersRef.current.values()][0]);
      return;
    }
    gestureRef.current = null;
    contentRef.current.style.willChange = "auto";
    if (didPanRef.current) lastPanEndRef.current = performance.now();
    didPanRef.current = false;
    commitView(viewRef.current);
  }

  function handleDoubleClick(event) {
    if (editable || event.target.closest?.(".mapControls")) return;
    event.preventDefault();
    const rect = ref.current.getBoundingClientRect();
    setZoom(viewRef.current.zoom * 1.6, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  const graveMarkers = useMemo(() => graves
    .filter((grave) => grave.placed && Number.isFinite(grave.x) && Number.isFinite(grave.y))
    .map((grave) => (
      <button
        key={grave.id}
        draggable={editable}
        data-grave-id={grave.id}
        onDragStart={(event) => event.dataTransfer.setData("text/plain", grave.id)}
        onPointerDown={(event) => {
          if (!editable) return;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setDragId(grave.id);
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (performance.now() - lastPanEndRef.current < 180) return;
          if (interactive) onSelect(grave.id);
        }}
        className={[
          "graveMarker",
          grave.type === "special" ? "special" : "",
          grave.id === selectedId ? "selected" : "",
        ].join(" ")}
        style={{ left: `${grave.x}%`, top: `${grave.y}%` }}
        title={`${grave.ten} - ${graveLabel(grave)}`}
      >
        {grave.type === "special" ? <Star size={11} /> : null}
      </button>
    )), [graves, selectedId, editable, interactive, onSelect]);

  return (
    <div
      className={`cemeteryCanvas ${touchMode ? "touchMode" : ""}`}
      ref={ref}
      onClick={handleCanvasClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onDoubleClick={handleDoubleClick}
      onDragOver={(event) => event.preventDefault()}
      onDrop={drop}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="mapControls" aria-label="Điều khiển sơ đồ">
        <button
          type="button"
          className={`touchModeToggle ${touchMode ? "active" : ""}`}
          onClick={() => setTouchMode((current) => !current)}
          aria-pressed={touchMode}
          title={touchMode ? "Tắt điều khiển cảm ứng" : "Bật kéo sa bàn"}
        >
          <Move size={17} />
        </button>
        <button type="button" onClick={() => selectedGrave ? focusGrave(selectedGrave, 2.65) : resetView()} title={selectedGrave ? "Tới mộ đang chọn" : "Về toàn cảnh"}>
          <LocateFixed size={17} />
        </button>
        <button type="button" onClick={() => setZoom(viewRef.current.zoom * 1.35)} title="Phóng to">
          <Plus size={17} />
        </button>
        <button type="button" onClick={() => setZoom(viewRef.current.zoom * 0.74)} title="Thu nhỏ">
          <Minus size={17} />
        </button>
        <button type="button" onClick={resetView} title="Về toàn cảnh">
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="mapZoomHint">Kéo để di chuyển · Bấm +/- để phóng to</div>
      <div
        className="cemeteryContent"
        ref={contentRef}
        style={{ transform: `translate3d(${view.panX}px, ${view.panY}px, 0) scale(${view.zoom})` }}
      >
        <img src={settings.mapImage} alt="Sơ đồ nghĩa trang" draggable={false} />
        <div className="youAreHere">
          <span />
          Bạn đang ở đây
        </div>
        {showRoute && selectedGrave?.placed && (
          <svg className="routeLayer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={`37.5,40.2 37.5,67 ${selectedGrave.x},67 ${selectedGrave.x},${selectedGrave.y}`} />
          </svg>
        )}
        {graveMarkers}
      </div>
    </div>
  );
}

function AdminEditor({ grave, updateGrave }) {
  const [draft, setDraft] = useState(grave);

  useEffect(() => {
    setDraft(grave);
  }, [grave.id]);

  function setField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function commit(field) {
    const numericFields = new Set(["tt", "hang", "mo"]);
    const raw = draft[field];
    const value = numericFields.has(field) ? (raw === "" || raw === null ? null : Number(raw)) : raw;
    if (grave[field] === value) return;
    updateGrave(grave.id, { [field]: value });
  }

  function saveAll() {
    const patch = {};
    ["tt", "ten", "namSinh", "queQuan", "capBac", "donVi", "hySinh", "noiHySinh", "ghiChu", "khu", "hang", "mo", "lo"].forEach((field) => {
      const numericFields = new Set(["tt", "hang", "mo"]);
      const raw = draft[field];
      const value = numericFields.has(field) ? (raw === "" || raw === null ? null : Number(raw)) : raw;
      if (grave[field] !== value) patch[field] = value;
    });
    if (Object.keys(patch).length) updateGrave(grave.id, patch);
  }

  return (
    <div className="editorBox">
      <div className="editorHead">
        <Edit3 size={17} />
        <strong>{grave.ten}</strong>
      </div>
      <small>{graveLabel(grave)} · {grave.id}</small>
      <div className="typeSwitch">
        <button className={grave.type !== "special" ? "active" : ""} onClick={() => updateGrave(grave.id, { type: "normal" })}>
          Trắng: mộ thường
        </button>
        <button className={grave.type === "special" ? "active special" : ""} onClick={() => updateGrave(grave.id, { type: "special" })}>
          Đỏ: mộ đặc biệt
        </button>
      </div>
      <button className="ghostWide" onClick={() => updateGrave(grave.id, { placed: false, x: null, y: null })}>
        Gỡ khỏi sa bàn
      </button>

      <div className="graveEditGrid">
        <label>
          <span>Họ tên</span>
          <input value={draft.ten || ""} onChange={(event) => setField("ten", event.target.value)} onBlur={() => commit("ten")} />
        </label>
        <label>
          <span>STT</span>
          <input type="number" value={draft.tt || ""} onChange={(event) => setField("tt", event.target.value)} onBlur={() => commit("tt")} />
        </label>
        <label>
          <span>Khu</span>
          <input value={draft.khu || ""} onChange={(event) => setField("khu", event.target.value)} onBlur={() => commit("khu")} />
        </label>
        <label>
          <span>Hàng</span>
          <input type="number" value={draft.hang || ""} onChange={(event) => setField("hang", event.target.value)} onBlur={() => commit("hang")} />
        </label>
        <label>
          <span>Mộ</span>
          <input type="number" value={draft.mo || ""} onChange={(event) => setField("mo", event.target.value)} onBlur={() => commit("mo")} />
        </label>
        <label>
          <span>Năm sinh</span>
          <input value={draft.namSinh || ""} onChange={(event) => setField("namSinh", event.target.value)} onBlur={() => commit("namSinh")} />
        </label>
        <label>
          <span>Quê quán</span>
          <input value={draft.queQuan || ""} onChange={(event) => setField("queQuan", event.target.value)} onBlur={() => commit("queQuan")} />
        </label>
        <label>
          <span>Cấp bậc, chức vụ</span>
          <input value={draft.capBac || ""} onChange={(event) => setField("capBac", event.target.value)} onBlur={() => commit("capBac")} />
        </label>
        <label>
          <span>Đơn vị</span>
          <input value={draft.donVi || ""} onChange={(event) => setField("donVi", event.target.value)} onBlur={() => commit("donVi")} />
        </label>
        <label>
          <span>Hy sinh</span>
          <input value={draft.hySinh || ""} onChange={(event) => setField("hySinh", event.target.value)} onBlur={() => commit("hySinh")} />
        </label>
        <label className="wide">
          <span>Nơi hy sinh</span>
          <input value={draft.noiHySinh || ""} onChange={(event) => setField("noiHySinh", event.target.value)} onBlur={() => commit("noiHySinh")} />
        </label>
        <label className="wide">
          <span>Ghi chú</span>
          <textarea value={draft.ghiChu || ""} onChange={(event) => setField("ghiChu", event.target.value)} onBlur={() => commit("ghiChu")} rows={2} />
        </label>
      </div>
      <button className="ghostWide" onClick={saveAll}>Lưu thông tin mộ</button>
    </div>
  );
}

function ProfileSheet({ grave, onClose, onGuide }) {
  const [qrBusy, setQrBusy] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!grave) return undefined;
    const previousFocus = document.activeElement;
    const lockedScrollY = window.scrollY;
    const previousBodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.classList.add("sheetOpen");
    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${lockedScrollY}px`,
      left: "0",
      right: "0",
      width: "100%",
    });
    document.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    return () => {
      document.body.classList.remove("sheetOpen");
      Object.assign(document.body.style, previousBodyStyle);
      window.scrollTo({ top: lockedScrollY, behavior: "instant" });
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [grave?.id]);

  if (!grave) return null;

  async function downloadQr() {
    setQrBusy(true);
    try {
      const dataUrl = await createGraveQrPng(grave);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${slugify(`${grave.id}-${grave.ten}`)}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Không tạo được mã QR. Vui lòng thử lại.");
    } finally {
      setQrBusy(false);
    }
  }

  return createPortal(
    <div className="sheetScrim" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <article
        className="profileSheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="grave-profile-title"
      >
        <div className="sheetHandle" />
        <button ref={closeRef} className="closeBtn" onClick={onClose} aria-label="Đóng hồ sơ">
          <X size={16} />
        </button>
        <p className="eyebrow">{grave.type === "special" ? "Mộ đặc biệt" : "Hồ sơ liệt sĩ"}</p>
        <h2 id="grave-profile-title">{grave.ten}</h2>
        <p className="locationLine">
          <MapPin size={16} /> {graveLabel(grave)}
        </p>
        <dl>
          <Info label="Năm sinh" value={grave.namSinh} />
          <Info label="Quê quán" value={grave.queQuan} />
          <Info label="Cấp bậc, chức vụ" value={grave.capBac} />
          <Info label="Đơn vị" value={grave.donVi} />
          <Info label="Hy sinh" value={grave.hySinh} />
          <Info label="Nơi hy sinh" value={grave.noiHySinh} />
          <Info label="Ghi chú" value={grave.ghiChu} />
        </dl>
        <div className="sheetActions">
          <button className="primaryBtn" onClick={onGuide}>
            <Navigation size={18} /> Hiển thị đường đi trên sa bàn
          </button>
          <button className="iconText qrDownloadBtn" onClick={downloadQr} disabled={qrBusy}>
            <Download size={17} /> {qrBusy ? "Đang tạo QR..." : "Tải QR dán mộ"}
          </button>
        </div>
      </article>
    </div>,
    document.body,
  );
}

function Info({ label, value }) {
  if (!value) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function graveLabel(grave) {
  return [grave.khu && `Khu ${grave.khu}`, grave.hang && `Hàng ${grave.hang}`, grave.mo && `Mộ ${grave.mo}`]
    .filter(Boolean)
    .join(" · ") || "Chưa có vị trí";
}

async function createGraveQrPng(grave) {
  const url = `${window.location.origin}/nghia-trang?tomb_id=${encodeURIComponent(grave.id)}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 520,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#2a2520",
      light: "#fffdf8",
    },
  });

  const [qrImage, logoImage] = await Promise.all([
    loadImage(qrDataUrl),
    loadImage("/cam-thanh-logo.png").catch(() => null),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f8f1e7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fffdf8";
  roundRect(ctx, 54, 54, 792, 1092, 36);
  ctx.fill();
  ctx.strokeStyle = "#e0cdbc";
  ctx.lineWidth = 4;
  ctx.stroke();

  if (logoImage) {
    ctx.drawImage(logoImage, 348, 92, 204, 158);
  }

  ctx.fillStyle = "#8b1e1e";
  ctx.font = "700 30px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText("MÃ QR TRA CỨU MỘ LIỆT SĨ", 450, 292);

  ctx.drawImage(qrImage, 190, 330, 520, 520);

  ctx.fillStyle = "#2a2520";
  ctx.font = "800 46px system-ui, -apple-system, 'Segoe UI', sans-serif";
  wrapCanvasText(ctx, grave.ten || "Liệt sĩ", 450, 920, 700, 54);

  ctx.fillStyle = "#5f5146";
  ctx.font = "700 30px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText(graveLabel(grave), 450, 1026);

  ctx.fillStyle = "#8d7561";
  ctx.font = "500 24px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("Quét mã để xem hồ sơ, vị trí và chỉ đường trên sa bàn", 450, 1084);
  ctx.fillText("Nghĩa trang Liệt sĩ Thiên Bút", 450, 1122);

  return canvas.toDataURL("image/png");
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.slice(0, 3).forEach((item, index) => ctx.fillText(item, x, startY + index * lineHeight));
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function slugify(value) {
  return fold(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "ma-qr-mo-liet-si";
}

function searchGraves(graves, query) {
  const text = fold(query);
  if (!text) return graves;
  const tokens = text.split(/\s+/).filter(Boolean);
  const hasLetters = /[a-z]/.test(text);
  const scored = graves
    .map((grave) => {
      const name = fold(grave.ten);
      const id = fold(grave.id);
      const label = fold(graveLabel(grave));
      const hometown = fold(grave.queQuan);
      const haystack = [name, id, label, hometown].join(" ");
      const allTokensMatch = tokens.every((token) => haystack.includes(token));
      if (!allTokensMatch) return null;

      let score = 10;
      if (name === text) score += 1000;
      else if (name.includes(text)) score += 700;
      else if (tokens.every((token) => name.includes(token))) score += 520;
      if (id === text) score += 850;
      else if (id.includes(text)) score += 320;
      if (!hasLetters && label.includes(text)) score += 420;
      if (grave.type === "special") score += 40;
      return { grave, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || compareGraves(a.grave, b.grave));

  return scored.map((item) => item.grave);
}

function fold(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function normalizeWebsite(value) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function displayWebsite(value) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function prioritizeGraves(graves) {
  return [...graves].sort(compareGraves);
}

function compareGraves(a, b) {
  const special = Number(b.type === "special") - Number(a.type === "special");
  if (special) return special;
  const placed = Number(b.placed) - Number(a.placed);
  if (placed) return placed;
  return String(a.khu || "").localeCompare(String(b.khu || ""), "vi")
    || (Number(a.hang) || 999) - (Number(b.hang) || 999)
    || (Number(a.mo) || 999) - (Number(b.mo) || 999)
    || (Number(a.tt) || 9999) - (Number(b.tt) || 9999)
    || String(a.ten || "").localeCompare(String(b.ten || ""), "vi");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function fetchJson(pathname, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || 15000);
  let response;
  try {
    response = await fetch(`${API}${pathname}`, { signal: controller.signal });
  } catch {
    throw new Error(`Không kết nối được ${pathname}`);
  } finally {
    window.clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(pathname);
  return response.json();
}

async function api(pathname, options) {
  const response = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-admin-token": options.token,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(pathname);
  return response.json();
}

createRoot(document.getElementById("root")).render(<App />);
