import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  TextRun,
} from "docx";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, sections, data } = await request.json();

    if (!businessId || !sections || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const sections_set = new Set(sections);
    const reportData = data;
    const docElements: any[] = [];

    // Header
    docElements.push(
      new Paragraph({
        text: "Review Report",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    docElements.push(
      new Paragraph({
        text: `Generated on ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        style: "Normal",
      })
    );

    // Business Overview
    if (sections_set.has("overview")) {
      docElements.push(
        new Paragraph({
          text: "Business Overview",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      docElements.push(
        new Paragraph({
          text: `Business: ${reportData.business.name}`,
          spacing: { after: 100 },
        })
      );

      docElements.push(
        new Paragraph({
          text: `Type: ${reportData.business.business_type || "Not specified"}`,
          spacing: { after: 200 },
        })
      );
    }

    // Key Metrics
    if (sections_set.has("metrics")) {
      docElements.push(
        new Paragraph({
          text: "Key Metrics",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const metricsRows = [
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Metric")] }),
            new TableCell({ children: [new Paragraph("Value")] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Total Reviews")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.total.toString())] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Average Rating")] }),
            new TableCell({ children: [new Paragraph(`${reportData.metrics.avgRating}★`)] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Response Rate")] }),
            new TableCell({ children: [new Paragraph(`${reportData.metrics.responseRate}%`)] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Last 30 Days")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.last30Count.toString())] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Needs Attention")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.needsAttention.toString())] }),
          ],
        }),
      ];

      docElements.push(
        new Table({
          rows: metricsRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // Rating Distribution
    if (sections_set.has("rating")) {
      docElements.push(
        new Paragraph({
          text: "Rating Distribution",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const ratingRows = [
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Rating")] }),
            new TableCell({ children: [new Paragraph("Count")] }),
            new TableCell({ children: [new Paragraph("Percentage")] }),
          ],
        }),
        ...reportData.metrics.ratingCounts.map(
          (r: any) =>
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph(`${"★".repeat(r.star)}`)] }),
                new TableCell({ children: [new Paragraph(r.count.toString())] }),
                new TableCell({
                  children: [
                    new Paragraph(
                      reportData.metrics.total > 0
                        ? `${Math.round((r.count / reportData.metrics.total) * 100)}%`
                        : "0%"
                    ),
                  ],
                }),
              ],
            })
        ),
      ];

      docElements.push(
        new Table({
          rows: ratingRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // Monthly Review Volume
    if (sections_set.has("monthly")) {
      docElements.push(
        new Paragraph({
          text: "Monthly Review Volume (Last 6 Months)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const monthlyRows = [
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Month")] }),
            new TableCell({ children: [new Paragraph("Count")] }),
            new TableCell({ children: [new Paragraph("Avg Rating")] }),
          ],
        }),
        ...reportData.metrics.monthlyData.map(
          (m: any) =>
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph(m.label)] }),
                new TableCell({ children: [new Paragraph(m.count.toString())] }),
                new TableCell({
                  children: [new Paragraph(m.avgRating > 0 ? m.avgRating.toFixed(1) : "—")],
                }),
              ],
            })
        ),
      ];

      docElements.push(
        new Table({
          rows: monthlyRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // Review Status Breakdown
    if (sections_set.has("status")) {
      docElements.push(
        new Paragraph({
          text: "Review Status Breakdown",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const statusRows = [
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Status")] }),
            new TableCell({ children: [new Paragraph("Count")] }),
          ],
        }),
        ...reportData.metrics.statusData.map(
          (s: any) =>
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph(s.label)] }),
                new TableCell({ children: [new Paragraph(s.count.toString())] }),
              ],
            })
        ),
      ];

      docElements.push(
        new Table({
          rows: statusRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // Sentiment Breakdown
    if (sections_set.has("sentiment")) {
      docElements.push(
        new Paragraph({
          text: "Sentiment Breakdown",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const sentimentRows = [
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Sentiment")] }),
            new TableCell({ children: [new Paragraph("Count")] }),
            new TableCell({ children: [new Paragraph("Percentage")] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Positive (4-5★)")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.sentPositive.toString())] }),
            new TableCell({
              children: [
                new Paragraph(
                  reportData.metrics.total > 0
                    ? `${Math.round((reportData.metrics.sentPositive / reportData.metrics.total) * 100)}%`
                    : "0%"
                ),
              ],
            }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Mixed (3★)")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.sentNeutral.toString())] }),
            new TableCell({
              children: [
                new Paragraph(
                  reportData.metrics.total > 0
                    ? `${Math.round((reportData.metrics.sentNeutral / reportData.metrics.total) * 100)}%`
                    : "0%"
                ),
              ],
            }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Negative (1-2★)")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.sentNegative.toString())] }),
            new TableCell({
              children: [
                new Paragraph(
                  reportData.metrics.total > 0
                    ? `${Math.round((reportData.metrics.sentNegative / reportData.metrics.total) * 100)}%`
                    : "0%"
                ),
              ],
            }),
          ],
        }),
      ];

      docElements.push(
        new Table({
          rows: sentimentRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // Language Distribution
    if (sections_set.has("language")) {
      docElements.push(
        new Paragraph({
          text: "Language Distribution",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const langRows = [
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Language")] }),
            new TableCell({ children: [new Paragraph("Count")] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("English")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.langCounts.english.toString())] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Hindi")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.langCounts.hindi.toString())] }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Hinglish")] }),
            new TableCell({ children: [new Paragraph(reportData.metrics.langCounts.hinglish.toString())] }),
          ],
        }),
      ];

      docElements.push(
        new Table({
          rows: langRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // AI Location Summary
    if (sections_set.has("summary") && reportData.analyses.summary) {
      docElements.push(
        new Paragraph({
          text: "AI Location Summary",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      docElements.push(
        new Paragraph({
          text: reportData.analyses.summary as string,
          spacing: { after: 200 },
        })
      );
    }

    // AI Category Analysis
    if (sections_set.has("category") && reportData.analyses.category) {
      docElements.push(
        new Paragraph({
          text: "AI Category Analysis",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const categoryData = reportData.analyses.category as any;
      if (categoryData.topics && Array.isArray(categoryData.topics)) {
        const topicsRows = [
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph("Topic")] }),
              new TableCell({ children: [new Paragraph("Sentiment")] }),
              new TableCell({ children: [new Paragraph("Mentions")] }),
            ],
          }),
          ...categoryData.topics.slice(0, 10).map(
            (t: any) =>
              new TableRow({
                cells: [
                  new TableCell({ children: [new Paragraph(t.topic)] }),
                  new TableCell({ children: [new Paragraph(t.sentiment)] }),
                  new TableCell({ children: [new Paragraph(t.mentions.toString())] }),
                ],
              })
          ),
        ];

        docElements.push(
          new Table({
            rows: topicsRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );

        docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      }
    }

    // AI Actionable Insights
    if (sections_set.has("insights") && reportData.analyses.insights) {
      docElements.push(
        new Paragraph({
          text: "AI Actionable Insights",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const insightsData = reportData.analyses.insights as any;
      if (Array.isArray(insightsData)) {
        insightsData.slice(0, 5).forEach((insight: any, idx: number) => {
          docElements.push(
            new Paragraph({
              text: `${idx + 1}. ${insight.insight}`,
              spacing: { after: 50 },
              style: "Normal",
            })
          );

          docElements.push(
            new Paragraph({
              text: `Impact: ${insight.impact}`,
              spacing: { after: 50 },
              style: "Normal",
            })
          );

          docElements.push(
            new Paragraph({
              text: `Action: ${insight.recommendation}`,
              spacing: { after: 150 },
              style: "Normal",
            })
          );
        });
      }
    }

    // AI Sentiment Insights
    if (sections_set.has("sentimentInsights") && reportData.analyses.sentiment) {
      docElements.push(
        new Paragraph({
          text: "AI Sentiment Insights",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const sentimentData = reportData.analyses.sentiment as any;
      ["positive", "mixed", "negative"].forEach((key) => {
        docElements.push(
          new Paragraph({
            text: `${key.charAt(0).toUpperCase() + key.slice(1)}:`,
            spacing: { after: 50 },
            style: "Normal",
          })
        );

        docElements.push(
          new Paragraph({
            text: sentimentData[key] || "No data",
            spacing: { after: 150 },
            style: "Normal",
          })
        );
      });
    }

    // Top Reviews
    if (sections_set.has("topReviews") && reportData.metrics.topReviews.length > 0) {
      docElements.push(
        new Paragraph({
          text: "Top Reviews",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      reportData.metrics.topReviews.slice(0, 5).forEach((review: any, idx: number) => {
        docElements.push(
          new Paragraph({
            text: `${idx + 1}. ${review.author_name || "Anonymous"} - ${"★".repeat(review.rating || 0)}`,
            spacing: { after: 50 },
            style: "Normal",
          })
        );

        docElements.push(
          new Paragraph({
            text: review.review_text || "(No text)",
            spacing: { after: 150 },
            style: "Normal",
          })
        );
      });
    }

    // Response Log
    if (sections_set.has("responses") && reportData.metrics.publishedReviews.length > 0) {
      docElements.push(
        new Paragraph({
          text: "Response Log",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      const responseRows = [
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph("Author")] }),
            new TableCell({ children: [new Paragraph("Rating")] }),
            new TableCell({ children: [new Paragraph("Response")] }),
          ],
        }),
        ...reportData.metrics.publishedReviews.slice(0, 10).map(
          (r: any) =>
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph(r.author_name || "Anonymous")] }),
                new TableCell({ children: [new Paragraph(`${r.rating}★`)] }),
                new TableCell({
                  children: [
                    new Paragraph((r.published_response || "").substring(0, 100) + "..."),
                  ],
                }),
              ],
            })
        ),
      ];

      docElements.push(
        new Table({
          rows: responseRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          children: docElements,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${reportData.business.name}-report.docx"`,
      },
    });
  } catch (err) {
    console.error("Word export error:", err);
    return NextResponse.json(
      { error: "Failed to generate Word document" },
      { status: 500 }
    );
  }
}
