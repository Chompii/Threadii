export default function HeartIcon({ filled, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4.5 5.6 4.1c1.9-.2 3.7.8 4.9 2.4a.6.6 0 001 0c1.2-1.6 3-2.6 4.9-2.4 3.3.4 5.1 3.7 3.6 7.1-2.5 4.7-10 9.3-10 9.3z"
        fill={filled ? "#3D6A85" : "none"}
        stroke={filled ? "#3D6A85" : "#8A6F52"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
