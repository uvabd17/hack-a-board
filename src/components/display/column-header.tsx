export function ColumnHeader() {
  return (
    <div
      className="grid h-8 items-end text-zinc-500 uppercase text-[10px] px-4 font-bold tracking-[0.15em] border-b border-zinc-800 pb-1.5"
      style={{ gridTemplateColumns: "56px 1fr 100px 64px" }}
    >
      <div>#</div>
      <div>TEAM</div>
      <div className="text-right">SCORE</div>
      <div className="text-right">&Delta;</div>
    </div>
  )
}
