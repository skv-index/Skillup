/**
 * Placeholder rendered for every route until its owning part implements it.
 * Parts replace the element in router.tsx with their real page — same path.
 */
export function PlaceholderPage({
  part,
  title,
  modules,
}: {
  part: string;
  title: string;
  modules: string[];
}) {
  return (
    <div>
      <div className="page-head">
        <div className="tiny">
          {part} · placeholder — replace with real page
        </div>
        <h1 className="h2">{title}</h1>
        <p>Owned modules: {modules.join(' · ')}</p>
      </div>
      <div className="state-block">
        <div className="state-block__icon">🚧</div>
        <div className="h4">Not implemented yet</div>
        <p className="small mt-4">
          Build this page inside its owning feature folder and wire it in{' '}
          <code>src/app/router.tsx</code> keeping the same path.
        </p>
      </div>
    </div>
  );
}
