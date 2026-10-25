import { GraduationCap, Search, FileSearch } from "lucide-react";
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-icon">
        <GraduationCap size={29} />
        <Search size={21} />
      </span>
      <span>
        AUDI<span>TRACE</span>
      </span>
    </span>
  );
}
export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return (
    <span className={"avatar tone-" + (index % 4)}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
export function Badge({
  children,
  kind = "blue",
}: {
  children: React.ReactNode;
  kind?: string;
}) {
  return <span className={"badge " + kind}>{children}</span>;
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <FileSearch size={32} />
      <p>{children}</p>
    </div>
  );
}
export function CardHeading({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
}) {
  return (
    <div className="card-heading">
      <span className="feature-icon blue">{icon}</span>
      <div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
    </div>
  );
}
