import { useTranslation } from "react-i18next";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import type { TaskListSummary } from "@/types/taskList";

/**
 * @module pages/DashboardPage
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

interface DashboardPageProps {
  activeList: TaskListSummary | null;
  onSelectList: (list: TaskListSummary) => void;
}

/**
 * @function DashboardPage
 * @param {DashboardPageProps} props
 * @returns {JSX.Element}
 */
export function DashboardPage({
  activeList,
}: DashboardPageProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("stats.title")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {t("app.tagline")}
        </p>
      </div>
      <StatsPanel />
      <KanbanBoard activeList={activeList} />
    </div>
  );
}
