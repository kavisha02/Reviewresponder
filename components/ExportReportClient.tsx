"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Business, Review } from "@/lib/types";

interface ReportData {
  business: Business;
  reviews: Review[];
  metrics: {
    total: number;
    avgRating: string;
    avgRatingNum: number;
    responseRate: number;
    last30Count: number;
    needsAttention: number;
    ratingCounts: Array<{ star: number; count: number }>;
    statusData: Array<{ label: string; count: number }>;
    monthlyData: Array<{ label: string; count: number; avgRating: number }>;
    sentPositive: number;
    sentNeutral: number;
    sentNegative: number;
    langCounts: { english: number; hindi: number; hinglish: number };
    negRespRate: number;
    topReviews: Review[];
    publishedReviews: Review[];
  };
  analyses: {
    category: unknown;
    sentiment: unknown;
    insights: unknown;
    summary: unknown;
  };
}

interface Props {
  reportData: ReportData;
}

const SECTIONS = [
  { id: "overview", label: "Business Overview", default: true },
  { id: "metrics", label: "Key Metrics", default: true },
  { id: "rating", label: "Rating Distribution", default: true },
  { id: "monthly", label: "Monthly Review Volume", default: true },
  { id: "status", label: "Review Status Breakdown", default: true },
  { id: "sentiment", label: "Sentiment Breakdown", default: true },
  { id: "language", label: "Language Distribution", default: true },
  { id: "summary", label: "AI Location Summary", default: true },
  { id: "category", label: "AI Category Analysis", default: true },
  { id: "insights", label: "AI Actionable Insights", default: true },
  { id: "sentimentInsights", label: "AI Sentiment Insights", default: true },
  { id: "topReviews", label: "Top Reviews", default: true },
  { id: "responses", label: "Response Log", default: true },
];

export default function ExportReportClient({ reportData }: Props) {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(SECTIONS.filter((s) => s.default).map((s) => s.id))
  );
  const [format, setFormat] = useState<"pdf" | "word">("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSection = (id: string) => {
    const newSet = new Set(selectedSections);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSections(newSet);
  };

  const selectAll = () => {
    setSelectedSections(new Set(SECTIONS.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedSections(new Set());
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = doc.internal.pageSize.getWidth() - 2 * margin;

      const addPage = () => {
        doc.addPage();
        yPos = margin;
      };

      const checkPageBreak = (height: number) => {
        if (yPos + height > pageHeight - margin) {
          addPage();
        }
      };

      // Header
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229); // indigo
      doc.text("Review Report", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 8;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, margin + maxWidth, yPos);
      yPos += 8;

      // Business Overview
      if (selectedSections.has("overview")) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Business Overview", margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`Business: ${reportData.business.name}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Type: ${reportData.business.business_type || "Not specified"}`, margin + 5, yPos);
        yPos += 8;
      }

      // Key Metrics
      if (selectedSections.has("metrics")) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Key Metrics", margin, yPos);
        yPos += 8;

        const metricsTable = [
          ["Metric", "Value"],
          ["Total Reviews", reportData.metrics.total.toString()],
          ["Average Rating", `${reportData.metrics.avgRating}★`],
          ["Response Rate", `${reportData.metrics.responseRate}%`],
          ["Last 30 Days", reportData.metrics.last30Count.toString()],
          ["Needs Attention", reportData.metrics.needsAttention.toString()],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [metricsTable[0]],
          body: metricsTable.slice(1),
          margin: margin,
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
          bodyStyles: { textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }

      // Rating Distribution
      if (selectedSections.has("rating")) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Rating Distribution", margin, yPos);
        yPos += 8;

        const ratingTable = [
          ["Rating", "Count", "Percentage"],
          ...reportData.metrics.ratingCounts.map((r) => [
            `${"★".repeat(r.star)}`,
            r.count.toString(),
            reportData.metrics.total > 0
              ? `${Math.round((r.count / reportData.metrics.total) * 100)}%`
              : "0%",
          ]),
        ];

        autoTable(doc, {
          startY: yPos,
          head: [ratingTable[0]],
          body: ratingTable.slice(1),
          margin: margin,
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
          bodyStyles: { textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }

      // Monthly Review Volume
      if (selectedSections.has("monthly")) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Monthly Review Volume (Last 6 Months)", margin, yPos);
        yPos += 8;

        const monthlyTable = [
          ["Month", "Count", "Avg Rating"],
          ...reportData.metrics.monthlyData.map((m) => [
            m.label,
            m.count.toString(),
            m.avgRating > 0 ? m.avgRating.toFixed(1) : "—",
          ]),
        ];

        autoTable(doc, {
          startY: yPos,
          head: [monthlyTable[0]],
          body: monthlyTable.slice(1),
          margin: margin,
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
          bodyStyles: { textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }

      // Review Status Breakdown
      if (selectedSections.has("status")) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Review Status Breakdown", margin, yPos);
        yPos += 8;

        const statusTable = [
          ["Status", "Count"],
          ...reportData.metrics.statusData.map((s) => [s.label, s.count.toString()]),
        ];

        autoTable(doc, {
          startY: yPos,
          head: [statusTable[0]],
          body: statusTable.slice(1),
          margin: margin,
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
          bodyStyles: { textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }

      // Sentiment Breakdown
      if (selectedSections.has("sentiment")) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Sentiment Breakdown", margin, yPos);
        yPos += 8;

        const sentimentTable = [
          ["Sentiment", "Count", "Percentage"],
          [
            "Positive (4-5★)",
            reportData.metrics.sentPositive.toString(),
            reportData.metrics.total > 0
              ? `${Math.round((reportData.metrics.sentPositive / reportData.metrics.total) * 100)}%`
              : "0%",
          ],
          [
            "Mixed (3★)",
            reportData.metrics.sentNeutral.toString(),
            reportData.metrics.total > 0
              ? `${Math.round((reportData.metrics.sentNeutral / reportData.metrics.total) * 100)}%`
              : "0%",
          ],
          [
            "Negative (1-2★)",
            reportData.metrics.sentNegative.toString(),
            reportData.metrics.total > 0
              ? `${Math.round((reportData.metrics.sentNegative / reportData.metrics.total) * 100)}%`
              : "0%",
          ],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [sentimentTable[0]],
          body: sentimentTable.slice(1),
          margin: margin,
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
          bodyStyles: { textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }

      // Language Distribution
      if (selectedSections.has("language")) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Language Distribution", margin, yPos);
        yPos += 8;

        const langTable = [
          ["Language", "Count"],
          ["English", reportData.metrics.langCounts.english.toString()],
          ["Hindi", reportData.metrics.langCounts.hindi.toString()],
          ["Hinglish", reportData.metrics.langCounts.hinglish.toString()],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [langTable[0]],
          body: langTable.slice(1),
          margin: margin,
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
          bodyStyles: { textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }

      // AI Location Summary
      if (selectedSections.has("summary") && reportData.analyses.summary) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("AI Location Summary", margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        const summaryText = reportData.analyses.summary as string;
        const wrappedSummary = doc.splitTextToSize(summaryText, maxWidth - 10);
        doc.text(wrappedSummary, margin + 5, yPos);
        yPos += wrappedSummary.length * 5 + 8;
      }

      // AI Category Analysis
      if (selectedSections.has("category") && reportData.analyses.category) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("AI Category Analysis", margin, yPos);
        yPos += 8;

        const categoryData = reportData.analyses.category as any;
        if (categoryData.topics && Array.isArray(categoryData.topics)) {
          const topicsTable = [
            ["Topic", "Sentiment", "Mentions"],
            ...categoryData.topics.slice(0, 10).map((t: any) => [
              t.topic,
              t.sentiment,
              t.mentions.toString(),
            ]),
          ];

          autoTable(doc, {
            startY: yPos,
            head: [topicsTable[0]],
            body: topicsTable.slice(1),
            margin: margin,
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
            bodyStyles: { textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: { 0: { cellWidth: 80 } },
          });

          yPos = (doc as any).lastAutoTable.finalY + 8;
        }
      }

      // AI Actionable Insights
      if (selectedSections.has("insights") && reportData.analyses.insights) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("AI Actionable Insights", margin, yPos);
        yPos += 8;

        const insightsData = reportData.analyses.insights as any;
        if (Array.isArray(insightsData)) {
          insightsData.slice(0, 5).forEach((insight: any, idx: number) => {
            checkPageBreak(20);
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`${idx + 1}. ${insight.insight}`, margin + 5, yPos);
            yPos += 6;

            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(`Impact: ${insight.impact}`, margin + 10, yPos);
            yPos += 5;
            doc.text(`Action: ${insight.recommendation}`, margin + 10, yPos);
            yPos += 8;
          });
        }
      }

      // AI Sentiment Insights
      if (selectedSections.has("sentimentInsights") && reportData.analyses.sentiment) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("AI Sentiment Insights", margin, yPos);
        yPos += 8;

        const sentimentData = reportData.analyses.sentiment as any;
        ["positive", "mixed", "negative"].forEach((key) => {
          checkPageBreak(15);
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}:`, margin + 5, yPos);
          yPos += 5;

          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          const text = sentimentData[key] || "No data";
          const wrapped = doc.splitTextToSize(text, maxWidth - 15);
          doc.text(wrapped, margin + 10, yPos);
          yPos += wrapped.length * 4 + 5;
        });
      }

      // Top Reviews
      if (selectedSections.has("topReviews") && reportData.metrics.topReviews.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Top Reviews", margin, yPos);
        yPos += 8;

        reportData.metrics.topReviews.slice(0, 5).forEach((review, idx) => {
          checkPageBreak(25);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`${idx + 1}. ${review.author_name || "Anonymous"} - ${"★".repeat(review.rating || 0)}`, margin + 5, yPos);
          yPos += 5;

          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          const reviewText = review.review_text || "(No text)";
          const wrapped = doc.splitTextToSize(reviewText, maxWidth - 15);
          doc.text(wrapped, margin + 10, yPos);
          yPos += wrapped.length * 4 + 5;
        });
      }

      // Response Log
      if (selectedSections.has("responses") && reportData.metrics.publishedReviews.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Response Log", margin, yPos);
        yPos += 8;

        const responseTable = [
          ["Author", "Rating", "Response"],
          ...reportData.metrics.publishedReviews.slice(0, 10).map((r) => [
            r.author_name || "Anonymous",
            `${r.rating}★`,
            (r.published_response || "").substring(0, 50) + "...",
          ]),
        ];

        autoTable(doc, {
          startY: yPos,
          head: [responseTable[0]],
          body: responseTable.slice(1),
          margin: margin,
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
          bodyStyles: { textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: { 2: { cellWidth: 80 } },
        });
      }

      // Download
      doc.save(`${reportData.business.name}-report.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF");
    }
  };

  const generateWord = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/export/word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: reportData.business.id,
          sections: Array.from(selectedSections),
          data: reportData,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        setError(error.error || "Failed to generate Word document");
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportData.business.name}-report.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Word generation error:", err);
      setError("Failed to generate Word document");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (selectedSections.size === 0) {
      setError("Please select at least one section");
      return;
    }

    if (format === "pdf") {
      generatePDF();
    } else {
      generateWord();
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Selection */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Select Sections to Include</h2>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SECTIONS.map((section) => (
            <label
              key={section.id}
              className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedSections.has(section.id)}
                onChange={() => toggleSection(section.id)}
                className="w-4 h-4 rounded border-slate-600 text-indigo-600 cursor-pointer"
              />
              <span className="text-sm text-slate-300">{section.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Export Format</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-3 p-3 bg-slate-900/50 border-2 rounded-lg cursor-pointer transition-all" style={{ borderColor: format === "pdf" ? "#4f46e5" : "#475569" }}>
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={format === "pdf"}
              onChange={(e) => setFormat(e.target.value as "pdf" | "word")}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-slate-300">PDF Document</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-slate-900/50 border-2 rounded-lg cursor-pointer transition-all" style={{ borderColor: format === "word" ? "#4f46e5" : "#475569" }}>
            <input
              type="radio"
              name="format"
              value="word"
              checked={format === "word"}
              onChange={(e) => setFormat(e.target.value as "pdf" | "word")}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-slate-300">Word Document (.docx)</span>
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={loading || selectedSections.size === 0}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200"
      >
        {loading ? "Generating..." : `Download ${format.toUpperCase()} Report`}
      </button>
    </div>
  );
}
