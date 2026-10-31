type StatusType =
  | "draft"
  | "published"
  | "archived"
  | "in_progress"
  | "submitted"
  | "evaluated"
  | "expired"
  | "abandoned"
  | "active"
  | "inactive";

interface StatusBadgeProps {
  status: StatusType | string;
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-orange-100 text-orange-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-indigo-100 text-indigo-700",
  evaluated: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-700",
  abandoned: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const normalizedStatus = status.toLowerCase();

  const styles = statusStyles[normalizedStatus] ?? "bg-gray-100 text-gray-700";

  const label = normalizedStatus.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
