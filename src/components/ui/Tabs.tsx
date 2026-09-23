export interface TabItem {
  key: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={t.key === active}
          className={`tabs__btn ${t.key === active ? 'tabs__btn--active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
