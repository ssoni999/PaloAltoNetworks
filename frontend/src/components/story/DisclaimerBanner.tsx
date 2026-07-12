interface DisclaimerBannerProps {
  text?: string;
}

export function DisclaimerBanner({
  text = "These findings are behavioral insights based on observed associations. They are not medical diagnoses or medical advice.",
}: DisclaimerBannerProps) {
  return (
    <div
      className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="note"
    >
      <span className="font-semibold">Disclaimer: </span>
      {text}
    </div>
  );
}
