export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative mx-4 mb-2">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search conversations…"
        className="
          w-full bg-[#1a1a1a] border border-line text-[#ededed]
          rounded-full pl-9 pr-4 py-2 text-sm
          placeholder:text-muted
          focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
          transition-colors duration-150
        "
      />
    </div>
  );
}
