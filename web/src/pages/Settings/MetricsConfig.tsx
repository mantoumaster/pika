import {useEffect} from 'react';
import {App, Button, Card, Form, InputNumber, Space, Spin} from 'antd';
import {Database, Clock, BarChart3} from 'lucide-react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type {MetricsConfig} from '../../api/metrics-config';
import {getMetricsConfig, saveMetricsConfig} from '../../api/metrics-config';
import {getErrorMessage} from '../../lib/utils';

const MetricsConfigComponent = () => {
    const [form] = Form.useForm();
    const {message: messageApi} = App.useApp();
    const queryClient = useQueryClient();

    // 获取指标配置
    const {data: metricsConfig, isLoading} = useQuery({
        queryKey: ['metricsConfig'],
        queryFn: getMetricsConfig,
    });

    // 保存指标配置 mutation
    const saveMutation = useMutation({
        mutationFn: saveMetricsConfig,
        onSuccess: () => {
            messageApi.success('配置保存成功');
            queryClient.invalidateQueries({queryKey: ['metricsConfig']});
        },
        onError: (error: unknown) => {
            messageApi.error(getErrorMessage(error, '保存配置失败'));
        },
    });

    // 初始化表单
    useEffect(() => {
        if (metricsConfig) {
            form.setFieldsValue({
                retentionHours: metricsConfig.retentionHours,
                maxQueryPoints: metricsConfig.maxQueryPoints,
            });
        }
    }, [metricsConfig, form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            saveMutation.mutate({
                retentionHours: values.retentionHours,
                maxQueryPoints: values.maxQueryPoints,
            } as MetricsConfig);
        } catch (error) {
            // 表单验证失败
        }
    };

    const handleReset = () => {
        if (metricsConfig) {
            form.setFieldsValue({
                retentionHours: metricsConfig.retentionHours,
                maxQueryPoints: metricsConfig.maxQueryPoints,
            });
        }
    };

    // 计算保留天数
    const getRetentionDays = (hours: number) => {
        return (hours / 24).toFixed(1);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spin size="large"/>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Database size={20}/>
                    指标数据配置
                </h2>
                <p className="text-gray-500 mt-2">配置监控指标数据的保留时长和查询限制，优化存储空间和查询性能</p>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Space direction="vertical" className="w-full" size="large">
                    {/* 数据保留策略 */}
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <Clock size={18}/>
                                <span>数据保留策略</span>
                            </div>
                        }
                        type="inner"
                    >
                        <Form.Item
                            label="数据保留时长"
                            name="retentionHours"
                            rules={[
                                {required: true, message: '请输入数据保留时长'},
                                {
                                    type: 'number',
                                    min: 24,
                                    max: 720,
                                    message: '保留时长必须在 24-720 小时之间（1-30天）'
                                },
                            ]}
                            tooltip="原始指标数据和聚合数据的保留时长，超过此时长的数据将被自动清理"
                        >
                            <InputNumber
                                min={24}
                                max={720}
                                step={24}
                                addonAfter="小时"
                                style={{width: 200}}
                                placeholder="168"
                            />
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {({getFieldValue}) => {
                                const hours = getFieldValue('retentionHours');
                                return hours ? (
                                    <div className="mb-4 text-sm text-gray-500">
                                        当前设置约为 <span
                                        className="font-semibold text-blue-600">{getRetentionDays(hours)}</span> 天
                                    </div>
                                ) : null;
                            }}
                        </Form.Item>

                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                                <div className="font-semibold flex items-center gap-2">
                                    💡 保留策略说明
                                </div>
                                <ul className="list-disc list-inside space-y-1.5 ml-2">
                                    <li>系统会保留<strong>原始数据</strong>和<strong>3种粒度的聚合数据</strong>（1分钟、5分钟、1小时）</li>
                                    <li>聚合数据自动生成，用于优化长时间范围的查询性能</li>
                                    <li>较短的保留时长可以<strong>节省存储空间</strong>，减少数据库压力</li>
                                    <li>修改后立即生效，下次清理任务时应用新策略（每小时执行一次）</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="text-sm space-y-2">
                                <div className="font-semibold text-slate-700 dark:text-slate-300">📊 推荐设置：</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="font-medium text-slate-900 dark:text-slate-100">7 天（168小时）</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">适合日常监控</div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="font-medium text-slate-900 dark:text-slate-100">14 天（336小时）</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">适合周期分析</div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="font-medium text-slate-900 dark:text-slate-100">30 天（720小时）</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">适合长期趋势</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 查询性能优化 */}
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18}/>
                                <span>查询性能优化</span>
                            </div>
                        }
                        type="inner"
                    >
                        <Form.Item
                            label="最大查询点数"
                            name="maxQueryPoints"
                            rules={[
                                {required: true, message: '请输入最大查询点数'},
                                {
                                    type: 'number',
                                    min: 100,
                                    max: 10000,
                                    message: '查询点数必须在 100-10000 之间'
                                },
                            ]}
                            tooltip="单次查询返回的最大数据点数，系统会根据此值自动选择合适的聚合粒度"
                        >
                            <InputNumber
                                min={100}
                                max={10000}
                                step={100}
                                addonAfter="个数据点"
                                style={{width: 200}}
                                placeholder="720"
                            />
                        </Form.Item>

                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="text-sm text-emerald-800 dark:text-emerald-300 space-y-2">
                                <div className="font-semibold flex items-center gap-2">
                                    ✨ 智能聚合机制
                                </div>
                                <ul className="list-disc list-inside space-y-1.5 ml-2">
                                    <li>查询时间范围越长，系统会自动使用<strong>更大粒度的聚合数据</strong></li>
                                    <li>确保返回的数据点数不超过设定的最大值，<strong>优化传输和渲染</strong></li>
                                    <li>例如：查询7天数据时自动使用1小时聚合，而不是原始秒级数据</li>
                                    <li>聚合使用<strong>MAX（最大值）</strong>策略，确保不会遗漏峰值</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                                <div className="font-semibold flex items-center gap-2">
                                    ⚠️ 性能考量
                                </div>
                                <ul className="list-disc list-inside space-y-1.5 ml-2">
                                    <li>较大的点数可以提供<strong>更精细的图表</strong>，但会增加<strong>查询时间和带宽消耗</strong></li>
                                    <li>建议值：<strong>720 个点</strong>（适合显示24小时数据，每2分钟一个点）</li>
                                    <li>前端图表通常显示 <strong>300-1000 个点</strong>效果最佳，过多的点反而影响渲染性能</li>
                                    <li>移动端建议使用<strong>较小的值</strong>（300-500），以节省流量和提升加载速度</li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* 聚合数据说明 */}
                    <Card
                        title="聚合粒度说明"
                        type="inner"
                        className="bg-slate-50 dark:bg-slate-900/50"
                    >
                        <div className="text-sm space-y-3">
                            <p className="text-slate-600 dark:text-slate-400">
                                系统会在后台自动将原始数据聚合为不同粒度的数据，以支持不同时间范围的查询：
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">1 分钟聚合</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">适合查询 15分钟 - 1小时 的数据</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">5 分钟聚合</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">适合查询 1小时 - 12小时 的数据</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">1 小时聚合</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">适合查询 12小时 - 7天 的数据</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                💡 提示：系统会自动选择最合适的聚合粒度，无需手动配置
                            </p>
                        </div>
                    </Card>

                    {/* 保存按钮 */}
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saveMutation.isPending} size="large">
                                保存配置
                            </Button>
                            <Button onClick={handleReset} size="large">
                                重置
                            </Button>
                        </Space>
                    </Form.Item>
                </Space>
            </Form>
        </div>
    );
};

export default MetricsConfigComponent;
