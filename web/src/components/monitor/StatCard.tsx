import type {ReactNode} from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    color?: string;
}

export const StatCard = ({title, value, icon, color = "text-white dark:text-white"}: StatCardProps) => {

    console.log(`StatCard`, title, value, icon, color)
    return (
        <div
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
            <div
                className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600/50">
                {icon}
            </div>
        </div>
    );
};
