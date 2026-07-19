import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Edit3,
  Home,
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

function App() {
  const [route, setRoute] = useState(initialRoute());
  const [settings, setSettings] = useState(null);
  const [graves, setGraves] = useState([]);
  const [bootError, setBootError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const selected = graves.find((grave) => grave.id === selectedId);

  useEffect(() => {
    const syncRoute = () => setRoute(initialRoute());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

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
    const placed = graves.filter((grave) => grave.placed).length;
    const special = graves.filter((grave) => grave.type === "special").length;
    return { total: graves.length, placed, special };
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
      {route === "admin" ? (
        <AdminPage
          settings={settings}
          setSettings={setSettings}
          graves={graves}
          setGraves={setGraves}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onPublic={() => {
            history.pushState(null, "", "/nghia-trang");
            setRoute("cemetery");
          }}
        />
      ) : route === "home" ? (
        <HomePage
          settings={settings}
          onAdmin={() => {
            history.pushState(null, "", "/admin");
            setRoute("admin");
          }}
          onCemetery={() => {
            history.pushState(null, "", "/nghia-trang");
            setRoute("cemetery");
          }}
          onHeritage={(site) => {
            history.pushState(null, "", site.path);
            setRoute(site.route);
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        />
      ) : heritageSitesByRoute[route] ? (
        <HeritageDetailPage
          site={heritageSitesByRoute[route]}
          onHome={() => {
            history.pushState(null, "", "/");
            setRoute("home");
          }}
          footer={
            <SiteFooter
              settings={settings}
              onHome={() => {
                history.pushState(null, "", "/");
                setRoute("home");
              }}
              showAdmin={false}
            />
          }
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
          onHome={() => {
            history.pushState(null, "", "/");
            setRoute("home");
          }}
          onAdmin={() => {
            history.pushState(null, "", "/admin");
            setRoute("admin");
          }}
        />
      )}
    </div>
  );
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
    name: "Nghĩa trang Liệt sĩ Núi Thiên Bút",
    address: "Phường Cẩm Thành, Quảng Ngãi",
    category: "heritage",
    lat: 15.106445,
    lng: 108.8124696,
    to: 12,
    image: "/cemetery-map.jpg",
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

function HomePage({ settings, onAdmin, onCemetery, onHeritage }) {
  const [activeId, setActiveId] = useState(null);
  const activePlace = heritagePlaces.find((place) => place.id === activeId);

  function openPlace(place) {
    if (place.route === "cemetery") onCemetery();
    else onHeritage(place.site);
  }

  return (
    <>
      <header className="travelHero">
        <div className="heroImage">
          <img src="/quang-ngai-hero.png" alt="Trung tâm thành phố Quảng Ngãi" />
          <div className="heroLogo" aria-label="Logo Tuổi trẻ Cẩm Thành">
            <img src="/cam-thanh-logo.png" alt="Tuổi trẻ Cẩm Thành" />
          </div>
          <div className="heroOverlay">
            <p>Di sản và địa phương</p>
            <h1>Khám phá di sản Cẩm Thành</h1>
            <span>{settings.heritageIntro}</span>
          </div>
        </div>
      </header>

      <main className="homePage">
        <section className="heritageMapShell">
          <div className="heritageMapFrame">
            <CamThanhMap
              places={heritagePlaces}
              activeId={activeId}
              onSelect={(id) => setActiveId(activeId === id ? null : id)}
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
            {heritagePlaces.map((place) => (
              <button
                key={place.id}
                className={`placeCard ${place.category} ${activeId === place.id ? "active" : ""}`}
                onClick={() => openPlace(place)}
              >
                <img src={place.image} alt="" />
                <span>
                  <strong>{place.name}</strong>
                  <small>{place.address}</small>
                </span>
                <ChevronRight size={19} />
              </button>
            ))}
          </div>
        </section>

        <section className="spiritualBlock">
          <div>
            <p className="eyebrow">Điều hướng tâm linh</p>
            <h2>Nghĩa trang Liệt sĩ Núi Thiên Bút</h2>
            <p>{settings.cemeteryIntro}</p>
          </div>
          <button className="primaryBtn" onClick={onCemetery}>
            Đi đến Nghĩa Trang Thiên Bút
          </button>
        </section>
      </main>
      <SiteFooter settings={settings} onCemetery={onCemetery} onAdmin={onAdmin} />
    </>
  );
}

function SiteFooter({ settings, onHome, onAdmin, showAdmin = true }) {
  return (
    <footer className="siteFooter">
      <div>
        <p className="eyebrow">Điều hướng</p>
        <div className="footerActions">
          {showAdmin ? (
            <button className="footerAdmin" onClick={onAdmin}>
              <Lock size={15} /> Admin
            </button>
          ) : (
            <button className="footerAdmin" onClick={onHome}>
              <Home size={15} /> Trang chủ
            </button>
          )}
        </div>
      </div>
      <div>
        <p className="eyebrow">Cơ quan quản lý</p>
        <strong>{settings.footerAgency || "Đoàn phường Cẩm Thành"}</strong>
        <span>{settings.footerAddress || "Phường Cẩm Thành, Quảng Ngãi"}</span>
      </div>
      <div>
        <p className="eyebrow">Liên hệ</p>
        <span>{settings.footerPhone || "SĐT: đang cập nhật"}</span>
        <span>{settings.footerEmail || "Email: contact@accheritagepro.vn"}</span>
      </div>
      <div>
        <p className="eyebrow">Bản quyền</p>
        <span>{settings.footerCopyright || "Bản quyền thuộc về ACC Heritage Pro"}</span>
      </div>
    </footer>
  );
}

function CemeteryPage({ settings, graves, selected, selectedId, setSelectedId, query, setQuery, stats, onHome, onAdmin }) {
  const [sheetOpen, setSheetOpen] = useState(Boolean(selectedId));
  const results = useMemo(() => prioritizeGraves(searchGraves(graves, query)), [graves, query]);
  const defaultResults = useMemo(() => prioritizeGraves(graves), [graves]);
  const mapSectionRef = useRef(null);

  useEffect(() => {
    if (!selectedId || !mapSectionRef.current) return;
    if (!window.matchMedia("(max-width: 980px)").matches) return;
    window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) setSheetOpen(true);
    else setSheetOpen(false);
  }, [selectedId]);

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
    window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  return (
    <>
      <header className="topbar">
        <div className="topbarBrand">
          <img src="/cam-thanh-logo.png" alt="Logo Cẩm Thành" className="topbarLogo" />
          <div>
            <p className="eyebrow">Cẩm Thành số hóa</p>
            <h1>{settings.cemeteryTitle}</h1>
          </div>
        </div>
        <div className="navActions">
          <button className="iconText" onClick={onHome}>
            <Home size={18} /> Trang chủ
          </button>
        </div>
      </header>

      <main className="publicGrid">
        <section className="mapStage" ref={mapSectionRef}>
          <CemeteryMap
            settings={settings}
            graves={graves.filter((grave) => grave.placed)}
            selectedId={selectedId}
            onSelect={selectGrave}
            interactive
            showRoute
          />
        </section>

        <aside className="sidePanel">
          <div className="searchBox">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm họ tên, khu, hàng, mộ..." />
            {query && (
              <button className="ghostIcon" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="statRow">
            <Stat label="Tổng mộ" value={stats.total} />
            <Stat label="Đã đặt" value={stats.placed} />
            <Stat label="Đặc biệt" value={stats.special} />
          </div>

          <div className="resultList">
            {(query ? results : defaultResults).map((grave) => (
              <button className={grave.id === selectedId ? "resultItem active" : "resultItem"} key={grave.id} onClick={() => selectGrave(grave.id)}>
                <span className={grave.type === "special" ? "dot special" : "dot"} />
                <span>
                  <strong>{grave.ten}</strong>
                  <small>{graveLabel(grave)}</small>
                </span>
              </button>
            ))}
          </div>

          {!selected && <EmptyProfile />}
        </aside>
      </main>

      <ProfileSheet grave={sheetOpen ? selected : null} onClose={clearSelectedGrave} onGuide={showInternalRoute} />

      <section className="cemeteryLead">
        <div>
          <p className="eyebrow">Giới thiệu và thuyết minh</p>
          <p>{settings.cemeteryIntro}</p>
        </div>
        <VideoFrame url={settings.youtubeUrl} title="Video thuyết minh Nghĩa trang Liệt sĩ Núi Thiên Bút" />
      </section>

      <section className="externalMap">
        <div>
          <p className="eyebrow">Chỉ đường ngoại khu</p>
          <h2>Google Maps đến Nghĩa trang Liệt sĩ Núi Thiên Bút</h2>
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

      <SiteFooter settings={settings} onHome={onHome} onAdmin={onAdmin} showAdmin={false} />
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
                placeholder="Email: contact@accheritagepro.vn"
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
  const [dragId, setDragId] = useState(null);
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const selectedGrave = graves.find((grave) => grave.id === selectedId);

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

  function setZoom(nextZoom, anchor) {
    const viewport = ref.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const zoom = clamp(nextZoom, 1, 5);
    const point = anchor || { x: rect.width / 2, y: rect.height / 2 };
    setView((current) => {
      const localX = (point.x - current.panX) / current.zoom;
      const localY = (point.y - current.panY) / current.zoom;
      return clampView({
        zoom,
        panX: point.x - localX * zoom,
        panY: point.y - localY * zoom,
      });
    });
  }

  function resetView() {
    setView({ zoom: 1, panX: 0, panY: 0 });
  }

  function focusGrave(grave, zoom = 2.65) {
    const viewport = ref.current;
    const content = contentRef.current;
    if (!viewport || !content || !Number.isFinite(grave.x) || !Number.isFinite(grave.y)) return;
    const baseW = content.offsetWidth || viewport.clientWidth;
    const baseH = content.offsetHeight || viewport.clientHeight;
    setView(
      clampView({
        zoom,
        panX: viewport.clientWidth / 2 - (grave.x / 100) * baseW * zoom,
        panY: viewport.clientHeight / 2 - (grave.y / 100) * baseH * zoom,
      }),
    );
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
      if (didPanRef.current) {
        didPanRef.current = false;
        return;
      }
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
    if (editable || event.target.closest?.(".graveMarker") || event.target.closest?.(".mapControls")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gestureRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: view.panX,
      panY: view.panY,
    };
    didPanRef.current = false;
  }

  function handlePointerMove(event) {
    const gesture = gestureRef.current;
    if (!gesture || editable) return;
    if (Math.abs(event.clientX - gesture.x) + Math.abs(event.clientY - gesture.y) > 6) {
      didPanRef.current = true;
    }
    setView(
      clampView({
        zoom: view.zoom,
        panX: gesture.panX + event.clientX - gesture.x,
        panY: gesture.panY + event.clientY - gesture.y,
      }),
    );
  }

  function handlePointerUp(event) {
    if (dragId && onMove) onMove(dragId, pointFromEvent(event));
    setDragId(null);
    gestureRef.current = null;
  }

  function handleWheel(event) {
    if (editable) return;
    event.preventDefault();
    const rect = ref.current.getBoundingClientRect();
    setZoom(view.zoom * (event.deltaY > 0 ? 0.86 : 1.16), {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  return (
    <div
      className="cemeteryCanvas"
      ref={ref}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onDragOver={(event) => event.preventDefault()}
      onDrop={drop}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="mapControls" aria-label="Điều khiển sơ đồ">
        <button type="button" onClick={() => selectedGrave ? focusGrave(selectedGrave, 2.65) : resetView()} title={selectedGrave ? "Tới mộ đang chọn" : "Về toàn cảnh"}>
          <LocateFixed size={17} />
        </button>
        <button type="button" onClick={() => setZoom(view.zoom * 1.18)} title="Phóng to">
          <Plus size={17} />
        </button>
        <button type="button" onClick={() => setZoom(view.zoom * 0.84)} title="Thu nhỏ">
          <Minus size={17} />
        </button>
        <button type="button" onClick={resetView} title="Về toàn cảnh">
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="mapZoomHint">Kéo để di chuyển · Cuộn hoặc bấm +/- để phóng to</div>
      <div
        className="cemeteryContent"
        ref={contentRef}
        style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}
      >
        <img src={settings.mapImage} alt="Sơ đồ nghĩa trang" draggable={false} />
        <div className="youAreHere">
          <span />
          Bạn đang ở đây
        </div>
        {showRoute && selectedGrave?.placed && (
          <svg className="routeLayer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={`42,82 42,67 ${selectedGrave.x},67 ${selectedGrave.x},${selectedGrave.y}`} />
          </svg>
        )}
        {graves
          .filter((grave) => grave.placed && Number.isFinite(grave.x) && Number.isFinite(grave.y))
          .map((grave) => (
            <button
              key={grave.id}
              draggable={editable}
              onDragStart={(event) => event.dataTransfer.setData("text/plain", grave.id)}
              onPointerDown={(event) => {
                if (!editable) return;
                event.currentTarget.setPointerCapture?.(event.pointerId);
                setDragId(grave.id);
              }}
              onClick={(event) => {
                event.stopPropagation();
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
          ))}
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

function EmptyProfile() {
  return (
    <div className="emptyProfile">
      <MapPin size={24} />
      <p>Chọn một mộ trên danh sách hoặc sa bàn để xem hồ sơ.</p>
    </div>
  );
}

function ProfileSheet({ grave, onClose, onGuide }) {
  const [qrBusy, setQrBusy] = useState(false);

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

  return (
    <div className="sheetScrim" onClick={onClose}>
      <article className="profileSheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheetHandle" />
        <button className="closeBtn" onClick={onClose} aria-label="Đóng hồ sơ">
          <X size={16} />
        </button>
        <p className="eyebrow">{grave.type === "special" ? "Mộ đặc biệt" : "Hồ sơ liệt sĩ"}</p>
        <h2>{grave.ten}</h2>
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
    </div>
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
  ctx.fillText("Nghĩa trang Liệt sĩ Núi Thiên Bút", 450, 1122);

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
