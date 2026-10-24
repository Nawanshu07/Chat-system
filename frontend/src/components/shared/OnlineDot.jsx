export default function OnlineDot({ isOnline }) {
  if (!isOnline) return null;
  return (
    <span className="inline-block w-2 h-2 rounded-full bg-online animate-pulse-dot flex-shrink-0" />
  );
}
