import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'

export default function DashboardCharts({ chartData, sourceData, moduleEntries, outstanding, donutBalances, donutTotal, currency, chartPeriodLabel }) {
  const sourceTotal = sourceData.reduce((sum, item) => sum + Number(item.value || 0), 0)

  return <>
    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_1fr]">
      <section className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between">
          <div><h2 className="font-display text-sm font-extrabold">Arus kas bulanan</h2><p className="mt-1 text-[11px] text-[#929c91]">Penerimaan dan pengeluaran · dalam juta rupiah</p></div>
          <span className="rounded border border-[#e6e7dd] px-2 py-1 text-[10px] text-[#748174]">{chartPeriodLabel}</span>
        </div>
        <div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 3, left: -18, bottom: 0 }} barGap={5}>
          <CartesianGrid vertical={false} stroke="#eceee6" strokeDasharray="3 4" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a968b', fontSize: 11 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9aa399', fontSize: 10 }} tickFormatter={(value) => `${value}jt`} />
          <Tooltip formatter={(value) => [`Rp ${value} jt`, '']} contentStyle={{ border: '1px solid #e5e8df', borderRadius: 6, fontSize: 12 }} />
          <Bar dataKey="masuk" name="Masuk" fill="#b5122a" radius={[3, 3, 0, 0]} maxBarSize={29} />
          <Bar dataKey="keluar" name="Keluar" fill="#242424" radius={[3, 3, 0, 0]} maxBarSize={29} />
        </BarChart></ResponsiveContainer></div>
        <div className="mt-3 flex gap-5 text-[10px] text-[#7e8a7f]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#b5122a]" /> Dana masuk</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#242424]" /> Dana keluar</span></div>
      </section>
      <section className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4 sm:p-5">
        <div><h2 className="font-display text-sm font-extrabold">Sumber dana</h2><p className="mt-1 text-[11px] text-[#929c91]">Proporsi penerimaan sesuai filter</p></div>
        <div className="relative mx-auto mt-2 h-[205px] max-w-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart>
          <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={3} stroke="none">{sourceData.map((slice) => <Cell key={slice.name} fill={slice.color} />)}</Pie>
          <Tooltip formatter={(value) => [`${value}%`, 'Porsi']} contentStyle={{ border: '1px solid #e5e8df', borderRadius: 6, fontSize: 12 }} />
        </PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-[22px] font-extrabold">{sourceTotal}%</span><span className="text-[10px] text-[#8a968b]">penerimaan</span></div></div>
        <div className="space-y-2">{sourceData.map((slice) => <div key={slice.name} className="flex items-center gap-2 text-xs"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: slice.color }} /><span className="flex-1 text-[#788579]">{slice.name}</span><span className="font-bold">{slice.value}%</span></div>)}</div>
      </section>
    </div>
    <section className="mt-5 rounded-md border border-[#e6e7dd] bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-end"><div><h2 className="font-display text-sm font-extrabold">Posisi kas per modul</h2><p className="mt-1 text-[11px] text-[#929c91]">Saldo bersih dari penerimaan dan pengeluaran yang tercatat.</p></div><span className="text-[10px] text-[#8a968b]">Angka rupiah</span></div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><div className="flex items-center justify-between rounded-md border border-[#f1d9dc] bg-[#fff1f2] px-3 py-2.5"><span className="text-[11px] text-[#715d60]">Tunggakan iuran belum dibayar</span><b className="text-xs text-[#b5122a]">{currency(outstanding.arrears)}</b></div><div className="flex items-center justify-between rounded-md border border-[#e6e7dd] bg-[#f7f7f7] px-3 py-2.5"><span className="text-[11px] text-[#6f6f6f]">Kembalian anggota belum diserahkan</span><b className="text-xs text-[#242424]">{currency(outstanding.refundDebt)}</b></div></div>
      <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[250px_1fr]">
        <div className="relative mx-auto h-[220px] w-full max-w-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart>
          <Pie data={donutBalances} dataKey="value" nameKey="name" innerRadius={66} outerRadius={96} paddingAngle={2} stroke="none">{donutBalances.map((slice) => <Cell key={slice.name} fill={slice.color} />)}</Pie>
          <Tooltip formatter={(value) => [currency(value), 'Saldo bersih']} contentStyle={{ border: '1px solid #e5e8df', borderRadius: 6, fontSize: 12 }} />
        </PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-lg font-extrabold">{currency(donutTotal)}</span><span className="text-[10px] text-[#8a968b]">saldo positif</span></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-[#eceee6] text-[9px] font-bold uppercase tracking-wide text-[#99a197]"><th className="py-2.5">Modul</th><th className="px-3 py-2.5 text-right">Masuk</th><th className="px-3 py-2.5 text-right">Keluar</th><th className="px-3 py-2.5 text-right">Saldo</th><th className="px-3 py-2.5 text-right">Belum dibayar</th></tr></thead><tbody className="divide-y divide-[#f0f1eb]">{moduleEntries.map((item) => <tr key={item.key}><td className="py-3 font-semibold text-[#3c5043]"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: item.color }} />{item.name}</td><td className="px-3 py-3 text-right text-[#555]">{currency(item.incoming)}</td><td className="px-3 py-3 text-right text-[#555]">{currency(item.outgoing)}</td><td className="px-3 py-3 text-right font-bold">{currency(item.balance)}</td><td className="px-3 py-3 text-right font-semibold text-[#b5122a]">{['iuran', 'sukaduka'].includes(item.key) ? currency(item.unpaid) : '-'}</td></tr>)}</tbody></table></div>
      </div>
    </section>
  </>
}
