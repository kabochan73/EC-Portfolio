"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import AddressForm from "@/components/account/AddressForm";
import type { Address, AddressPayload, ApiCollection } from "@/lib/types";

/** 非 ok レスポンスを { body } 付きで throw（AddressForm がフィールドエラーに割り当てる） */
async function send(url: string, init?: RequestInit): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { body };
  }
}

export default function AddressBook({ initial }: { initial: Address[] }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"list" | "new" | number>("list"); // number = 編集中の id

  const { data: addresses = initial } = useQuery({
    queryKey: ["addresses"],
    queryFn: async (): Promise<Address[]> => {
      const res = await fetch("/bff/addresses");
      const body: ApiCollection<Address> = await res.json();
      return body.data;
    },
    initialData: initial,
    staleTime: 10_000,
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
  }

  const remove = useMutation({
    mutationFn: (id: number) => send(`/bff/addresses/${id}`, { method: "DELETE" }),
    onSuccess: refetch,
  });

  const makeDefault = useMutation({
    mutationFn: (id: number) => send(`/bff/addresses/${id}/default`, { method: "POST" }),
    onSuccess: refetch,
  });

  async function create(payload: AddressPayload) {
    await send("/bff/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    refetch();
    setMode("list");
  }

  async function update(id: number, payload: AddressPayload) {
    await send(`/bff/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    refetch();
    setMode("list");
  }

  return (
    <div className="space-y-6">
      {mode === "new" ? (
        <AddressForm onSubmit={create} onCancel={() => setMode("list")} />
      ) : (
        <button
          type="button"
          onClick={() => setMode("new")}
          className="border border-ink px-6 py-2 text-xs tracking-widest uppercase hover:bg-mist"
        >
          Add Address
        </button>
      )}

      <ul className="space-y-4">
        {addresses.map((address) =>
          mode === address.id ? (
            <li key={address.id}>
              <AddressForm
                address={address}
                onSubmit={(payload) => update(address.id, payload)}
                onCancel={() => setMode("list")}
              />
            </li>
          ) : (
            <li key={address.id} className="border border-ink p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm leading-relaxed">
                  {address.is_default && (
                    <span className="mb-2 inline-block border border-ink px-2 py-0.5 text-[10px] tracking-widest uppercase">
                      Default
                    </span>
                  )}
                  <p>{address.recipient_name}</p>
                  <p className="text-graphite">
                    〒{address.postal_code} {address.prefecture}
                    {address.city}
                  </p>
                  <p className="text-graphite">
                    {address.address_line1}
                    {address.address_line2 ? ` ${address.address_line2}` : ""}
                  </p>
                  <p className="text-graphite">{address.phone}</p>
                </div>
                <div className="flex flex-col items-end gap-2 text-[10px] tracking-widest uppercase">
                  <button type="button" onClick={() => setMode(address.id)} className="hover:opacity-60">
                    Edit
                  </button>
                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => makeDefault.mutate(address.id)}
                      className="hover:opacity-60"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove.mutate(address.id)}
                    className="text-graphite hover:text-ink"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ),
        )}
      </ul>

      {addresses.length === 0 && mode !== "new" && (
        <p className="text-sm text-graphite">登録済みの住所はありません。</p>
      )}
    </div>
  );
}
