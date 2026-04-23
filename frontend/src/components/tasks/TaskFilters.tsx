import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { TaskPriority, TaskStatus } from "@/types/task";
import type { TaskFilters as FiltersType } from "@/types/task";

/**
 * @module components/tasks/TaskFilters
 * @description Barre de filtres : recherche, statut, priorité, tri et ordre.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

interface TaskFiltersProps {
  filters: FiltersType;
  onChange: (partial: Partial<FiltersType>) => void;
}

/**
 * @function TaskFiltersBar
 * @description Barre de filtres complète pour la liste des tâches.
 *
 * @param {TaskFiltersProps} props
 * @returns {JSX.Element}
 */
export function TaskFiltersBar({ filters, onChange }: TaskFiltersProps) {
  const { t } = useTranslation();

  const sel =
    "px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
      {/* Recherche */}
      <div className="relative flex-1 min-w-48">
        <Search
          size={15}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(e) =>
            onChange({ search: e.target.value || undefined, page: 1 })
          }
          placeholder={t("actions.search")}
          className={`${sel} pl-8 w-full`}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Filtre statut */}
        <select
          value={filters.status ?? ""}
          onChange={(e) =>
            onChange({
              status: (e.target.value as TaskStatus) || undefined,
              page: 1,
            })
          }
          className={sel}
        >
          <option value="">{t("filters.all")}</option>
          {Object.values(TaskStatus).map((s) => (
            <option key={s} value={s}>
              {t(`task.status.${s.toLowerCase()}`)}
            </option>
          ))}
        </select>

        {/* Filtre priorité */}
        <select
          value={filters.priority ?? ""}
          onChange={(e) =>
            onChange({
              priority: (e.target.value as TaskPriority) || undefined,
              page: 1,
            })
          }
          className={sel}
        >
          <option value="">{t("filters.all")}</option>
          {Object.values(TaskPriority).map((p) => (
            <option key={p} value={p}>
              {t(`task.priority.${p.toLowerCase()}`)}
            </option>
          ))}
        </select>

        {/* Tri */}
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value, page: 1 })}
          className={sel}
        >
          {["createdAt", "updatedAt", "dueDate", "priority", "title"].map(
            (s) => (
              <option key={s} value={s}>
                {t(`filters.sorts.${s}`)}
              </option>
            ),
          )}
        </select>

        {/* Ordre */}
        <select
          value={filters.order}
          onChange={(e) =>
            onChange({ order: e.target.value as "ASC" | "DESC", page: 1 })
          }
          className={sel}
        >
          <option value="DESC">{t("filters.order.DESC")}</option>
          <option value="ASC">{t("filters.order.ASC")}</option>
        </select>
      </div>
    </div>
  );
}
