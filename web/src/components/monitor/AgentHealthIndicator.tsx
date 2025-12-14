interface AgentHealthIndicatorProps {
    total: number;
    stats: {
        up: number;
        down: number;
        unknown: number;
    };
}

export const AgentHealthIndicator = ({ total, stats }: AgentHealthIndicatorProps) => {
    const dots = [];

    // 生成 up 的绿点
    for (let i = 0; i < stats.up; i++) {
        dots.push(
            <span
                key={`up-${i}`}
                className="inline-block h-2 w-2 rounded-full bg-emerald-500"
            />
        );
    }

    // 生成 down 的红点
    for (let i = 0; i < stats.down; i++) {
        dots.push(
            <span
                key={`down-${i}`}
                className="inline-block h-2 w-2 rounded-full bg-red-500"
            />
        );
    }

    // 生成 unknown 的灰点
    for (let i = 0; i < stats.unknown; i++) {
        dots.push(
            <span
                key={`unknown-${i}`}
                className="inline-block h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600"
            />
        );
    }

    return (
        <div className="flex items-center gap-1">
            {dots}
            <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                ({stats.up}/{total})
            </span>
        </div>
    );
};
