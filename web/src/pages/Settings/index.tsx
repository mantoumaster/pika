import {Tabs} from 'antd';
import {Bell, MessageSquare, Settings2, Database} from 'lucide-react';
import AlertSettings from './AlertSettings';
import NotificationChannels from './NotificationChannels';
import SystemConfig from './SystemConfig';
import MetricsConfig from './MetricsConfig';
import {PageHeader} from "../../components";

const Settings = () => {
    const items = [
        {
            key: 'system',
            label: (
                <span className="flex items-center gap-2">
                    <Settings2 size={16}/>
                    系统配置
                </span>
            ),
            children: <SystemConfig/>,
        },
        {
            key: 'metrics',
            label: (
                <span className="flex items-center gap-2">
                    <Database size={16}/>
                    指标数据配置
                </span>
            ),
            children: <MetricsConfig/>,
        },
        {
            key: 'channels',
            label: (
                <span className="flex items-center gap-2">
                    <MessageSquare size={16}/>
                    通知渠道
                </span>
            ),
            children: <NotificationChannels/>,
        },
        {
            key: 'alert',
            label: (
                <span className="flex items-center gap-2">
                    <Bell size={16}/>
                    告警规则
                </span>
            ),
            children: <AlertSettings/>,
        },
    ];

    return (
        <div className={'space-y-6'}>
            <PageHeader
                title="系统设置"
                description="CONFIGURATION"
            />
            <Tabs defaultActiveKey="system"
                  tabPosition={'left'}
                  items={items}
            />
        </div>
    );
};

export default Settings;
