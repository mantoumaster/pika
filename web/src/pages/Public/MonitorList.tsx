import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {AlertCircle, BarChart3, CheckCircle2, Clock, Loader2, Maximize2, Search, Server, Shield} from 'lucide-react';
import {type GetMetricsResponse, getMonitorHistory, getPublicMonitors} from '@/api/monitor.ts';
import type {PublicMonitor} from '@/types';
import {cn} from '@/lib/utils';
import {formatDateTime} from "@/utils/util.ts";
import {StatCard} from '@/components/monitor/StatCard';
import {StatusBadge} from '@/components/monitor/StatusBadge';
import {TypeIcon} from '@/components/monitor/TypeIcon';
import {CertBadge} from '@/components/monitor/CertBadge';
import {AgentHealthIndicator} from '@/components/monitor/AgentHealthIndicator';
import {MiniChart} from '@/components/monitor/MiniChart';

const LoadingSpinner = () => (
    <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600 dark:text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin"/>
            <span className="text-sm">加载监控数据中...</span>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <Shield className="mb-4 h-16 w-16 opacity-20"/>
        <p className="text-lg font-medium">暂无监控数据</p>
        <p className="mt-2 text-sm">请先在管理后台添加监控任务</p>
    </div>
);

type DisplayMode = 'avg' | 'max';
type FilterStatus = 'all' | 'up' | 'down' | 'unknown';

// 监控卡片组件 - 单独抽出以便使用独立的历史数据查询
const MonitorCard = ({
                         monitor,
                         displayMode,
                         onClick
                     }: {
    monitor: PublicMonitor;
    displayMode: DisplayMode;
    onClick: () => void;
}) => {
    // 为每个监控卡片查询历史数据（15分钟）
    const {data: historyData} = useQuery<GetMetricsResponse>({
        queryKey: ['monitorHistory', monitor.id, '15m'],
        queryFn: async () => {
            const response = await getMonitorHistory(monitor.id, '1h');
            return response.data;
        },
        refetchInterval: 60000, // 1分钟刷新一次
        staleTime: 30000, // 30秒内认为数据是新鲜的
    });

    // 将 VictoriaMetrics 的时序数据转换为图表数据（使用平均值或最大值）
    const chartData = useMemo(() => {
        if (!historyData || !historyData.series || historyData.series.length === 0) {
            return [];
        }

        // 创建一个时间戳到数据点的映射
        const timeMap = new Map<number, number[]>();

        // 遍历所有系列（每个探针一个系列）
        historyData.series.forEach(series => {
            if (series.data && series.data.length > 0) {
                series.data.forEach(point => {
                    if (!timeMap.has(point.timestamp)) {
                        timeMap.set(point.timestamp, []);
                    }
                    timeMap.get(point.timestamp)!.push(point.value);
                });
            }
        });

        // 转换为图表数据格式，并计算聚合值
        const result = Array.from(timeMap.entries())
            .map(([timestamp, values]) => {
                let aggregatedValue: number;
                if (displayMode === 'avg') {
                    // 计算平均值
                    aggregatedValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
                } else {
                    // 使用最大值
                    aggregatedValue = Math.max(...values);
                }

                return {
                    time: new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                    value: aggregatedValue,
                };
            });

        return result;
    }, [historyData, displayMode]);

    const displayValue = displayMode === 'avg' ? monitor.responseTime : monitor.responseTimeMax;
    const displayLabel = displayMode === 'avg' ? '平均延迟' : '最差节点延迟';

    return (
        <div
            onClick={onClick}
            className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer overflow-hidden relative"
        >
            <div className="p-5">
                {/* 头部：图标、名称、状态 */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <TypeIcon type={monitor.type}/>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                {monitor.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-0.5 truncate">
                                {monitor.showTargetPublic ? monitor.target : '******'}
                            </p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                        <StatusBadge status={monitor.status}/>
                    </div>
                </div>

                {/* 探针健康度 */}
                {monitor.agentStats && monitor.agentCount > 0 && (
                    <div className="mb-4">
                        <AgentHealthIndicator
                            total={monitor.agentCount}
                            stats={monitor.agentStats}
                        />
                    </div>
                )}

                {/* 指标信息 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mb-1 flex items-center gap-1">
                            {displayLabel}
                            {monitor.agentCount > 0 && (
                                <span
                                    className="bg-slate-200 dark:bg-slate-700 text-[10px] px-1.5 rounded-full text-slate-600 dark:text-slate-300">
                                    {monitor.agentCount} 节点
                                </span>
                            )}
                        </p>
                        <p className={cn(
                            "text-xl font-bold flex items-end gap-1",
                            displayValue > 200 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-200'
                        )}>
                            {displayValue} <span
                            className="text-xs font-normal text-slate-500 dark:text-slate-500 mb-1">ms</span>
                        </p>
                    </div>
                    <div>
                        {monitor.type === 'https' && monitor.certExpiryTime ? (
                            <>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">SSL 证书</p>
                                <CertBadge
                                    expiryTime={monitor.certExpiryTime}
                                    daysLeft={monitor.certDaysLeft}
                                />
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">上次检测</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {formatDateTime(monitor.lastCheckTime)}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* 迷你走势图 */}
                <MiniChart
                    data={chartData}
                    status={monitor.status}
                    id={monitor.id}
                />
            </div>
        </div>
    );
};

interface Stats {
    total: number;
    online: number;
    issues: number;
    avgLatency: number;
}

const MonitorList = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('max');

    const {data: monitors = [], isLoading} = useQuery<PublicMonitor[]>({
        queryKey: ['publicMonitors'],
        queryFn: async () => {
            const response = await getPublicMonitors();
            return response.data || [];
        },
        refetchInterval: 30000, // 30秒刷新一次
    });

    let [stats, setStats] = useState<Stats>();

    // 过滤和搜索
    const filteredMonitors = useMemo(() => {
        let result = monitors;

        // 状态过滤
        if (filter !== 'all') {
            result = result.filter(m => m.status === filter);
        }

        // 搜索过滤
        if (searchKeyword.trim()) {
            const keyword = searchKeyword.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(keyword) ||
                m.target.toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [monitors, filter, searchKeyword]);

    // 统计信息
    const calculateStats = (monitors: PublicMonitor[]) => {
        const total = monitors.length;
        const online = monitors.filter(m => m.status === 'up').length;
        const issues = total - online;
        const avgLatency = total > 0
            ? Math.round(monitors.reduce((acc, curr) => acc + curr.responseTime, 0) / total)
            : 0;
        return {total, online, issues, avgLatency};
    }
    useEffect(() => {
        let stats = calculateStats(monitors);
        setStats(stats);
    }, [monitors]);

    console.log(`stats`, stats)

    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <LoadingSpinner/>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="监控服务总数"
                    value={stats?.total}
                    icon={<Server className="w-5 h-5 text-slate-400"/>}
                    color="text-gray-700 dark:text-gray-400"
                />
                <StatCard
                    title="系统正常"
                    value={stats?.online}
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400"/>}
                    color="text-emerald-700 dark:text-emerald-400"
                />
                <StatCard
                    title="异常服务"
                    value={stats?.issues}
                    icon={<AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400"/>}
                    color={stats?.issues > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}
                />
                <StatCard
                    title="全局平均延迟"
                    value={`${stats?.avgLatency}ms`}
                    icon={<Clock className="w-5 h-5 text-blue-500 dark:text-blue-400"/>}
                    color="text-gray-700 dark:text-gray-400"
                />
            </div>

            {/* 过滤和搜索 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                    {/* 状态过滤 */}
                    <div
                        className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {(['all', 'up', 'down', 'unknown'] as const).map(f => {
                            const labels = {all: '全部', up: '正常', down: '异常', unknown: '未知'};
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                        filter === f
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    )}
                                >
                                    {labels[f]}
                                </button>
                            );
                        })}
                    </div>

                    {/* 显示模式切换 */}
                    <div
                        className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-500 px-2">卡片指标:</span>
                        <button
                            onClick={() => setDisplayMode('avg')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1",
                                displayMode === 'avg'
                                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            )}
                        >
                            <BarChart3 className="w-3 h-3"/> 平均
                        </button>
                        <button
                            onClick={() => setDisplayMode('max')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1",
                                displayMode === 'max'
                                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            )}
                        >
                            <Maximize2 className="w-3 h-3"/> 最差(Max)
                        </button>
                    </div>
                </div>

                {/* 搜索框 */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                    <input
                        type="text"
                        placeholder="搜索服务名称或地址..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-900 dark:text-slate-200"
                    />
                </div>
            </div>

            {/* 监控卡片列表 */}
            {filteredMonitors.length === 0 ? (
                <EmptyState/>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMonitors.map(monitor => (
                        <MonitorCard
                            key={monitor.id}
                            monitor={monitor}
                            displayMode={displayMode}
                            onClick={() => navigate(`/monitors/${encodeURIComponent(monitor.id)}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MonitorList;
