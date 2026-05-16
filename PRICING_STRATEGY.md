# ReviewResponder: Credit-Based Pricing Strategy for Maximum Profit

## Current State Analysis
- **Current Pricing**: Free (Starter), $29/mo (Pro), $79/mo (Agency)
- **Current Limits**: 1 location (Free), Unlimited reviews (Pro/Agency), 3 competitors (Free tier)
- **Features**: Review monitoring, AI responses, Deep Analysis, Reputation Scorecard

---

## Recommended Credit-Based Pricing Model

### Why Credits?
1. **Predictable Revenue**: Users buy credits upfront → guaranteed revenue
2. **Upsell Opportunities**: Users run out of credits → buy more
3. **Usage-Based**: Heavy users pay more (fair pricing)
4. **Flexibility**: Different features consume different credits
5. **Psychological**: Credits feel less expensive than monthly fees

---

## Credit Tiers & Pricing

### Tier 1: Starter (Free)
- **Monthly Credits**: 100 credits
- **Price**: FREE
- **Renewal**: Monthly auto-refill
- **Use Case**: Small businesses, testing

**What 100 credits gets:**
- 10 reviews fetched (1 credit = 10 reviews)
- 1 location added
- 1 deep analysis run
- 5 competitor comparisons

---

### Tier 2: Growth ($19/month)
- **Monthly Credits**: 500 credits
- **Price**: $19/month (₹299 India)
- **Renewal**: Monthly auto-refill
- **Bonus**: 50 bonus credits on signup
- **Use Case**: Active small businesses

**What 500 credits gets:**
- 50 reviews fetched
- 5 locations added
- 5 deep analysis runs
- 25 competitor comparisons

---

### Tier 3: Professional ($49/month)
- **Monthly Credits**: 1,500 credits
- **Price**: $49/month (₹799 India)
- **Renewal**: Monthly auto-refill
- **Bonus**: 200 bonus credits on signup
- **Use Case**: Growing businesses, agencies

**What 1,500 credits gets:**
- 150 reviews fetched
- 15 locations added
- 15 deep analysis runs
- 75 competitor comparisons

---

### Tier 4: Enterprise ($99/month)
- **Monthly Credits**: 5,000 credits
- **Price**: $99/month (₹1,999 India)
- **Renewal**: Monthly auto-refill
- **Bonus**: 500 bonus credits on signup
- **Use Case**: Large agencies, multi-location businesses

**What 5,000 credits gets:**
- 500 reviews fetched
- 50 locations added
- 50 deep analysis runs
- 250 competitor comparisons

---

## Credit Consumption Breakdown

### Review Operations
| Operation | Credits | Notes |
|-----------|---------|-------|
| Fetch 10 reviews | 1 credit | From Apify (competitor or own business) |
| Fetch 50 reviews | 5 credits | Bulk fetch discount |
| Fetch 100 reviews | 8 credits | Better rate |
| Fetch 500 reviews | 35 credits | Best rate |

### Location Management
| Operation | Credits | Notes |
|-----------|---------|-------|
| Add location | 1 credit | One-time per location |
| Edit location URL | 0 credits | Free (no API call) |
| Remove location | 0 credits | Free |

### Deep Analysis
| Operation | Credits | Notes |
|-----------|---------|-------|
| Run full analysis | 1 credit | Includes all AI insights |
| Re-run analysis | 1 credit | Same cost |
| Export report (PDF/Word) | 1 credit | Includes all sections |

### Competitor Tracking
| Operation | Credits | Notes |
|-----------|---------|-------|
| Add competitor | 2 credits | Includes initial 50 reviews |
| Fetch 50 reviews | 1 credit | Sync/refresh |
| Fetch 100 reviews | 2 credits | Larger sync |
| Head-to-head comparison | 0 credits | Free (uses cached data) |

### AI Features
| Operation | Credits | Notes |
|-----------|---------|-------|
| Generate response | 0 credits | Free (included) |
| Bulk generate responses | 0 credits | Free (included) |
| Sentiment analysis | 0 credits | Free (included) |

---

## Profit Maximization Strategy

### 1. **Freemium Model with Conversion Funnel**
```
Free Tier (100 credits/month)
    ↓ (User hits limit after ~2 weeks)
Growth Tier ($19/month)
    ↓ (User grows business)
Professional Tier ($49/month)
    ↓ (User manages multiple locations)
Enterprise Tier ($99/month)
```

**Expected Conversion**: 5-10% of free users → paid

### 2. **Overage Credits (Pay-as-you-go)**
- Users can buy additional credits anytime
- **Pricing**:
  - 100 credits = $5 (₹99)
  - 500 credits = $20 (₹399) — 20% discount
  - 1,000 credits = $35 (₹699) — 30% discount
  - 5,000 credits = $150 (₹2,999) — 40% discount

**Why this works**: Users who run out mid-month will buy overages at premium rates

### 3. **Annual Billing Discount**
- Pay annually → 20% discount
- Starter: $228/year (save $48)
- Growth: $228/year (save $48)
- Professional: $588/year (save $132)
- Enterprise: $1,188/year (save $252)

**Why this works**: Locks in annual revenue, reduces churn

### 4. **Feature Gating by Tier**

| Feature | Free | Growth | Pro | Enterprise |
|---------|------|--------|-----|------------|
| Review monitoring | ✓ | ✓ | ✓ | ✓ |
| AI responses | ✓ | ✓ | ✓ | ✓ |
| Deep Analysis | ✓ (1x/mo) | ✓ (5x/mo) | ✓ (15x/mo) | ✓ (50x/mo) |
| Competitor tracking | ✓ (1) | ✓ (3) | ✓ (10) | ✓ (50) |
| Export reports | ✗ | ✓ | ✓ | ✓ |
| API access | ✗ | ✗ | ✓ | ✓ |
| Priority support | ✗ | ✗ | ✓ | ✓ |
| Custom integrations | ✗ | ✗ | ✗ | ✓ |

### 5. **Seasonal Promotions**
- **Q4 (Oct-Dec)**: "Holiday Rush" — 30% off annual plans
- **Q1 (Jan-Mar)**: "New Year Resolution" — Free month with annual
- **Black Friday**: 40% off first year

---

## Deep Analysis Page: Credit Usage Strategy

### Current Deep Analysis Features
1. Location summary
2. Category-based analysis
3. Sentiment breakdown
4. Top 3 positive reviews
5. Professional visualizations

### Proposed Credit Model for Deep Analysis

**Option A: All-in-One (Recommended)**
- Run full analysis = 1 credit
- Includes all 5 features above
- Re-run anytime (same cost)
- Export as PDF/Word = +1 credit

**Option B: À la Carte (Advanced)**
- Location summary = 0.2 credits
- Category analysis = 0.3 credits
- Sentiment breakdown = 0.2 credits
- Top reviews extraction = 0.2 credits
- Visualizations = 0.1 credits
- **Total**: 1 credit (same as all-in-one)

**Recommendation**: Use Option A (simpler, clearer)

### Deep Analysis Upsell Opportunities

1. **"Deeper Insights" Button**
   - Current: Basic analysis (1 credit)
   - Premium: Add competitor comparison (2 credits total)
   - Premium: Add trend analysis (3 credits total)

2. **"Export & Share" Feature**
   - Export as PDF = 1 credit
   - Export as Word = 1 credit
   - Share via link = 0 credits
   - Schedule weekly reports = 2 credits/month

3. **"AI Recommendations" Add-on**
   - Get AI-generated action items = 1 credit
   - Get competitor benchmarking = 2 credits
   - Get response strategy = 1 credit

---

## Implementation Roadmap

### Phase 1: Core Credit System (Week 1-2)
- [ ] Create `user_credits` table
- [ ] Create `credit_transactions` table (audit log)
- [ ] Implement credit deduction logic
- [ ] Add credit display in sidebar
- [ ] Create "Buy Credits" modal

### Phase 2: Tier Management (Week 2-3)
- [ ] Create `subscription_tiers` table
- [ ] Implement tier selection flow
- [ ] Add monthly credit refill logic
- [ ] Create billing integration (Stripe)

### Phase 3: Feature Gating (Week 3-4)
- [ ] Gate features by tier
- [ ] Show "Upgrade to unlock" messages
- [ ] Implement credit check before operations
- [ ] Add credit usage warnings

### Phase 4: Analytics & Optimization (Week 4+)
- [ ] Track credit consumption patterns
- [ ] Identify high-value features
- [ ] A/B test pricing
- [ ] Optimize conversion funnel

---

## Revenue Projections

### Conservative Scenario (5% conversion)
- 1,000 free users/month
- 50 convert to Growth ($19) = $950
- 10 convert to Pro ($49) = $490
- 2 convert to Enterprise ($99) = $198
- **Monthly**: $1,638
- **Annual**: $19,656

### Moderate Scenario (10% conversion)
- 1,000 free users/month
- 100 convert to Growth ($19) = $1,900
- 20 convert to Pro ($49) = $980
- 5 convert to Enterprise ($99) = $495
- **Monthly**: $3,375
- **Annual**: $40,500

### Optimistic Scenario (15% conversion + overages)
- 1,000 free users/month
- 150 convert to Growth ($19) = $2,850
- 30 convert to Pro ($49) = $1,470
- 10 convert to Enterprise ($99) = $990
- Overage credits (avg $50/user) = $500
- **Monthly**: $5,810
- **Annual**: $69,720

---

## Key Metrics to Track

1. **Conversion Rate**: Free → Paid
2. **Average Revenue Per User (ARPU)**
3. **Churn Rate**: % of users who cancel
4. **Credit Burn Rate**: Avg credits used per user/month
5. **Overage Revenue**: % of revenue from pay-as-you-go
6. **Lifetime Value (LTV)**: Total revenue per user

---

## Competitive Advantages

1. **Transparent Pricing**: No hidden fees
2. **Flexible Usage**: Pay only for what you use
3. **No Contracts**: Cancel anytime
4. **Generous Free Tier**: 100 credits/month is competitive
5. **Overage Option**: Users never get stuck

---

## Recommended Launch Strategy

1. **Week 1**: Announce credit system to existing users
2. **Week 2**: Migrate existing users to equivalent tier
3. **Week 3**: Launch new pricing page
4. **Week 4**: Run "Early Adopter" promotion (20% off first 3 months)
5. **Week 5+**: Monitor metrics and optimize

---

## Questions to Answer Before Launch

1. What's your cost per API call to Apify?
2. What's your cost per AI analysis (Gemini)?
3. What's your target profit margin? (50%, 70%, 80%?)
4. Do you want to offer annual discounts?
5. Should free tier have credit limits or feature limits?

