import React from "react";
import { ArrowLeft, Award, CalendarDays, ChevronRight, ExternalLink, Landmark, MapPin } from "lucide-react";

export default function HeritageDetailPage({ site, onHome, footer }) {
  return (
    <>
      <header className="heritageDetailHero">
        <img src={site.heroImage} alt={site.heroAlt} />
        <div className="heritageDetailShade" />
        <button className="detailBack" onClick={onHome}>
          <ArrowLeft size={18} /> Khám phá Cẩm Thành
        </button>
        <div className="heritageDetailTitle">
          <p>{site.kicker}</p>
          <h1>{site.title}</h1>
          <span>{site.subtitle}</span>
        </div>
      </header>

      <main className="heritageDetailPage">
        <section className="heritageMeta" aria-label="Thông tin di tích">
          <div>
            <MapPin size={20} />
            <span><small>Địa điểm</small>{site.address}</span>
          </div>
          <div>
            <CalendarDays size={20} />
            <span><small>Giai đoạn</small>{site.period}</span>
          </div>
          <div>
            <Award size={20} />
            <span><small>Xếp hạng cấp tỉnh</small>{site.recognized}</span>
          </div>
        </section>

        <section className="heritageIntroBlock">
          <div>
            <p className="eyebrow">Câu chuyện di sản</p>
            <h2>{site.fullTitle}</h2>
          </div>
          <p>{site.intro}</p>
        </section>

        <section className="heritageFactRow">
          {site.facts.map((fact) => (
            <div key={fact.label}>
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </div>
          ))}
        </section>

        <section className="heritageStoryGrid">
          {site.sections.map((section, index) => (
            <article key={section.title} className={index % 2 ? "storyPanel reverse" : "storyPanel"}>
              <div className="storyNumber">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="eyebrow">{section.eyebrow}</p>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="heritageTimeline">
          <div className="sectionHeading">
            <p className="eyebrow">Theo dòng lịch sử</p>
            <h2>Những mốc cần ghi nhớ</h2>
          </div>
          <div className="timelineRail">
            {site.timeline.map((item) => (
              <article key={`${item.year}-${item.title}`}>
                <time>{item.year}</time>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="heritageGallery">
          <div className="sectionHeading">
            <p className="eyebrow">Ảnh tư liệu</p>
            <h2>Di tích trong ký ức và hôm nay</h2>
          </div>
          <div className={`galleryGrid galleryCount${site.gallery.length}`}>
            {site.gallery.map((image) => (
              <figure key={image.src}>
                <img src={image.src} alt={image.alt} />
                <figcaption>{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="heritageVisit">
          <div>
            <Landmark size={28} />
            <p className="eyebrow">Tham quan di tích</p>
            <h2>Đi đến đúng địa điểm</h2>
            <p>{site.address}</p>
          </div>
          <a className="primaryBtn" href={site.mapUrl} target="_blank" rel="noreferrer">
            Mở chỉ đường <ExternalLink size={17} />
          </a>
        </section>

        <p className="heritageSource">
          <strong>Nguồn nội dung:</strong> {site.source}
        </p>

        <button className="nextHeritage" onClick={onHome}>
          Xem các địa điểm di sản khác <ChevronRight size={18} />
        </button>
      </main>
      {footer}
    </>
  );
}
