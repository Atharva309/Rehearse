/**
 * EntityLookupField.tsx
 * Salesforce-style Account/Contact lookup dropdown for CRM record headers.
 */

"use client";

type LookupOption = {
  value: string;
  label: string;
};

type EntityLookupFieldProps = {
  label: string;
  options: LookupOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

/**
 * Native select styled like CrmStageLogForm inputs.
 */
export function EntityLookupField({
  label,
  options,
  selectedValue,
  onSelect,
}: EntityLookupFieldProps): React.ReactElement {
  return (
    <div className="space-y-1 min-w-[180px]">
      <label className="text-[10px] font-medium tracking-wide text-[#404848] uppercase">
        {label}
      </label>
      <select
        className="w-full bg-[#eef5f2] border border-[#bfc8c8] rounded-md px-3 py-2 text-sm text-[#161d1b] focus:ring-2 focus:ring-[#0f4c4c] focus:border-[#0f4c4c] outline-none transition-all"
        value={selectedValue}
        onChange={(e) => onSelect(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
