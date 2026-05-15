"use client";

import { useState, useEffect } from "react";
import { Business, Review } from "@/lib/types";

// Dynamic import for html2pdf since it requires the window object
let html2pdf: any;
if (typeof window !== "undefined") {
  html2pdf = require("html2pdf.js");
}

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const generatePDF = async () => {
    setLoading(true);
    setError("");
    
    try {
      const element = document.getElementById("pdf-report-content");
      if (!element) throw new Error("Report content not found");

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${reportData.business.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF");
    } finally {
      setLoading(false);
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
      {/* Hidden DOM element for html2pdf to capture. 
          Use explicit inline styles for spacing, borders, colors, and layout to ensure perfect rendering. */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', pointerEvents: 'none' }}>
        <div id="pdf-report-content" style={{ backgroundColor: '#ffffff', color: '#000000', width: '700px', padding: '32px', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px', lineHeight: '1.6' }}>
          
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#4f46e5', margin: '0 0 8px 0', textAlign: 'center' }}>Review Report</h1>
          <p style={{ color: '#6b7280', margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Generated on {mounted ? new Date().toLocaleDateString() : ""}</p>
          
          {selectedSections.has("overview") && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Business Overview</h2>
              <div style={{ paddingLeft: '8px' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>Business:</strong> {reportData.business.name}</p>
                <p style={{ margin: '0' }}><strong>Type:</strong> {reportData.business.business_type || "Not specified"}</p>
              </div>
            </div>
          )}

          {selectedSections.has("metrics") && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Key Metrics</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', pageBreakInside: 'avoid' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4f46e5', color: '#ffffff', pageBreakInside: 'avoid' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Metric</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', fontWeight: '500', border: '1px solid #d1d5db' }}>Total Reviews</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.total}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f9fafb', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', fontWeight: '500', border: '1px solid #d1d5db' }}>Average Rating</td>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#eab308', border: '1px solid #d1d5db' }}>{reportData.metrics.avgRating}★</td>
                  </tr>
                  <tr style={{ pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', fontWeight: '500', border: '1px solid #d1d5db' }}>Response Rate</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.responseRate}%</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f9fafb', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', fontWeight: '500', border: '1px solid #d1d5db' }}>Last 30 Days</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.last30Count}</td>
                  </tr>
                  <tr style={{ pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', fontWeight: '500', border: '1px solid #d1d5db' }}>Needs Attention</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.needsAttention}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedSections.has("rating") && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Rating Distribution</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', pageBreakInside: 'avoid' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4f46e5', color: '#ffffff', pageBreakInside: 'avoid' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Rating</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Count</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.metrics.ratingCounts.map((r, i) => (
                    <tr key={r.star} style={{ backgroundColor: i % 2 !== 0 ? '#f9fafb' : 'transparent', pageBreakInside: 'avoid' }}>
                      <td style={{ padding: '8px', color: '#eab308', border: '1px solid #d1d5db' }}>{"★".repeat(r.star)}</td>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{r.count}</td>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                        {reportData.metrics.total > 0 ? Math.round((r.count / reportData.metrics.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSections.has("monthly") && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Monthly Review Volume</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', pageBreakInside: 'avoid' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4f46e5', color: '#ffffff', pageBreakInside: 'avoid' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Month</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Count</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.metrics.monthlyData.map((m, i) => (
                    <tr key={m.label} style={{ backgroundColor: i % 2 !== 0 ? '#f9fafb' : 'transparent', pageBreakInside: 'avoid' }}>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{m.label}</td>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{m.count}</td>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{m.avgRating > 0 ? m.avgRating.toFixed(1) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSections.has("status") && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Review Status Breakdown</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', pageBreakInside: 'avoid' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4f46e5', color: '#ffffff', pageBreakInside: 'avoid' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.metrics.statusData.map((s, i) => (
                    <tr key={s.label} style={{ backgroundColor: i % 2 !== 0 ? '#f9fafb' : 'transparent', pageBreakInside: 'avoid' }}>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{s.label}</td>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSections.has("sentiment") && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Sentiment Breakdown</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', pageBreakInside: 'avoid' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4f46e5', color: '#ffffff', pageBreakInside: 'avoid' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Sentiment</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Count</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Positive (4-5★)</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.sentPositive}</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.total > 0 ? Math.round((reportData.metrics.sentPositive / reportData.metrics.total) * 100) : 0}%</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f9fafb', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Mixed (3★)</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.sentNeutral}</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.total > 0 ? Math.round((reportData.metrics.sentNeutral / reportData.metrics.total) * 100) : 0}%</td>
                  </tr>
                  <tr style={{ pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Negative (1-2★)</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.sentNegative}</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.total > 0 ? Math.round((reportData.metrics.sentNegative / reportData.metrics.total) * 100) : 0}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedSections.has("language") && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>Language Distribution</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', pageBreakInside: 'avoid' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4f46e5', color: '#ffffff', pageBreakInside: 'avoid' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Language</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>English</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.langCounts.english}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f9fafb', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Hindi</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.langCounts.hindi}</td>
                  </tr>
                  <tr style={{ pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Hinglish</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{reportData.metrics.langCounts.hinglish}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedSections.has("summary") && reportData.analyses.summary && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>AI Location Summary</h2>
              <p style={{ color: '#374151', whiteSpace: 'pre-wrap', margin: '0' }}>{reportData.analyses.summary as string}</p>
            </div>
          )}

          {selectedSections.has("category") && reportData.analyses.category && (
            <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>AI Category Analysis</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', pageBreakInside: 'avoid' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4f46e5', color: '#ffffff', pageBreakInside: 'avoid' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Topic</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Sentiment</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db' }}>Mentions</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData.analyses.category as any).topics?.slice(0, 10).map((t: any, i: number) => (
                    <tr key={t.topic} style={{ backgroundColor: i % 2 !== 0 ? '#f9fafb' : 'transparent', pageBreakInside: 'avoid' }}>
                      <td style={{ padding: '8px', fontWeight: '500', border: '1px solid #d1d5db' }}>{t.topic}</td>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{t.sentiment}</td>
                      <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>{t.mentions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSections.has("insights") && reportData.analyses.insights && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center', pageBreakInside: 'avoid' }}>AI Actionable Insights</h2>
              <div>
                {(reportData.analyses.insights as any).slice(0, 5).map((insight: any, i: number) => (
                  <div key={i} style={{ padding: '16px', border: '1px solid #e0e7ff', borderRadius: '8px', backgroundColor: '#eef2ff', marginBottom: '16px', pageBreakInside: 'avoid' }}>
                    <h3 style={{ fontWeight: '600', color: '#312e81', margin: '0 0 8px 0' }}>{i + 1}. {insight.insight}</h3>
                    <p style={{ color: '#4b5563', margin: '0 0 8px 0' }}><strong style={{ color: '#1f2937' }}>Impact:</strong> {insight.impact}</p>
                    <p style={{ color: '#4b5563', margin: '0' }}><strong style={{ color: '#1f2937' }}>Action:</strong> {insight.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSections.has("sentimentInsights") && reportData.analyses.sentiment && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center', pageBreakInside: 'avoid' }}>AI Sentiment Insights</h2>
              <div>
                {["positive", "mixed", "negative"].map((key) => {
                  const data = (reportData.analyses.sentiment as any)[key];
                  if (!data) return null;
                  return (
                    <div key={key} style={{ marginBottom: '16px', pageBreakInside: 'avoid' }}>
                      <h3 style={{ fontWeight: '600', textTransform: 'capitalize', color: '#1f2937', margin: '0 0 8px 0' }}>{key} Feedback:</h3>
                      <p style={{ padding: '12px', borderRadius: '4px', border: '1px solid #e5e7eb', color: '#374151', backgroundColor: '#f9fafb', margin: '0' }}>{data}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedSections.has("topReviews") && reportData.metrics.topReviews.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center', pageBreakInside: 'avoid' }}>Top Reviews</h2>
              <div>
                {reportData.metrics.topReviews.slice(0, 5).map((r, i) => (
                  <div key={r.id || i} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', backgroundColor: '#f9fafb', marginBottom: '16px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#111827' }}>{r.author_name || "Anonymous"}</span>
                      <span style={{ color: '#eab308' }}>{"★".repeat(r.rating || 0)}</span>
                    </div>
                    <p style={{ fontStyle: 'italic', color: '#374151', margin: '0' }}>"{r.review_text || "No text"}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSections.has("responses") && reportData.metrics.publishedReviews.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '4px', borderBottom: '1px solid #d1d5db', textAlign: 'center', pageBreakInside: 'avoid' }}>Response Log</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', tableLayout: 'fixed', pageBreakInside: 'avoid' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4f46e5', color: '#ffffff', pageBreakInside: 'avoid' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db', width: '25%' }}>Author</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db', width: '15%' }}>Rating</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #d1d5db', width: '60%' }}>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.metrics.publishedReviews.slice(0, 10).map((r, i) => (
                    <tr key={r.id || i} style={{ backgroundColor: i % 2 !== 0 ? '#f9fafb' : 'transparent', pageBreakInside: 'avoid' }}>
                      <td style={{ padding: '8px', verticalAlign: 'top', border: '1px solid #d1d5db' }}>{r.author_name || "Anonymous"}</td>
                      <td style={{ padding: '8px', verticalAlign: 'top', color: '#eab308', border: '1px solid #d1d5db' }}>{"★".repeat(r.rating || 0)}</td>
                      <td style={{ padding: '8px', verticalAlign: 'top', color: '#374151', fontSize: '12px', whiteSpace: 'pre-wrap', border: '1px solid #d1d5db' }}>
                        {(r.published_response || "").substring(0, 150)}{r.published_response && r.published_response.length > 150 ? "..." : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* UI Selection */}
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
