export default function SearchBar({ value, onChange }) {
  return (
    <label className="search block">
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats"
        aria-label="Search chats"
      />
    </label>
  );
}
