/**
 * getMockReviews — 28 seeded reviews for testing and analytics.
 *
 * Covers:
 *   Ratings   : all 1–5 ★
 *   Languages : English, Hindi (Devanagari), Hinglish
 *   Tones     : glowing, loyal, surprised, neutral, disappointed, angry, sarcastic
 *   Statuses  : responded (10), draft (4), ignored (1), new (13)
 *   Dates     : spread across the last 6 months for the monthly-volume chart
 */

type ReviewInsert = {
  business_id:        string;
  platform:           string;
  external_id:        string;
  author_name:        string | null;
  rating:             number;
  review_text:        string | null;
  review_date:        string;
  status:             "new" | "draft" | "responded" | "ignored";
  draft_response?:    string | null;
  published_response?: string | null;
  published_at?:      string | null;
};

export function getMockReviews(businessId: string): ReviewInsert[] {
  const dAgo = (n: number) =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  return [
    // ── November 2025 ────────────────────────────────────────────────────────

    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r01",
      author_name:        "Priya Sharma",
      rating:             5,
      review_text:        "Absolutely love this place! The service was exceptional and the staff went above and beyond. Will definitely be coming back and recommending to everyone I know.",
      review_date:        dAgo(180),
      status:             "responded",
      published_response: "Thank you so much, Priya! We're thrilled you had such a wonderful experience. Your kind words mean the world to our team. We look forward to welcoming you back soon!",
      published_at:       dAgo(178),
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r02",
      author_name:        "Rajesh Kumar",
      rating:             5,
      review_text:        "बहुत अच्छी सेवा! स्टाफ बहुत helpful और friendly था। सब कुछ बेहतरीन था। जरूर दोबारा आऊंगा।",
      review_date:        dAgo(175),
      status:             "responded",
      published_response: "बहुत बहुत धन्यवाद, Rajesh जी! आपके शब्दों से हमें बहुत खुशी हुई। हम आपका फिर से स्वागत करने के लिए तत्पर हैं!",
      published_at:       dAgo(173),
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r03",
      author_name:        "Robert Mitchell",
      rating:             1,
      review_text:        "Terrible experience from start to finish. Waited 45 minutes with no update, service was rushed and careless, and nobody apologised. Completely unacceptable. Avoid this place.",
      review_date:        dAgo(165),
      status:             "responded",
      published_response: "Hi Robert, we sincerely apologise for the experience you had. This is not the standard we hold ourselves to. We'd love the opportunity to make this right — please reach out to us directly. Thank you for letting us know.",
      published_at:       dAgo(163),
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r04",
      author_name:        "Anjali Mehta",
      rating:             4,
      review_text:        "Really good overall. Very professional and quality was great. Only minor thing was the wait time was a bit longer than expected, but worth it in the end.",
      review_date:        dAgo(160),
      status:             "responded",
      published_response: "Thank you, Anjali! We're glad you had a great experience overall. We appreciate your patience and we're continuously working to improve efficiency. See you next time!",
      published_at:       dAgo(158),
    },

    // ── December 2025 ────────────────────────────────────────────────────────

    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r05",
      author_name:        "Arjun Malhotra",
      rating:             5,
      review_text:        "Yaar, bahut mast jagah hai! Service ekdum first class thi. Staff bhi bahut helpful tha. Definitely recommend karunga apne dosto ko. 10/10!",
      review_date:        dAgo(150),
      status:             "responded",
      published_response: "Thank you so much, Arjun! We're so happy you loved your experience. Your recommendation means everything to us. See you and your friends soon!",
      published_at:       dAgo(148),
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r06",
      author_name:        "Sarah Williams",
      rating:             2,
      review_text:        "Quite disappointing. Expected much better based on the reviews online. Service was slow and staff seemed disinterested. The quality didn't justify the price at all.",
      review_date:        dAgo(145),
      status:             "responded",
      published_response: "Hi Sarah, we're sorry to hear your visit didn't meet expectations. Your feedback is important and we've shared it with our team. We'd love a chance to turn this around — please come back and give us another opportunity.",
      published_at:       dAgo(143),
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r07",
      author_name:        "David Chen",
      rating:             3,
      review_text:        "It was okay. Nothing particularly amazing or terrible. Service was decent, place was clean. Average experience overall. Might try again sometime.",
      review_date:        dAgo(140),
      status:             "responded",
      published_response: "Thank you for visiting, David! We appreciate your honest feedback. We're always working to go above 'average' — hope to impress you more on your next visit!",
      published_at:       dAgo(138),
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r08",
      author_name:        "Patricia O'Brien",
      rating:             5,
      review_text:        "Been coming here for over 3 years and it just keeps getting better. Always consistent, always professional. My whole family loves this place. You've earned a lifelong customer!",
      review_date:        dAgo(130),
      status:             "responded",
      published_response: "Patricia, thank you for your incredible loyalty over the years! Customers like you are why we do what we do. We look forward to many more years serving you and your family!",
      published_at:       dAgo(128),
    },

    // ── January 2026 ─────────────────────────────────────────────────────────

    {
      // Sarcastic 1-star — left ignored intentionally
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r09",
      author_name:        "Tyler Brooks",
      rating:             1,
      review_text:        "Oh wow, absolutely FANTASTIC service! Waited an hour, food arrived cold, staff shrugged when I complained. 10/10 would NOT recommend. Save your money and go literally anywhere else.",
      review_date:        dAgo(120),
      status:             "ignored",
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r10",
      author_name:        "Sunita Desai",
      rating:             5,
      review_text:        "शानदार अनुभव! सब कुछ बेहतरीन था — सर्विस, क्वालिटी, staff का behaviour। पैसे बिल्कुल वसूल हो गए। हर बार आना अच्छा लगता है।",
      review_date:        dAgo(115),
      status:             "responded",
      published_response: "सुनीता जी, आपका बहुत-बहुत शुक्रिया! आपकी तारीफ सुनकर हमारी पूरी team को बहुत अच्छा लगा। जल्द ही फिर से मिलते हैं!",
      published_at:       dAgo(113),
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r11",
      author_name:        "Sneha Patil",
      rating:             4,
      review_text:        "Overall accha experience tha. Staff friendly tha aur service bhi theek thi. Bas thodi si waiting thi but end mein worth it laga.",
      review_date:        dAgo(110),
      status:             "responded",
      published_response: "Thank you, Sneha! We're glad you had a good experience overall. We're working on reducing wait times and hope to make your next visit even smoother!",
      published_at:       dAgo(108),
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r12",
      author_name:        "Mark Henderson",
      rating:             2,
      review_text:        "Staff were rude and dismissive when I had a question. Felt unwelcome the entire time. For the prices they charge, basic courtesy should be a minimum. Very disappointed.",
      review_date:        dAgo(105),
      status:             "draft",
      draft_response:     "Hi Mark, we're truly sorry to hear about your experience. Rudeness from our team is never acceptable, and we sincerely apologise for making you feel unwelcome. We've taken this feedback to our team and are addressing it directly.",
    },

    // ── February 2026 ────────────────────────────────────────────────────────

    {
      // Surprised positive — low expectations exceeded
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r13",
      author_name:        "Chris Anderson",
      rating:             5,
      review_text:        "Wasn't expecting much based on the location, but WOW — completely blew me away! The quality, the service, the attention to detail. Genuinely one of the best experiences I've had.",
      review_date:        dAgo(90),
      status:             "draft",
      draft_response:     "Thank you so much, Chris! We absolutely love hearing that we exceeded your expectations — that's what we strive for every day! We hope to see you again soon.",
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r14",
      author_name:        "Kavya Nair",
      rating:             3,
      review_text:        "ठीक-ठाक अनुभव था। न बहुत अच्छा न बहुत बुरा। Service average थी, थोड़ी improvement की जरूरत है। अगली बार देखते हैं।",
      review_date:        dAgo(85),
      status:             "new",
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r15",
      author_name:        "Amanda Foster",
      rating:             1,
      review_text:        "Absolutely the worst experience I've ever had. Complete waste of money and time. They have no respect for customers whatsoever. Will be telling everyone I know to stay far away.",
      review_date:        dAgo(80),
      status:             "draft",
      draft_response:     "Hi Amanda, we are deeply sorry to read this. Your experience clearly fell far below any acceptable standard. We'd really appreciate the chance to speak with you directly to understand what went wrong and make it right.",
    },

    // ── March 2026 ───────────────────────────────────────────────────────────

    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r16",
      author_name:        "Emma Roberts",
      rating:             4,
      review_text:        "Good service and friendly staff. The quality was solid and consistent. Small parking issue outside but that's not really their fault. Would come back.",
      review_date:        dAgo(70),
      status:             "new",
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r17",
      author_name:        "George Harrison",
      rating:             5,
      review_text:        "Always consistent, always excellent. I've recommended this place to so many people and nobody has ever been disappointed. Thank you for the consistently high standards!",
      review_date:        dAgo(60),
      status:             "new",
    },
    {
      // Loyal customer noticing decline
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r18",
      author_name:        "Nancy Thompson",
      rating:             2,
      review_text:        "Used to absolutely love this place but something has changed recently. Quality has noticeably gone down over the last few months. Really sad because I was a regular customer.",
      review_date:        dAgo(55),
      status:             "draft",
      draft_response:     "Hi Nancy, we're truly sorry to hear this — especially from a loyal regular customer. Your observation is valuable and we take it very seriously. We'd love to speak with you directly so we can work on winning back your trust.",
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r19",
      author_name:        "Vikram Singh",
      rating:             5,
      review_text:        "Bhai kya baat hai! Sach mein zabardast experience tha. Yahan ki service ne toh dil jeet liya. Apne saare dosto ko bolunga. Ek baar zaroor aao!",
      review_date:        dAgo(50),
      status:             "new",
    },
    {
      // Sarcastic angry 1-star
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r20",
      author_name:        "Karen Mitchell",
      rating:             1,
      review_text:        "Absolutely STELLAR service if you enjoy being completely ignored by staff, waiting forever, and then being charged full price for a half-done job. What a joke.",
      review_date:        dAgo(45),
      status:             "new",
    },

    // ── April 2026 ───────────────────────────────────────────────────────────

    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r21",
      author_name:        "James Wilson",
      rating:             4,
      review_text:        "Pleasant experience. Staff were helpful and service met expectations. There are small things that could be polished but overall a solid visit. Will return.",
      review_date:        dAgo(30),
      status:             "new",
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r22",
      author_name:        "Pooja Sharma",
      rating:             3,
      review_text:        "Theek tha yaar, kuch khaas nahi tha. Service average level ki thi. Na bahut bura na bahut accha. Prices thodi zyada lag rahi thi value ke hisaab se.",
      review_date:        dAgo(25),
      status:             "new",
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r23",
      author_name:        "Mohit Verma",
      rating:             2,
      review_text:        "Bahut bura anubhav raha. Staff ka behaviour theek nahi tha aur service mein bahut der lagi. Is price mein itni kharab quality bilkul accept nahi hai. Dobara nahi aaunga.",
      review_date:        dAgo(20),
      status:             "new",
    },
    {
      // Very short positive
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r24",
      author_name:        "Sam Kapoor",
      rating:             5,
      review_text:        "Perfect. 5 stars. No notes.",
      review_date:        dAgo(15),
      status:             "new",
    },

    // ── May 2026 ─────────────────────────────────────────────────────────────

    {
      // Very short angry 1-star
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r25",
      author_name:        "Anonymous",
      rating:             1,
      review_text:        "Awful.",
      review_date:        dAgo(10),
      status:             "new",
    },
    {
      // Rating only — no text
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r26",
      author_name:        "Tom Benson",
      rating:             4,
      review_text:        null,
      review_date:        dAgo(7),
      status:             "new",
    },
    {
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r27",
      author_name:        "Lisa Fernandes",
      rating:             5,
      review_text:        "Outstanding as always. Consistent quality and genuinely friendly staff. Exactly what you want from a local business.",
      review_date:        dAgo(4),
      status:             "new",
    },
    {
      // Hinglish disappointed
      business_id:        businessId,
      platform:           "google",
      external_id:        "mock_r28",
      author_name:        "Rahul Gupta",
      rating:             2,
      review_text:        "Yaar thoda disappointment hua. Itni fees ke liye ye service? Suna bahut tha par experience acha nahi raha. Expected much better honestly.",
      review_date:        dAgo(2),
      status:             "new",
    },
  ];
}
