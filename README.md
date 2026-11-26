# The Promised Offspring

An interactive biblical lineage explorer and educational web game built from *The Promised Offspring.pdf*, tracing the Messianic line from Adam to Jesus Christ across **746 interactive Insight & Scripture nodes**.

**Live Site:** https://exaltedgrey.github.io/Lineage/

## Features

1. **Story Journey (7 Guided Eras):** Walk from *Eden & The First Promise* through *The Promised Offspring* with narrative storytelling, clickable JW Library prophecy milestones, lineage stepping-stone cards, and milestone check-in questions.
2. **Lineage Explorer (746 Nodes):** Pan-and-zoom SVG canvas preserving the full archival poster layout, with instant search + fly-to, category filter pills, and a **Focus: Line to Jesus Only** toggle highlighting both the Matthew 1 Legal Lineage (Solomon → Joseph) and Luke 3 Natural Lineage (Nathan → Mary).
3. **B.C.E. Lifespan Timeline:** Interactive Year Scrubber (4026 B.C.E. → 33 C.E., explicitly noting no zero year between 1 B.C.E. and 1 C.E.) with live computed ages, overlap spotlights (*Adam & Methuselah 243 yrs*, *Shem & Abraham 150 yrs*, *Noah & Abraham 2 yrs apart*), and 19 clickable historical chronology events.
4. **Lineage Challenge Quiz:** Three playable modes (*Lineage Chain Builder*, *Prophecy & Covenant Match*, *Timeline & Overlap Showdown*) with streaks, accuracy tracking, and collectible archival badges saved in `localStorage`.
5. **Shared Insight Profile Drawer:** Slide-over profile accessible from any mode with dates, lifespan, curated overview, clickable Parents/Spouses/Children traversal chips, contemporaries with overlap years, Explorer fly-to, and direct `jw.org/finder` Insight & Scripture links.

## Development

```bash
npm install
npm run dev
npm run build
```

### Repeatable PDF Data Extraction

```bash
pip install pymupdf
python3 scripts/extract_pdf_data.py --pdf "/path/to/The Promised Offspring.pdf"
```
