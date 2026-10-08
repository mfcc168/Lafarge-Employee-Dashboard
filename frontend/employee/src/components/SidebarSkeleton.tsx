export default function SidebarSkeleton() {
  return (
    <aside className="sidebar" role="status" aria-label="Loading navigation">
      <div className="brand">Lafarge</div>
      <div className="nav-list mt-12" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton h-11 mb-2" />
        ))}
      </div>
    </aside>
  );
}
