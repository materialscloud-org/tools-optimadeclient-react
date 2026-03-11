export default function HelpIcon({
  popover,
  size = 24,
  color = "currentColor",
  strokeWidthBorder = 2,
  strokeWidth = 2.5,
  placement = "top",
  popoutBgColor = "bg-gray-800",
  popoutTextColor = "text-white",
  popoutStyleOverrides = "",
}) {
  let positionClasses = "";
  switch (placement) {
    case "top":
      positionClasses = "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      break;
    case "bottom":
      positionClasses = "top-full left-1/2 transform -translate-x-1/2 mt-2";
      break;
    case "left":
      positionClasses = "right-full top-1/2 transform -translate-y-1/2 mr-2";
      break;
    case "right":
      positionClasses = "left-full top-1/2 transform -translate-y-1/2 ml-2";
      break;
    default:
      positionClasses = "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
  }

  return (
    <span className="relative inline-block group">
      {/* SVG question mark icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidthBorder}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path
          d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
          strokeWidth={strokeWidth}
        />
        <path d="M12 17h.01" strokeWidth={strokeWidth} />
      </svg>

      {/* Popover */}
      {popover && (
        <span
          className={`absolute ${positionClasses} w-max max-w-xs rounded-sm ${popoutBgColor} ${popoutTextColor} text-xs p-1
          text-center opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-50 pointer-events-none ${popoutStyleOverrides}`}
        >
          {popover}
        </span>
      )}
    </span>
  );
}
