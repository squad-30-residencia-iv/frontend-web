import './CampaignIllustration.css'

const ILLUSTRATION_FONT_FAMILY = 'Arial, sans-serif'

export function CampaignIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 500 510"
      className="campaign-illustration"
      fill="none"
    >
      <IllustrationDefs />
      <IllustrationBackground />
      <DashboardPanel />
      <MegaphoneCard />
      <AnalyticsCard />
      <VoucherCard />
    </svg>
  )
}

function IllustrationDefs() {
  return (
    <defs>
      {/* Gradientes compartilhados. */}
      <linearGradient
        id="campaign-dashboard-gradient"
        x1="80"
        y1="150"
        x2="420"
        y2="460"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#1d242e" />
        <stop
          offset="1"
          stopColor="#0c1118"
        />
      </linearGradient>
      <linearGradient
        id="campaign-tile-gradient"
        x2="1"
        y2="1"
      >
        <stop stopColor="#242b35" />
        <stop
          offset="1"
          stopColor="#141920"
        />
      </linearGradient>
      <linearGradient
        id="campaign-card-gradient"
        x2="1"
        y2="1"
      >
        <stop stopColor="white" />
        <stop
          offset="1"
          stopColor="#e0e3e9"
        />
      </linearGradient>
      <linearGradient
        id="campaign-chart-area-gradient"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          stopColor="#e22235"
          stopOpacity=".2"
        />
        <stop
          offset="1"
          stopColor="#e22235"
          stopOpacity="0"
        />
      </linearGradient>
      {/* Sombra dos painéis e cartões. */}
      <filter
        id="campaign-card-shadow"
        x="-40%"
        y="-40%"
        width="180%"
        height="180%"
      >
        <feDropShadow
          dx="0"
          dy="12"
          stdDeviation="12"
          floodColor="#000"
          floodOpacity=".4"
        />
      </filter>
    </defs>
  )
}

function IllustrationBackground() {
  return (
    <>
      <path
        d="M0 269L500 162v123L0 391Z"
        fill="#242d3b"
        opacity=".2"
      />
      <rect
        x="383"
        y="21"
        width="80"
        height="94"
        rx="15"
        fill="url(#campaign-tile-gradient)"
        opacity=".5"
        transform="rotate(-7 383 21)"
      />
      <path
        d="M324 137V74q0-18 18-18h45M424 222h40q15 0 15 15v50"
        stroke="#657185"
        strokeOpacity=".55"
        strokeDasharray="5 4"
        strokeWidth="1.5"
      />
    </>
  )
}

function DashboardPanel() {
  return (
    <g
      transform="translate(25 210) rotate(-11) skewX(-11)"
      filter="url(#campaign-card-shadow)"
    >
      <rect
        width="418"
        height="280"
        rx="14"
        fill="url(#campaign-dashboard-gradient)"
        stroke="#343d4b"
        strokeWidth="2"
      />
      <DashboardHeader />
      <DashboardSidebar />
      <text
        x="133"
        y="63"
        fill="#eef0f4"
        fontFamily={ILLUSTRATION_FONT_FAMILY}
        fontSize="13"
        fontWeight="bold"
      >
        Campanhas
      </text>
      <rect
        x="325"
        y="49"
        width="23"
        height="8"
        rx="4"
        fill="#f02235"
      />
      <rect
        x="354"
        y="49"
        width="47"
        height="8"
        rx="4"
        fill="#303948"
      />
      <CampaignStats />
      <Chart />
    </g>
  )
}

function DashboardHeader() {
  return (
    <>
      <rect
        x="5"
        y="5"
        width="408"
        height="30"
        rx="10"
        fill="#161d27"
      />
      <circle
        cx="22"
        cy="19"
        r="4.5"
        fill="#f32939"
      />
      <circle
        cx="38"
        cy="19"
        r="4.5"
        fill="#fa913e"
      />
      <circle
        cx="54"
        cy="19"
        r="4"
        fill="#657487"
      />
      <rect
        x="72"
        y="16"
        width="43"
        height="6"
        rx="3"
        fill="#222c39"
      />
      <rect
        x="124"
        y="16"
        width="95"
        height="6"
        rx="3"
        fill="#222c39"
      />
    </>
  )
}

function DashboardSidebar() {
  return (
    <>
      <path
        d="M119 42v224"
        stroke="#2b3440"
      />
      <rect
        x="15"
        y="52"
        width="91"
        height="28"
        rx="4"
        fill="#df1c2b"
      />
      <g
        fill="#a0a9b8"
        fontFamily={ILLUSTRATION_FONT_FAMILY}
        fontSize="9"
      >
        <text
          x="40"
          y="70"
          fill="white"
        >
          Campanhas
        </text>
        <text
          x="40"
          y="98"
        >
          Vouchers
        </text>
        <text
          x="40"
          y="126"
        >
          Relatórios
        </text>
        <text
          x="40"
          y="154"
        >
          Usuários
        </text>
        <text
          x="40"
          y="182"
        >
          Configurações
        </text>
      </g>
      <g
        stroke="#8996a9"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M24 90h10v3a3 3 0 0 0 0 4v3H24v-3a3 3 0 0 0 0-4ZM24 119h11v10H24ZM27 116v10m4-6v6M24 155v-5q5-5 10 0v5Zm2-12a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
        <circle
          cx="29"
          cy="179"
          r="5"
        />
        <path d="M29 171v3m0 10v3m-8-8h3m10 0h3" />
        <path
          d="M23 63h4l7-4v14l-7-4h-4Zm4 6 2 6"
          fill="white"
          stroke="white"
        />
      </g>
    </>
  )
}

function CampaignStats() {
  return (
    <>
      <rect
        x="132"
        y="85"
        width="130"
        height="75"
        rx="7"
        fill="url(#campaign-tile-gradient)"
      />
      <rect
        x="274"
        y="85"
        width="129"
        height="75"
        rx="7"
        fill="url(#campaign-tile-gradient)"
      />
      <g fontFamily={ILLUSTRATION_FONT_FAMILY}>
        <text
          x="143"
          y="107"
          fill="#a1adbd"
          fontSize="9"
        >
          Campanhas ativas
        </text>
        <text
          x="285"
          y="107"
          fill="#a1adbd"
          fontSize="9"
        >
          Vouchers resgatados
        </text>
        <text
          x="144"
          y="140"
          fill="#f2f4f8"
          fontSize="20"
        >
          12
        </text>
        <text
          x="285"
          y="140"
          fill="#f2f4f8"
          fontSize="20"
        >
          1.248
        </text>
        <text
          x="226"
          y="139"
          fill="#30c799"
          fontSize="8"
        >
          ↑ 20%
        </text>
        <text
          x="369"
          y="139"
          fill="#30c799"
          fontSize="8"
        >
          ↑ 12%
        </text>
      </g>
    </>
  )
}

function Chart() {
  return (
    <>
      <rect
        x="132"
        y="175"
        width="271"
        height="88"
        rx="7"
        fill="url(#campaign-tile-gradient)"
      />
      <path
        d="M142 241c21-4 20 8 35 4s21-32 37-28 20 19 34 8 17-19 29-16 17 11 29 4 20-26 35-20 19-18 34-19 17 2 26 5v75H142Z"
        fill="url(#campaign-chart-area-gradient)"
      />
      <path
        d="M142 241c21-4 20 8 35 4s21-32 37-28 20 19 34 8 17-19 29-16 17 11 29 4 20-26 35-20 19-18 34-19 17 2 26 5"
        stroke="#fa2539"
        strokeWidth="2"
      />
    </>
  )
}

function MegaphoneCard() {
  return (
    <g
      transform="translate(345 84) rotate(12)"
      filter="url(#campaign-card-shadow)"
    >
      <rect
        width="142"
        height="83"
        rx="8"
        fill="url(#campaign-card-gradient)"
      />
      <path
        d="M18 33h10l15-11v38L28 49H18q-5-8 0-16Z"
        fill="#ed2030"
      />
      <path
        d="M27 48l5 15h7l-5-12"
        fill="#c71324"
      />
      <path
        d="M30 29v22"
        stroke="#ff8491"
        strokeWidth="2"
      />
      <rect
        x="61"
        y="25"
        width="68"
        height="7"
        rx="3.5"
        fill="#c4cad5"
      />
      <rect
        x="61"
        y="40"
        width="52"
        height="7"
        rx="3.5"
        fill="#c4cad5"
      />
      <rect
        x="61"
        y="55"
        width="36"
        height="7"
        rx="3.5"
        fill="#c4cad5"
      />
    </g>
  )
}

function AnalyticsCard() {
  return (
    <g
      transform="translate(111 409) rotate(-11) skewX(-11)"
      filter="url(#campaign-card-shadow)"
    >
      <rect
        width="143"
        height="83"
        rx="7"
        fill="url(#campaign-card-gradient)"
      />
      <circle
        cx="41"
        cy="42"
        r="20"
        stroke="#d7dce5"
        strokeWidth="13"
      />
      <circle
        cx="41"
        cy="42"
        r="20"
        stroke="#ef2338"
        strokeWidth="13"
        strokeDasharray="75 126"
        transform="rotate(-90 41 42)"
      />
      <path
        d="M22 49a20 20 0 0 0 21 13"
        stroke="#ff7b8a"
        strokeWidth="13"
      />
      <circle
        cx="83"
        cy="25"
        r="4"
        fill="#9faabe"
      />
      <circle
        cx="83"
        cy="42"
        r="4"
        fill="#f25669"
      />
      <circle
        cx="83"
        cy="59"
        r="4"
        fill="#bbc4d1"
      />
      <path
        d="M97 25h26M97 42h19M97 59h23"
        stroke="#cbd1dc"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </g>
  )
}

function VoucherCard() {
  return (
    <g
      transform="translate(404 294) rotate(-13)"
      filter="url(#campaign-card-shadow)"
    >
      <rect
        width="89"
        height="70"
        rx="7"
        fill="url(#campaign-card-gradient)"
      />
      <path
        d="M22 26l38-10 5 13a7 7 0 0 0 4 13l3 9-38 10-4-12a7 7 0 0 0-4-14Z"
        fill="#e92332"
        transform="rotate(-13 45 37)"
      />
      <path
        d="M45 26l7 21"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <path
        d="m33 34 3 8m20-13 3 8"
        stroke="white"
        strokeWidth="3"
      />
    </g>
  )
}
