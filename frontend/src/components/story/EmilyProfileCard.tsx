import type { EmilyProfile } from "../../types/emily";

interface EmilyProfileCardProps {
  profile: EmilyProfile;
}

export function EmilyProfileCard({ profile }: EmilyProfileCardProps) {
  const fields = [
    { label: "Age", value: `${profile.age}` },
    { label: "Occupation", value: profile.occupation },
    { label: "Tracking period", value: profile.trackingPeriod },
    { label: "Devices", value: profile.devices },
    { label: "Main concern", value: profile.mainConcern },
  ];

  return (
    <div className="story-card flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-health-100 to-violet-100 text-3xl">
        👩‍💻
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-slate-900">{profile.name}</h3>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {f.label}
              </dt>
              <dd className="text-sm font-medium text-slate-800">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
