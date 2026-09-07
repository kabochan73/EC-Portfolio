"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import Field from "@/components/ui/Field";
import type { AddressFormValues } from "@/lib/schemas/address";
import type { Address } from "@/lib/types";

type Props = {
  addresses: Address[];
  /** 既存の住所を選択中ならその id。新規入力中は null */
  selectedId: number | null;
  onSelectExisting: (id: number) => void;
  useNew: boolean;
  onUseNew: () => void;
  /** 新規入力フォーム（useNew のとき表示） */
  register: UseFormRegister<AddressFormValues>;
  errors: FieldErrors<AddressFormValues>;
  saveAddress: boolean;
  onSaveAddressChange: (value: boolean) => void;
};

export default function AddressPicker({
  addresses,
  selectedId,
  onSelectExisting,
  useNew,
  onUseNew,
  register,
  errors,
  saveAddress,
  onSaveAddressChange,
}: Props) {
  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <label
          key={address.id}
          className={`flex cursor-pointer gap-3 border p-4 text-sm ${
            !useNew && selectedId === address.id ? "border-ink" : "border-mist"
          }`}
        >
          <input
            type="radio"
            name="address-choice"
            className="mt-1"
            checked={!useNew && selectedId === address.id}
            onChange={() => onSelectExisting(address.id)}
          />
          <span className="flex flex-col gap-1">
            <span className="flex items-center gap-2">
              {address.recipient_name}
              {address.is_default && (
                <span className="border border-graphite px-1 text-[9px] tracking-widest text-graphite uppercase">
                  Default
                </span>
              )}
            </span>
            <span className="text-[11px] tracking-wide text-graphite">
              〒{address.postal_code} {address.prefecture}
              {address.city}
              {address.address_line1}
              {address.address_line2 ? ` ${address.address_line2}` : ""}
            </span>
            <span className="text-[11px] tracking-wide text-graphite">{address.phone}</span>
          </span>
        </label>
      ))}

      <label
        className={`flex cursor-pointer gap-3 border p-4 text-sm ${
          useNew ? "border-ink" : "border-mist"
        }`}
      >
        <input
          type="radio"
          name="address-choice"
          className="mt-1"
          checked={useNew}
          onChange={onUseNew}
        />
        <span className="tracking-widest uppercase">新しい住所を入力</span>
      </label>

      {useNew && (
        <div className="space-y-5 border border-ink p-6">
          <Field
            label="宛名"
            id="recipient_name"
            error={errors.recipient_name?.message}
            {...register("recipient_name")}
          />
          <Field
            label="郵便番号"
            id="postal_code"
            placeholder="123-4567"
            error={errors.postal_code?.message}
            {...register("postal_code")}
          />
          <Field
            label="都道府県"
            id="prefecture"
            error={errors.prefecture?.message}
            {...register("prefecture")}
          />
          <Field label="市区町村" id="city" error={errors.city?.message} {...register("city")} />
          <Field
            label="番地"
            id="address_line1"
            error={errors.address_line1?.message}
            {...register("address_line1")}
          />
          <Field
            label="建物・部屋番号（任意）"
            id="address_line2"
            error={errors.address_line2?.message}
            {...register("address_line2")}
          />
          <Field label="電話番号" id="phone" error={errors.phone?.message} {...register("phone")} />

          <label className="flex items-center gap-2 text-xs tracking-widest text-graphite uppercase">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => onSaveAddressChange(e.target.checked)}
            />
            この住所を住所録に保存する
          </label>
        </div>
      )}
    </div>
  );
}
