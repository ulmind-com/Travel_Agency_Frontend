import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { 
  Users, Activity, UserPlus, CalendarCheck, 
  Clock, CheckCircle2, XCircle, Undo2, 
  Banknote, TrendingUp, TrendingDown, RefreshCcw, 
  MapPin, PackageX, Wallet
} from "lucide-react";

import { adminDashboardQuery } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDashboardStream } from "@/hooks/useDashboardStream";
import { ActivityFeed } from "@/components/admin/activity/ActivityFeed";
import { 
  RevenueChart, 
  BookingsChart, 
  PaymentMethodsChart 
} from "@/components/admin/DashboardCharts";

export const Route = createFileRoute("/_authenticated/account/admin/")({
  component: AdminEnterpriseDashboard,
});

function AdminEnterpriseDashboard() {
  const [timeframe, setTimeframe] = useState("last_30_days");
  
  // Real-time invalidation hook
  useDashboardStream();

  const { data, isLoading, isError } = useQuery(adminDashboardQuery(timeframe));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
    <div className="min-w-0 space-y-8">
      {/* Header & Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-ink-900">Enterprise Overview</h1>
          <p className="text-ink-900/60 text-sm mt-1">Real-time pulse of your travel operations.</p>
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-full border border-ink-900/10 shadow-sm overflow-x-auto hide-scrollbar max-w-full">
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "last_7_days", label: "7D" },
            { id: "last_30_days", label: "30D" },
            { id: "this_month", label: "Month" },
            { id: "this_year", label: "Year" },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 shrink-0",
                timeframe === tf.id 
                  ? "bg-ink-900 text-white shadow-md" 
                  : "text-ink-900/60 hover:text-ink-900 hover:bg-ink-900/5"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <div className="flex flex-col items-center justify-center h-64 bg-red-50/50 rounded-3xl border border-red-100">
          <XCircle className="size-10 text-red-400 mb-3" />
          <p className="text-red-600 font-medium">Failed to load live analytics.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex justify-between items-center text-xs font-medium text-ink-900/40 px-2">
             <div className="flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               Live System Connected
             </div>
             <span>Last generated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
          </div>

          {/* Primary Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard title="Today's Revenue" value={formatCurrency(data.todayRevenue)} icon={Banknote} color="emerald" isCurrency />
            <KPICard title="Monthly Revenue" value={formatCurrency(data.monthlyRevenue)} icon={TrendingUp} color="emerald" isCurrency />
            <KPICard title="Lifetime Revenue" value={formatCurrency(data.lifetimeRevenue)} icon={Wallet} color="emerald" isCurrency />
            <KPICard title="Avg Booking Value" value={formatCurrency(data.averageBookingValue)} icon={Activity} color="emerald" isCurrency />
          </div>

          {/* User & Bookings KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard title="Total Users" value={data.totalUsers} icon={Users} color="blue" />
            <KPICard title="Active Users" value={data.activeUsers} icon={UserPlus} color="blue" />
            <KPICard title="Live Online Now" value={data.onlineUsers} icon={Activity} color="amber" highlight />
            <KPICard title="Today's Bookings" value={data.todayBookings} icon={CalendarCheck} color="purple" />
          </div>

          {/* Status & Operational KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard title="Successful Payments" value={data.successfulPayments} icon={CheckCircle2} color="emerald" />
            <KPICard title="Pending Payments" value={data.pendingPayments} icon={Clock} color="amber" />
            <KPICard title="Failed Payments" value={data.failedPayments} icon={XCircle} color="red" />
            <KPICard title="Refund Requests" value={data.refundRequests} icon={Undo2} color="red" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard title="Today's Registrations" value={data.todayRegistrations} icon={UserPlus} color="blue" />
            <KPICard title="Conversion Rate" value={`${data.conversionRate.toFixed(1)}%`} icon={TrendingUp} color="purple" isPercent />
            <KPICard title="Active Packages" value={data.activePackages} icon={MapPin} color="purple" />
            <KPICard title="Cancelled Trips" value={data.cancelledTrips} icon={PackageX} color="red" />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-ink-900/[0.08] rounded-3xl p-6 md:p-8 shadow-sm relative z-0">
               <h3 className="font-serif text-xl font-medium text-ink-900 mb-6">Revenue Trend</h3>
               <RevenueChart data={data.revenueChart} />
            </div>
            
            <div className="bg-white border border-ink-900/[0.08] rounded-3xl p-6 md:p-8 shadow-sm relative z-0">
               <h3 className="font-serif text-xl font-medium text-ink-900 mb-6">Booking Velocity</h3>
               <BookingsChart data={data.bookingsChart} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="bg-white border border-ink-900/[0.08] rounded-3xl p-6 shadow-sm relative z-0">
               <h3 className="font-serif text-xl font-medium text-ink-900 mb-6">Payment Methods</h3>
               <PaymentMethodsChart data={data.paymentMethodsChart} />
             </div>
             
             <div className="lg:col-span-2 bg-white border border-ink-900/[0.08] rounded-3xl p-6 shadow-sm overflow-hidden">
               <h3 className="font-serif text-xl font-medium text-ink-900 mb-6">Top Performing Packages</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead>
                     <tr className="border-b border-ink-900/10">
                       <th className="pb-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px]">Package</th>
                       <th className="pb-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px] text-right">Bookings</th>
                       <th className="pb-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px] text-right">Revenue</th>
                     </tr>
                   </thead>
                   <tbody>
                     {data.topPackages.map((pkg, i) => (
                       <tr key={pkg.package_id} className={cn("border-b border-ink-900/5 last:border-0", i % 2 === 0 ? "bg-cream-50/50" : "")}>
                         <td className="py-4">
                           <div className="flex items-center gap-3">
                             {pkg.thumbnail_url ? (
                               <img src={pkg.thumbnail_url} alt={pkg.title} className="size-10 rounded-lg object-cover bg-ink-900/10" />
                             ) : (
                               <div className="size-10 rounded-lg bg-ink-900/5 flex items-center justify-center">
                                 <MapPin className="size-4 text-ink-900/30" />
                               </div>
                             )}
                             <span className="font-medium text-ink-900">{pkg.title}</span>
                           </div>
                         </td>
                         <td className="py-4 text-right font-medium text-ink-900/70">{pkg.booking_count}</td>
                         <td className="py-4 text-right font-semibold text-emerald-600">{formatCurrency(pkg.total_sales)}</td>
                       </tr>
                     ))}
                     {data.topPackages.length === 0 && (
                       <tr>
                         <td colSpan={3} className="py-8 text-center text-ink-900/40 text-sm">No sales data available yet.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>
        </motion.div>
      )}
    </div>

    {/* Live Activity Feed — sticky right sidebar, auto-updating via SSE */}
    <div className="hidden xl:block">
      <div className="sticky top-24">
        <ActivityFeed maxHeight="calc(100vh - 9rem)" resizable />
      </div>
    </div>
    {/* Mobile / tablet: feed below the dashboard */}
    <div className="xl:hidden">
      <ActivityFeed maxHeight="480px" />
    </div>
    </div>
  );
}

// ----------------------------------------------------
// COMPONENTS
// ----------------------------------------------------

function KPICard({ title, value, icon: Icon, color, highlight, isCurrency, isPercent }: any) {
  // Animated counter for numbers
  const displayValue = typeof value === "number" && !isCurrency && !isPercent
    ? <AnimatedCounter value={value} /> 
    : value;

  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-600 group-hover:border-emerald-500/30",
    blue: "bg-blue-500/10 text-blue-600 group-hover:border-blue-500/30",
    purple: "bg-purple-500/10 text-purple-600 group-hover:border-purple-500/30",
    amber: "bg-amber-500/10 text-amber-600 group-hover:border-amber-500/30",
    red: "bg-red-500/10 text-red-600 group-hover:border-red-500/30",
  }[color as string] || "bg-ink-900/10 text-ink-900 group-hover:border-ink-900/30";

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "bg-white/80 backdrop-blur-xl border border-ink-900/[0.08] rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all duration-300",
        highlight && "ring-2 ring-emerald-500/20 shadow-emerald-500/10"
      )}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn("size-10 rounded-2xl flex items-center justify-center transition-colors", colors)}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-ink-900/50 text-[11px] font-bold uppercase tracking-wider mb-2">{title}</h4>
        <p className="font-serif text-3xl font-medium text-ink-900 truncate tracking-tight">{displayValue}</p>
      </div>
      
      {/* Decorative gradient */}
      <div className={cn("absolute -bottom-6 -right-6 size-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100", colors.split(' ')[0])} />
    </motion.div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center px-2">
        <div className="h-4 w-32 bg-ink-900/10 rounded-full" />
        <div className="h-4 w-48 bg-ink-900/10 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="bg-white/40 border border-ink-900/5 rounded-3xl p-6 h-36">
            <div className="size-10 rounded-2xl bg-ink-900/5 mb-6" />
            <div className="h-3 w-24 bg-ink-900/10 rounded-full mb-3" />
            <div className="h-8 w-32 bg-ink-900/10 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
