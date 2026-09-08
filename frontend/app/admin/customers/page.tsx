import type { Metadata } from "next";
import Link from "next/link";

import { fetchAdminCustomers } from "@/lib/admin/customers";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin Customers" };

type PageProps = { searchParams: Promise<{ q?: string; page?: string }> };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

/** 会員一覧（閲覧のみ。検索・ページングは GET クエリだけで完結）。 */
export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const { token } = await requireAdmin("/admin/customers");
  const { q, page } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  const result = await fetchAdminCustomers(token, { q, page: currentPage });

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(target));
    return `/admin/customers?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="mb-8 text-xl tracking-widest uppercase">Customers</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="q" className="block text-[11px] tracking-widest text-graphite uppercase">
            Search
          </label>
          <input
            type="text"
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Name or email"
            className="mt-2 w-64 border-b border-ink bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          className="border border-ink px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Search
        </button>
      </form>

      {result.data.length === 0 ? (
        <p className="text-sm text-graphite">No customers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 pr-4 font-normal">Email</th>
                <th className="py-2 pr-4 font-normal">Registered</th>
                <th className="py-2 text-right font-normal">Orders</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((customer) => (
                <tr key={customer.id} className="border-b border-mist">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-graphite">{customer.email}</td>
                  <td className="py-3 pr-4 text-graphite">{formatDate(customer.joined_at)}</td>
                  <td className="py-3 text-right">{customer.orders_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.meta.last_page > 1 && (
        <div className="mt-6 flex items-center gap-4 text-xs tracking-widest uppercase">
          {result.meta.current_page > 1 ? (
            <Link href={pageHref(result.meta.current_page - 1)} className="hover:underline">
              Prev
            </Link>
          ) : (
            <span className="text-graphite">Prev</span>
          )}
          <span>
            {result.meta.current_page} / {result.meta.last_page}
          </span>
          {result.meta.current_page < result.meta.last_page ? (
            <Link href={pageHref(result.meta.current_page + 1)} className="hover:underline">
              Next
            </Link>
          ) : (
            <span className="text-graphite">Next</span>
          )}
        </div>
      )}
    </div>
  );
}
