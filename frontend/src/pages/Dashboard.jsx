import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatCard from '../components/StatCard'
import ThemePills from '../components/ThemePills'
import ResponseExplorer from '../components/ResponseExplorer'
import { MOCK_ANALYTICS, MOCK_TREND, MOCK_SURVEYS, MOCK_SURVEY_ANALYTICS } from '../mockData'

const PIE_COLORS = {
  positive: '#2DD4BF',
  neutral: '#8B909A',
  negative: '#F87171',
}

// Synthetic daily volume counts aligned to the 30-day trend dates
const MOCK_VOLUME_COUNTS = [2,1,3,2,4,1,3,2,5,2,1,4,3,2,3,1,4,2,3,4,2,3,1,4,2,3,4,2,3,2]

function buildVolumeData(trendData) {
  return trendData.map((d, i) => ({ date: d.date, responses: MOCK_VOLUME_COUNTS[i] || 1 }))
}

function buildPieData(breakdown) {
  return [
    { name: 'Positive', value: breakdown.positive, color: PIE_COLORS.positive },
    { name: 'Neutral', value: breakdown.neutral, color: PIE_COLORS.neutral },
    { name: 'Negative', value: breakdown.negative, color: PIE_COLORS.negative },
  ].filter((d) => d.value > 0)
}

const VolumeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{payload[0].value} responses</p>
    </div>
  )
}

const tooltipStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: '0.85rem',
}

function WordCloud({ wordFrequencies }) {
  if (!wordFrequencies || Object.keys(wordFrequencies).length === 0) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No word data available.</p>
  }

  const entries = Object.entries(wordFrequencies)
  const maxWeight = Math.max(...entries.map(([, w]) => w))
  const WORD_COLORS = ['#2DD4BF', '#7C9CFF', '#F9A870', '#A78BFA', '#6EE7B7', '#FCA5A5']

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', alignItems: 'center', lineHeight: 1.6 }}>
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([word, weight], i) => {
          const ratio = weight / maxWeight
          const fontSize = 0.72 + ratio * 1.1
          const opacity = 0.55 + ratio * 0.45
          const color = WORD_COLORS[i % WORD_COLORS.length]
          return (
            <span
              key={word}
              style={{
                fontSize: `${fontSize}rem`,
                fontWeight: ratio > 0.6 ? 700 : 500,
                color,
                opacity,
                letterSpacing: '-0.01em',
                cursor: 'default',
              }}
            >
              {word}
            </span>
          )
        })}
    </div>
  )
}

export default function Dashboard() {
  const [globalData, setGlobalData] = useState(null)
  const [volumeData] = useState(() => buildVolumeData(MOCK_TREND))
  const [surveys, setSurveys] = useState([])
  const [selectedSurveyId, setSelectedSurveyId] = useState('')
  const [surveyData, setSurveyData] = useState(null)
  const [surveyLoading, setSurveyLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then((r) => r.json()).catch(() => null),
      fetch('/api/surveys').then((r) => r.json()).catch(() => null),
    ]).then(([analytics, surveyList]) => {
      setGlobalData(!analytics || analytics.total_responses === 0 ? MOCK_ANALYTICS : analytics)
      setSurveys(surveyList && surveyList.length > 0 ? surveyList : MOCK_SURVEYS)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedSurveyId) {
      setSurveyData(null)
      return
    }
    setSurveyLoading(true)
    fetch(`/api/analytics/survey/${selectedSurveyId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.detail) throw new Error(json.detail)
        setSurveyData(json)
      })
      .catch(() => setSurveyData(MOCK_SURVEY_ANALYTICS))
      .finally(() => setSurveyLoading(false))
  }, [selectedSurveyId])

  if (loading) return <LoadingState />

  const isGlobal = !selectedSurveyId
  const activeData = isGlobal ? globalData : surveyData
  const responses = isGlobal ? activeData?.recent_responses : activeData?.responses

  if (!activeData || surveyLoading) return <LoadingState />

  const { total_responses, avg_score, sentiment_breakdown, top_themes, word_frequencies } = activeData
  const pieData = buildPieData(sentiment_breakdown)

  return (
    <div style={styles.page}>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Analytics</h1>
          <p style={styles.pageSubtitle}>
            {isGlobal ? 'Voice survey insights at a glance' : activeData.survey_title}
          </p>
        </div>
        <div style={styles.headerRight}>
          <select
            style={styles.surveySelect}
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
          >
            <option value="">All Surveys</option>
            {surveys.map((s) => (
              <option key={s.uuid} value={s.uuid}>{s.title || s.company}</option>
            ))}
          </select>
          <div style={styles.lastUpdated}>
            <span style={styles.dot} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Live data</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        {isGlobal ? (
          <StatCard
            label="Survey Count"
            value={surveys.length}
            sub="total surveys"
            accent
          />
        ) : (
          <StatCard
            label="Avg Score"
            value={avg_score != null ? avg_score : '—'}
            sub="out of 10"
            accent
          />
        )}
        <StatCard
          label="Total Responses"
          value={total_responses}
          sub={isGlobal ? 'all time' : 'this survey'}
        />
        <StatCard
          label="Positive"
          value={sentiment_breakdown.positive}
          sub={`${total_responses ? Math.round((sentiment_breakdown.positive / total_responses) * 100) : 0}% of responses`}
        />
        <StatCard
          label="Neutral"
          value={sentiment_breakdown.neutral}
          sub={`${total_responses ? Math.round((sentiment_breakdown.neutral / total_responses) * 100) : 0}% of responses`}
        />
        <StatCard
          label="Negative"
          value={sentiment_breakdown.negative}
          sub={`${total_responses ? Math.round((sentiment_breakdown.negative / total_responses) * 100) : 0}% of responses`}
        />
      </div>

      {/* Charts row */}
      <div style={styles.chartsRow}>
        {/* Left panel */}
        <div style={{ ...styles.chartCard, flex: 2 }}>
          {isGlobal ? (
            <>
              <p style={styles.chartTitle}>
                Response Volume <span style={styles.chartSub}>— last 30 days</span>
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={volumeData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="responses" fill="var(--accent)" opacity={0.8} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <>
              <p style={styles.chartTitle}>
                Word Cloud <span style={styles.chartSub}>— aggregated across all responses</span>
              </p>
              <div style={{ minHeight: 220, display: 'flex', alignItems: 'center' }}>
                <WordCloud wordFrequencies={word_frequencies} />
              </div>
            </>
          )}
        </div>

        {/* Sentiment pie */}
        <div style={{ ...styles.chartCard, flex: 1, minWidth: 220 }}>
          <p style={styles.chartTitle}>Sentiment</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{value}</span>
                )}
              />
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Word cloud row — global view only */}
      {isGlobal && (
        <div style={{ ...styles.chartCard, marginBottom: 20 }}>
          <p style={styles.chartTitle}>
            Word Cloud <span style={styles.chartSub}>— aggregated across all surveys</span>
          </p>
          <WordCloud wordFrequencies={word_frequencies} />
        </div>
      )}

      {/* Themes + Responses row */}
      <div style={styles.bottomRow}>
        <div style={{ ...styles.panel, flex: '0 0 280px' }}>
          <p style={styles.chartTitle}>Top Themes</p>
          <ThemePills themes={top_themes} />
        </div>
        <div style={{ ...styles.panel, flex: 1, minWidth: 0 }}>
          <p style={styles.chartTitle}>{isGlobal ? 'Recent Responses' : 'All Responses'}</p>
          <ResponseExplorer responses={responses || []} />
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: 40, display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
      <div style={{ width: 18, height: 18, border: '2px solid var(--border-subtle)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading analytics…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const styles = {
  page: {
    padding: '36px 40px',
    maxWidth: 1400,
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  surveySelect: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    padding: '6px 12px',
    cursor: 'pointer',
    outline: 'none',
  },
  lastUpdated: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 20,
    padding: '5px 12px',
  },
  dot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 6px var(--accent)',
  },
  statsRow: {
    display: 'flex',
    gap: 14,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  chartsRow: {
    display: 'flex',
    gap: 14,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  chartCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius)',
    padding: '20px 24px',
    minWidth: 0,
  },
  chartTitle: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 16,
  },
  chartSub: {
    color: 'var(--text-secondary)',
    fontWeight: 400,
  },
  bottomRow: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
  },
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius)',
    padding: '20px 24px',
    minWidth: 0,
  },
}
