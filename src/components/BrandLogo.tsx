import pixoranestLogoDark from "@/assets/pixoranest-logo.png";

/**
 * PixoraNest logo that inverts for dark mode using CSS filter.
 * The source logo is dark text on transparent, so we invert + adjust in dark mode.
 */
export default function BrandLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={pixoranestLogoDark}
      alt="PixoraNest"
      className={`${className} dark:brightness-0 dark:invert`}
    />
  );
}
