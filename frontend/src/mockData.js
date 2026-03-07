// Deterministic mock data used when the backend is unreachable

function dateOffset(days) {
  const d = new Date('2026-03-07T12:00:00')
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const MOCK_ANALYTICS = {
  total_responses: 47,
  avg_csat_score: 7.8,
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
  recent_responses: [
    {
      id: 1,
      csat_score: 9.2,
      sentiment: 'positive',
      themes: ['Support Staff', 'Product Quality', 'Onboarding'],
      summary:
        'The customer was highly satisfied with the onboarding process and praised the support team\'s quick response times. Product quality was noted as a strong differentiator from competitors.',
      created_at: dateOffset(0),
    },
    {
      id: 2,
      csat_score: 8.5,
      sentiment: 'positive',
      themes: ['Features', 'Reliability', 'UI/UX'],
      summary:
        'Strong satisfaction around the feature set and platform reliability. The UI was described as intuitive once the initial learning curve was overcome.',
      created_at: dateOffset(1),
    },
    {
      id: 3,
      csat_score: 6.1,
      sentiment: 'neutral',
      themes: ['Pricing', 'Documentation'],
      summary:
        'The respondent found the product adequate but felt the pricing lacked transparency for enterprise tiers. Documentation could be expanded with more real-world examples.',
      created_at: dateOffset(2),
    },
    {
      id: 4,
      csat_score: 9.7,
      sentiment: 'positive',
      themes: ['Support Staff', 'Response Time'],
      summary:
        'Exceptional praise for the support team who resolved an urgent issue within the hour. Response times across channels were highlighted as best-in-class.',
      created_at: dateOffset(3),
    },
    {
      id: 5,
      csat_score: 4.3,
      sentiment: 'negative',
      themes: ['Integration', 'Documentation', 'Response Time'],
      summary:
        'The customer struggled with the integration setup due to sparse documentation. Support response times during the incident were slower than expected.',
      created_at: dateOffset(4),
    },
    {
      id: 6,
      csat_score: 8.0,
      sentiment: 'positive',
      themes: ['Product Quality', 'Features'],
      summary:
        'Overall very happy with the product quality and breadth of features. A few minor feature requests were noted for future consideration.',
      created_at: dateOffset(5),
    },
    {
      id: 7,
      csat_score: 7.4,
      sentiment: 'positive',
      themes: ['Onboarding', 'Support Staff'],
      summary:
        'Onboarding was smooth and the support staff were patient and knowledgeable. The customer is likely to renew at the next billing cycle.',
      created_at: dateOffset(6),
    },
    {
      id: 8,
      csat_score: 5.8,
      sentiment: 'neutral',
      themes: ['Pricing', 'UI/UX'],
      summary:
        'Mixed feelings about value for money relative to the UI polish. The customer acknowledged the core functionality is solid but expects UI improvements.',
      created_at: dateOffset(7),
    },
    {
      id: 9,
      csat_score: 9.0,
      sentiment: 'positive',
      themes: ['Reliability', 'Product Quality'],
      summary:
        'The customer highlighted zero downtime over six months and consistently high product quality. Would strongly recommend to peers in their industry.',
      created_at: dateOffset(8),
    },
    {
      id: 10,
      csat_score: 6.6,
      sentiment: 'neutral',
      themes: ['Features', 'Integration'],
      summary:
        'Feature parity with competitors is improving. Integration with their existing CRM required custom work, which the team is hoping will be native in a future release.',
      created_at: dateOffset(9),
    },
  ],
}

// 30-day CSAT trend (mock)
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
    client_name: 'Priya Sharma',
    company: 'Meridian Labs',
    email: 'priya@meridian.ai',
    status: 'active',
    created_at: dateOffset(2),
    survey_link: '/survey/demo-survey-003',
    response_count: 9,
  },
]
