interface ControlSliderProps {
  readonly label: string;
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly suffix?: string;
  readonly onChange: (value: number) => void;
}

export function ControlSlider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  suffix = "%",
  onChange
}: ControlSliderProps) {
  const displayValue = suffix === "%" ? `${Math.round(value * 100)}%` : value.toFixed(2);
  const updateValue = (nextValue: string) => onChange(Number(nextValue));

  return (
    <label className="control-slider">
      <span>
        {label}
        <strong>{displayValue}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(event) => updateValue(event.currentTarget.value)}
        onChange={(event) => updateValue(event.currentTarget.value)}
      />
    </label>
  );
}
