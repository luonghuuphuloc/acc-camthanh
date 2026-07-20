import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import mapData from "../data/cam-thanh-map-data.json";

const ZONE_COLORS = [
  "#7d9bb8", "#d99a62", "#c87b7b", "#75aaa5", "#7da071",
  "#d4b65f", "#a884a1", "#d89aa5", "#9b8475", "#a7a39a",
  "#5f98b4", "#b993ac", "#82aaa6", "#c9ae68", "#8fa8bc",
];

export default function CamThanhMap({ places, activeId, onSelect, onOpen }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const onSelectRef = useRef(onSelect);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const compactMap = window.matchMedia("(max-width: 700px)").matches;
    const map = L.map(containerRef.current, {
      preferCanvas: false,
      scrollWheelZoom: false,
      dragging: !coarsePointer,
      touchZoom: false,
      doubleClickZoom: !coarsePointer,
      boxZoom: !coarsePointer,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const wardLayer = L.geoJSON(mapData.ward, {
      style: { color: "#9f2929", weight: 2.5, dashArray: "7 5", fill: false },
    });
    map.fitBounds(wardLayer.getBounds().pad(0.015));
    wardLayer.addTo(map);

    L.geoJSON(mapData.zones, {
      style: (feature) => ({
        color: "rgba(48, 54, 57, 0.72)",
        weight: 1,
        fillColor: ZONE_COLORS[(feature.properties.to - 1) % ZONE_COLORS.length],
        fillOpacity: 0.32,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(`Tổ ${feature.properties.to}`, {
          permanent: true,
          direction: "center",
          className: "camThanhZoneLabel",
        });
        layer.on("mouseover", () => layer.setStyle({ weight: 2, fillOpacity: 0.48 }));
        layer.on("mouseout", () => layer.setStyle({ weight: 1, fillOpacity: 0.32 }));
      },
    }).addTo(map);

    const labelPlacements = compactMap
      ? [
          { direction: "top", offset: [0, -11] },
          { direction: "top", offset: [-42, -11] },
          { direction: "top", offset: [42, -11] },
        ]
      : [
          { direction: "top", offset: [0, -11] },
          { direction: "left", offset: [-11, 0] },
          { direction: "right", offset: [11, 0] },
        ];
    for (const [index, place] of places.entries()) {
      const marker = L.circleMarker([place.lat, place.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#a52020",
        fillOpacity: 1,
      }).addTo(map);
      const popup = document.createElement("div");
      popup.className = "camThanhPlacePopup";
      const kicker = document.createElement("small");
      kicker.textContent = `Điểm di sản · Tổ ${place.to}`;
      const title = document.createElement("strong");
      title.textContent = place.name;
      const address = document.createElement("span");
      address.textContent = place.address;
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = "Khám phá địa điểm";
      L.DomEvent.disableClickPropagation(action);
      action.addEventListener("click", () => onOpenRef.current?.(place.id));
      popup.append(kicker, title, address, action);

      marker.bindPopup(popup, { closeButton: true, offset: [0, -4] });
      const labelPlacement = labelPlacements[index % labelPlacements.length];
      marker.bindTooltip(place.name, {
        permanent: true,
        direction: labelPlacement.direction,
        offset: labelPlacement.offset,
        className: "camThanhPlaceLabel",
        opacity: 1,
      });
      marker.on("click", () => onSelectRef.current?.(place.id));
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.setAttribute("role", "button");
        markerElement.setAttribute("tabindex", "0");
        markerElement.setAttribute("aria-label", `Xem ${place.name}`);
        L.DomEvent.on(markerElement, "keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          L.DomEvent.preventDefault(event);
          onSelectRef.current?.(place.id);
          marker.openPopup();
        });
      }
      markersRef.current.set(place.id, marker);
    }

    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [id, marker] of markersRef.current) {
      marker.setStyle({
        radius: id === activeId ? 12 : 9,
        fillColor: id === activeId ? "#6f1515" : "#a52020",
      });
    }
    const activeMarker = markersRef.current.get(activeId);
    if (activeMarker) {
      activeMarker.openPopup();
      map.panTo(activeMarker.getLatLng(), { animate: true, duration: 0.35 });
    } else {
      map.closePopup();
    }
  }, [activeId]);

  return (
    <div
      ref={containerRef}
      className="camThanhMap"
      role="application"
      aria-label="Bản đồ 15 tổ dân phố phường Cẩm Thành"
    />
  );
}
