import {formatTime} from '@/utils/util';

interface ResponseTimeRangeProps {
    min: number;
    avg: number;
    max: number;
}

export const ResponseTimeRange = ({ min, avg, max }: ResponseTimeRangeProps) => {
    return (
        <div className="text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">
                {formatTime(avg)}
            </span>
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                (范围: {formatTime(min)}-{formatTime(max)})
            </span>
        </div>
    );
};
