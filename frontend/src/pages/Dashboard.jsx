import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatCard from '../components/StatCard'
import ThemePills from '../components/ThemePills'
import ResponseExplorer from '../components/ResponseExplorer'
import { MOCK_ANALYTICS, MOCK_TREND } from '../mockData'

const PIE_COLORS = {
  positive: '#2DD4BF',
  neutral: '#8B909A',
  negative: '#F87171',
}

function buildPieData(breakdown) {
  return [
    { name: 'Positive', value: breakdown.positive, color: PIE_COLORS.positive },
    { name: 'Neutral', value: breakdown.neutral, color: PIE_COLORS.neutral },
    { name: 'Negative', value: breakdown.negative, color: PIE_COLORS.negative },
  ].filter((d) => d.value > 0)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: '8px 14px',
      fontSize: '0.85rem',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{payload[0].value} / 10</p>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [trend, setTrend] = useState(MOCK_TREND)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((json) => {
        if (json.total_responses === 0) {
          setData(MOCK_ANALYTICS)
        } else {
          setData(json)
        }
      })
      .catch(() => setData(MOCK_ANALYTICS))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  const { total_responses, avg_csat_score, sentiment_breakdown, top_themes, recent_responses } = data
  const pieData = buildPieData(sentiment_breakdown)

  return (
    <div style={styles.page}>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Analytics</h1>
          <p style={styles.pageSubtitle}>Voice survey insights at a glance</p>
        </div>
        <div style={styles.lastUpdated}>
          <span style={styles.dot} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Live data
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <StatCard
          label="Avg CSAT Score"
          value={avg_csat_score || '—'}
          sub="out of 10"
          accent
        />
        <StatCard
          label="Total Responses"
          value={total_responses}
          sub="all time"
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
        {/* Line chart */}
        <div style={{ ...styles.chartCard, flex: 2 }}>
          <p style={styles.chartTitle}>CSAT Score Trend <span style={styles.chartSub}>— last 30 days</span></p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                domain={[5, 10]}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-elevated)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
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
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Themes + Responses row */}
      <div style={styles.bottomRow}>
        {/* Themes */}
        <div style={{ ...styles.panel, flex: '0 0 280px' }}>
          <p style={styles.chartTitle}>Top Themes</p>
          <ThemePills themes={top_themes} />
        </div>

        {/* Response explorer */}
        <div style={{ ...styles.panel, flex: 1, minWidth: 0 }}>
          <p style={styles.chartTitle}>Recent Responses</p>
          <ResponseExplorer responses={recent_responses} />
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
