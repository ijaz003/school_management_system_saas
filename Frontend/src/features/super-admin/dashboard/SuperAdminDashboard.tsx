import { Building2, CreditCard, DollarSign, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/selectors/permissions';

export function SuperAdminDashboard() {
  const user = useAppSelector(selectUser);
  const firstName = user?.fullName.split(' ')[0] || 'Admin';

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Platform"
          title={`Welcome, ${firstName}`}
          description="Manage schools, billing, and platform health from one place."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total schools" value="—" hint="Connect schools API" icon={Building2} />
          <StatCard label="Active schools" value="—" hint="Subscription status" icon={Building2} />
          <StatCard label="Monthly revenue" value="—" hint="Billing module" icon={DollarSign} />
          <StatCard label="Payment due" value="—" hint="Outstanding invoices" icon={CreditCard} />
        </div>

        <section className="panel p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-ink-950">Quick links</h2>
          <p className="mt-1 text-sm text-ink-500">Jump into the most used platform areas.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { to: '/schools', label: 'Schools', desc: 'Create and manage tenants' },
              { to: '/subscriptions', label: 'Subscriptions', desc: 'Plans and renewals' },
              { to: '/support', label: 'Support', desc: 'Incoming school requests', icon: true },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl border border-ink-100 bg-surface-muted/50 px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50/40"
              >
                <p className="text-sm font-semibold text-ink-950">{item.label}</p>
                <p className="mt-0.5 text-xs text-ink-500">{item.desc}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-ink-200 px-4 py-4 text-sm text-ink-500">
            <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            Platform analytics cards will fill in once billing and school metrics endpoints are
            connected.
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
