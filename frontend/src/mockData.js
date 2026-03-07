// Deterministic mock data used when the backend is unreachable

function dateOffset(days) {
  const d = new Date('2026-03-07T12:00:00')
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const MOCK_ANALYTICS = {
  total_responses: 47,
  avg_score: 7.8,
  sentiment_breakdown: { positive: 28, neutral: 12, negative: 7 },
  top_themes: [
    { theme: 'Support Staff', count: 21 },
    { theme: 'Product Quality', count: 18 },
    { theme: 'Response Time', count: 15 },
    { theme: 'Onboarding', count: 13 },
    { theme: 'Pricing', count: 11 },
    { theme: 'Features', count: 9 },
    { theme: 'Reliability', count: 8 },
    { theme: 'UI/UX', count: 7 },
    { theme: 'Documentation', count: 5 },
    { theme: 'Integration', count: 4 },
  ],
  word_frequencies: {
    onboarding: 22, support: 19, quality: 16, reliable: 14, helpful: 13,
    features: 12, pricing: 10, documentation: 9, integration: 8, responsive: 15,
    smooth: 11, intuitive: 8, fast: 13, recommend: 17, easy: 12,
    complex: 6, improve: 9, excellent: 14, platform: 10, experience: 18,
  },
  recent_responses: [
    {
      id: 1,
      score: 9.2,
      score_context: 'overall satisfaction',
      sentiment: 'positive',
      themes: ['Support Staff', 'Product Quality', 'Onboarding'],
      summary: "The customer was highly satisfied with the onboarding process and praised the support team's quick response times. Product quality was noted as a strong differentiator from competitors.",
      key_insights: ['Onboarding was the standout positive', 'Support response speed exceeded expectations', 'Would actively recommend to peers'],
      word_frequencies: { onboarding: 5, support: 4, quality: 3, recommend: 4, fast: 3, smooth: 4, helpful: 3 },
      created_at: dateOffset(0),
    },
    {
      id: 2,
      score: 8.5,
      score_context: 'overall satisfaction',
      sentiment: 'positive',
      themes: ['Features', 'Reliability', 'UI/UX'],
      summary: 'Strong satisfaction around the feature set and platform reliability. The UI was described as intuitive once the initial learning curve was overcome.',
      key_insights: ['Feature breadth is a key selling point', 'Reliability has been consistent over time', 'Initial UI learning curve should be addressed'],
      word_frequencies: { features: 5, reliable: 4, intuitive: 3, platform: 3, learning: 2, consistent: 4, breadth: 3 },
      created_at: dateOffset(1),
    },
    {
      id: 3,
      score: 6.1,
      score_context: 'overall value',
      sentiment: 'neutral',
      themes: ['Pricing', 'Documentation'],
      summary: 'The respondent found the product adequate but felt the pricing lacked transparency for enterprise tiers. Documentation could be expanded with more real-world examples.',
      key_insights: ['Enterprise pricing tiers are confusing', 'Documentation lacks practical examples', 'Core functionality meets needs but expectations are higher'],
      word_frequencies: { pricing: 4, documentation: 3, transparency: 3, enterprise: 3, examples: 3, adequate: 2, confusing: 2 },
      created_at: dateOffset(2),
    },
    {
      id: 4,
      score: 9.7,
      score_context: 'support experience',
      sentiment: 'positive',
      themes: ['Support Staff', 'Response Time'],
      summary: 'Exceptional praise for the support team who resolved an urgent issue within the hour. Response times across channels were highlighted as best-in-class.',
      key_insights: ['Urgent issue resolved in under an hour', 'Multi-channel response times are best-in-class', 'Support team is technically knowledgeable'],
      word_frequencies: { support: 5, response: 5, urgent: 3, resolved: 4, excellent: 4, knowledgeable: 3, fast: 4 },
      created_at: dateOffset(3),
    },
    {
      id: 5,
      score: 4.3,
      score_context: 'setup experience',
      sentiment: 'negative',
      themes: ['Integration', 'Documentation', 'Response Time'],
      summary: 'The customer struggled with the integration setup due to sparse documentation. Support response times during the incident were slower than expected.',
      key_insights: ['Integration docs are insufficient for complex setups', 'Support SLA was not met during incident', 'Clearer setup guides would prevent frustration'],
      word_frequencies: { integration: 4, documentation: 3, slow: 3, setup: 4, frustrating: 3, sparse: 3, incident: 2 },
      created_at: dateOffset(4),
    },
    {
      id: 6,
      score: 8.0,
      score_context: 'overall satisfaction',
      sentiment: 'positive',
      themes: ['Product Quality', 'Features'],
      summary: 'Overall very happy with the product quality and breadth of features. A few minor feature requests were noted for future consideration.',
      key_insights: ['Product quality is consistently high', 'Feature requests: bulk export and API webhooks', 'Customer is planning to expand usage'],
      word_frequencies: { quality: 4, features: 4, expand: 3, happy: 3, export: 2, webhooks: 2, consistent: 3 },
      created_at: dateOffset(5),
    },
    {
      id: 7,
      score: 7.4,
      score_context: 'overall satisfaction',
      sentiment: 'positive',
      themes: ['Onboarding', 'Support Staff'],
      summary: 'Onboarding was smooth and the support staff were patient and knowledgeable. The customer is likely to renew at the next billing cycle.',
      key_insights: ['Onboarding flow needs no changes', 'Support patience with non-technical users is valued', 'Renewal is highly likely'],
      word_frequencies: { onboarding: 4, support: 4, patient: 3, smooth: 4, renewal: 3, knowledgeable: 3, helpful: 4 },
      created_at: dateOffset(6),
    },
    {
      id: 8,
      score: 5.8,
      score_context: 'value for money',
      sentiment: 'neutral',
      themes: ['Pricing', 'UI/UX'],
      summary: 'Mixed feelings about value for money relative to the UI polish. The customer acknowledged the core functionality is solid but expects UI improvements.',
      key_insights: ['Pricing feels high relative to UI maturity', 'Core functionality is solid', 'UI improvements would justify current pricing'],
      word_frequencies: { pricing: 3, ui: 4, polish: 3, value: 3, mixed: 2, solid: 3, improvements: 3 },
      created_at: dateOffset(7),
    },
    {
      id: 9,
      score: 9.0,
      score_context: 'overall satisfaction',
      sentiment: 'positive',
      themes: ['Reliability', 'Product Quality'],
      summary: 'The customer highlighted zero downtime over six months and consistently high product quality. Would strongly recommend to peers in their industry.',
      key_insights: ['Zero downtime in six months is a competitive advantage', 'Quality consistency builds trust', 'Strong NPS signal from this customer'],
      word_frequencies: { reliability: 5, quality: 4, downtime: 3, consistent: 4, recommend: 4, trust: 3, excellent: 4 },
      created_at: dateOffset(8),
    },
    {
      id: 10,
      score: 6.6,
      score_context: 'overall satisfaction',
      sentiment: 'neutral',
      themes: ['Features', 'Integration'],
      summary: 'Feature parity with competitors is improving. Integration with their existing CRM required custom work, which the team is hoping will be native in a future release.',
      key_insights: ['CRM integration should be a native connector', 'Feature gap vs competitors is closing', 'Custom integration work was unexpected cost'],
      word_frequencies: { integration: 4, features: 3, crm: 4, custom: 3, native: 3, competitor: 2, improving: 3 },
      created_at: dateOffset(9),
    },
  ],
}

// 30-day score trend (mock)
export const MOCK_TREND = (() => {
  const seed = [8.1, 7.9, 8.4, 7.6, 8.0, 7.5, 8.2, 8.7, 7.8, 8.3,
                7.4, 8.1, 8.5, 7.9, 8.0, 7.7, 8.3, 8.6, 7.5, 8.1,
                8.4, 7.8, 8.0, 8.2, 7.9, 8.5, 7.6, 8.3, 7.8, 8.1]
  return seed.map((score, i) => {
    const d = new Date('2026-03-07')
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score,
    }
  })
})()

export const MOCK_SURVEYS = [
  {
    id: 1,
    uuid: 'demo-survey-001',
    title: 'Q1 Onboarding Feedback',
    description: 'Collecting feedback from new customers after their first 30 days.',
    client_name: 'Sarah Mitchell',
    company: 'Acme Corp',
    email: 'sarah@acme.com',
    status: 'active',
    created_at: dateOffset(14),
    survey_link: '/survey/demo-survey-001',
    response_count: 23,
  },
  {
    id: 2,
    uuid: 'demo-survey-002',
    title: 'Product NPS - March 2026',
    description: 'Monthly NPS pulse survey for active subscribers.',
    client_name: 'James Caldwell',
    company: 'NovaTech Solutions',
    email: 'james@novatech.io',
    status: 'active',
    created_at: dateOffset(7),
    survey_link: '/survey/demo-survey-002',
    response_count: 15,
  },
  {
    id: 3,
    uuid: 'demo-survey-003',
    title: 'Support Experience Check',
    description: 'Post-ticket survey to measure support satisfaction.',
    client_name: 'Priya Sharma',
    company: 'Meridian Labs',
    email: 'priya@meridian.ai',
    status: 'active',
    created_at: dateOffset(2),
    survey_link: '/survey/demo-survey-003',
    response_count: 9,
  },
]

export const MOCK_SURVEY_ANALYTICS = {
  survey_id: 'demo-survey-001',
  survey_title: 'Q1 Onboarding Feedback',
  survey_description: 'Collecting feedback from new customers after their first 30 days.',
  total_responses: 6,
  avg_score: 7.9,
  sentiment_breakdown: { positive: 4, neutral: 1, negative: 1 },
  top_themes: [
    { theme: 'Onboarding', count: 5 },
    { theme: 'Support Staff', count: 4 },
    { theme: 'Documentation', count: 3 },
    { theme: 'Setup Experience', count: 3 },
    { theme: 'UI/UX', count: 2 },
  ],
  word_frequencies: {
    onboarding: 18, setup: 14, support: 12, smooth: 10, helpful: 9,
    documentation: 8, intuitive: 7, fast: 9, easy: 11, confusing: 5,
    guidance: 6, welcome: 4, tooltips: 6, videos: 5, advanced: 7,
    simple: 8, options: 9, overwhelming: 6, quick: 8, clear: 7,
  },
  responses: MOCK_ANALYTICS.recent_responses.slice(0, 6),
}
