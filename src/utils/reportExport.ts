/**
 * Report download helpers — PDF (a real, selectable-text table under a club letterhead) and PNG (a
 * snapshot of the on-screen report).
 *
 * jspdf and html2canvas are loaded on demand rather than imported at the top: together they are a
 * few hundred KB, and only an admin who actually clicks Download ever needs them.
 */

const PDF_NAVY: [number, number, number] = [20, 33, 61];
const PDF_GOLD: [number, number, number] = [198, 161, 91];
const PDF_MUTED: [number, number, number] = [122, 128, 140];
const PDF_RULE: [number, number, number] = [225, 227, 232];

/** A cell that is either plain text or text plus per-cell styling, as jspdf-autotable accepts. */
export type PdfCell =
    | string
    | number
    | {
          content: string | number;
          styles?: Record<string, unknown>;
          /** Spanned cells consume their neighbours, so a spanning row carries fewer entries. */
          colSpan?: number;
          rowSpan?: number;
      };

/** A right-aligned key/value pair in the letterhead, e.g. Period / September 2026. */
export interface PdfMeta {
    label: string;
    value: string;
}

export interface PdfTableOptions {
    /** Club name, set in caps as the letterhead's masthead. */
    brandName: string;
    /** Club crest as a data URL. Omitted or unloadable, the letterhead simply runs without it. */
    brandLogo?: string;
    /** What the document is — printed under the masthead. */
    title: string;
    /** Key/value pairs set against the right margin, opposite the masthead. */
    meta?: PdfMeta[];
    /** One-line stat strip between the rule and the table, e.g. "24 players · 18 paid · 6 due". */
    summaryLine?: string;
    head: string[];
    body: PdfCell[][];
    /** Optional bold row pinned to the bottom of the table. */
    foot?: PdfCell[][];
    /** File name without extension. */
    filename: string;
    orientation?: "portrait" | "landscape";
    /** Small print in the footer, e.g. how "Due" is defined. */
    note?: string;
    /** Per-column overrides, keyed by column index. */
    columnStyles?: Record<number, Record<string, unknown>>;
}

/**
 * Reads an image URL into a data URL so jsPDF can embed it, capped at `maxSize` on its longest edge.
 *
 * The downscale is not cosmetic: jsPDF stores the decoded bitmap, so embedding the club crest at its
 * full 491px turns a small report into a megabyte-plus file for a mark drawn at 34pt.
 *
 * Resolves to undefined rather than throwing — a crest that will not load must never be the reason
 * a report fails to download.
 */
export const loadImageAsDataUrl = (url: string, maxSize = 160): Promise<string | undefined> =>
    new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            try {
                const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                const context = canvas.getContext("2d");
                if (!context) {
                    resolve(undefined);
                    return;
                }
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/png"));
            } catch {
                resolve(undefined);
            }
        };
        image.onerror = () => resolve(undefined);
        image.src = url;
    });

/** Renders a report to a paginated PDF and triggers the download. */
export const exportTableToPdf = async ({
    brandName,
    brandLogo,
    title,
    meta = [],
    summaryLine,
    head,
    body,
    foot,
    filename,
    orientation = "landscape",
    note,
    columnStyles,
}: PdfTableOptions): Promise<void> => {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 36;

    // ── Letterhead ──────────────────────────────────────────────────
    const logoSize = 34;
    let textLeft = margin;
    if (brandLogo) {
        try {
            doc.addImage(brandLogo, "PNG", margin, 30, logoSize, logoSize);
            textLeft = margin + logoSize + 12;
        } catch {
            // An unreadable crest is not worth failing the download over.
        }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...PDF_NAVY);
    doc.text(brandName.toUpperCase(), textLeft, 46);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_MUTED);
    doc.text(title, textLeft, 59);

    let metaY = 36;
    meta.forEach(({ label, value }) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...PDF_MUTED);
        doc.text(label.toUpperCase(), pageWidth - margin, metaY, { align: "right" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PDF_NAVY);
        doc.text(value, pageWidth - margin, metaY + 12, { align: "right" });
        metaY += 24;
    });

    const ruleY = Math.max(74, metaY - 2);
    doc.setDrawColor(...PDF_GOLD);
    doc.setLineWidth(1.5);
    doc.line(margin, ruleY, pageWidth - margin, ruleY);

    let tableTop = ruleY + 16;
    if (summaryLine) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...PDF_NAVY);
        doc.text(summaryLine, margin, ruleY + 16);
        tableTop = ruleY + 30;
    }

    // ── Table ───────────────────────────────────────────────────────
    autoTable(doc, {
        head: [head],
        body,
        foot,
        startY: tableTop,
        margin: { left: margin, right: margin, top: tableTop, bottom: 46 },
        styles: {
            fontSize: 8.5,
            cellPadding: 5,
            overflow: "linebreak",
            lineColor: PDF_RULE,
            lineWidth: 0.5,
            textColor: [40, 44, 54],
        },
        headStyles: {
            fillColor: PDF_NAVY,
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
            cellPadding: 6,
        },
        footStyles: {
            fillColor: [244, 245, 248],
            textColor: PDF_NAVY,
            fontStyle: "bold",
            lineColor: PDF_RULE,
            lineWidth: 0.5,
        },
        alternateRowStyles: { fillColor: [250, 250, 252] },
        columnStyles,
        theme: "grid",
    });

    // ── Footer, stamped once the total page count is known ──────────
    const pageCount = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(...PDF_RULE);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...PDF_MUTED);
        if (note) {
            doc.text(note, margin, pageHeight - 21);
        }
        doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 21, { align: "right" });
    }

    doc.save(`${filename}.pdf`);
};

/**
 * Snapshots a DOM node to a PNG and triggers the download.
 *
 * `backgroundColor` matters: a transparent background renders as black, which would make a
 * light-theme report unreadable.
 */
export const exportNodeToPng = async (
    node: HTMLElement,
    filename: string,
    backgroundColor = "#FFFFFF"
): Promise<void> => {
    const [{ default: html2canvas }, fileSaver] = await Promise.all([
        import("html2canvas"),
        import("file-saver"),
    ]);

    // A month-per-column table scrolls sideways, and html2canvas only ever captures what is laid
    // out. Widen the capture by however much the widest inner scroller is hiding, then unclip those
    // scrollers in the cloned document so the off-screen columns actually render.
    const SCROLLERS = ".ant-table-content, .ant-table-body";
    const hiddenWidth = Array.from(node.querySelectorAll<HTMLElement>(SCROLLERS)).reduce(
        (widest, el) => Math.max(widest, el.scrollWidth - el.clientWidth),
        0
    );
    const captureWidth = node.scrollWidth + hiddenWidth;

    const canvas = await html2canvas(node, {
        backgroundColor,
        // Above 1x so the text stays sharp when the image is opened full-size or printed.
        scale: Math.min(window.devicePixelRatio || 1, 2) * 1.5,
        useCORS: true,
        width: captureWidth,
        windowWidth: Math.max(document.documentElement.clientWidth, captureWidth),
        scrollX: 0,
        scrollY: 0,
        onclone: (_clonedDoc, clonedNode) => {
            const root = clonedNode as HTMLElement;
            root.style.width = `${captureWidth}px`;
            root.style.maxWidth = "none";
            root.querySelectorAll<HTMLElement>(SCROLLERS).forEach((el) => {
                el.style.overflow = "visible";
                el.style.maxWidth = "none";
            });
        },
    });

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
        throw new Error("The browser could not turn the report into an image.");
    }
    fileSaver.saveAs(blob, `${filename}.png`);
};
