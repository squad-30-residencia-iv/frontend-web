export function Brand() {
  return (
    <div className="flex items-center gap-3 text-white">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-e-lg bg-[#ed1c2b] shadow-[0_0_28px_#ed1c2b20] md:size-[clamp(34px,4.5vw,54px)]">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-white stroke-2">
          <path strokeLinejoin="round" d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0M3 20h18M10 20v-6h4v6M5 4V2h14v2" />
        </svg>
      </span>
      <div>
        <p className="text-base leading-tight font-bold md:text-[clamp(16px,2.05vw,26px)]">Portal Campanhas</p>
        <p className="mt-0.5 text-[11px] tracking-wide text-[#939caa] md:text-[clamp(11px,1.35vw,16px)]">Retail Management</p>
      </div>
    </div>
  )
}
