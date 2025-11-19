import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {App, Button, Divider, Form, Input} from 'antd';
import {LockOutlined, UserOutlined, GithubOutlined} from '@ant-design/icons';
import {getAuthConfig, getOIDCAuthURL, getGitHubAuthURL, login} from '../../api/auth';
import type {LoginRequest} from '../../types';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [oidcEnabled, setOidcEnabled] = useState(false);
    const [githubEnabled, setGithubEnabled] = useState(false);
    const [oidcLoading, setOidcLoading] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);
    const navigate = useNavigate();
    const {message: messageApi} = App.useApp();

    // 获取认证配置
    useEffect(() => {
        fetchAuthConfig();
    }, []);

    const fetchAuthConfig = async () => {
        try {
            const response = await getAuthConfig();
            setOidcEnabled(response.data.oidcEnabled);
            setGithubEnabled(response.data.githubEnabled);
        } catch (error) {
            console.error('获取认证配置失败:', error);
        }
    };

    const onFinish = async (values: LoginRequest) => {
        setLoading(true);
        try {
            const response = await login(values);
            const {token, user} = response.data;

            // 保存 token 和用户信息
            localStorage.setItem('token', token);
            localStorage.setItem('userInfo', JSON.stringify(user));

            messageApi.success('登录成功');
            navigate('/admin/agents');
        } catch (error: any) {
            messageApi.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    const handleOIDCLogin = async () => {
        setOidcLoading(true);
        try {
            const response = await getOIDCAuthURL();
            const {authUrl} = response.data;
            // 跳转到 OIDC 认证页面
            window.location.href = authUrl;
        } catch (error: any) {
            messageApi.error(error.response?.data?.message || '获取 OIDC 认证地址失败');
            setOidcLoading(false);
        }
    };

    const handleGitHubLogin = async () => {
        setGithubLoading(true);
        try {
            const response = await getGitHubAuthURL();
            const {authUrl} = response.data;
            // 跳转到 GitHub 认证页面
            window.location.href = authUrl;
        } catch (error: any) {
            messageApi.error(error.response?.data?.message || '获取 GitHub 认证地址失败');
            setGithubLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-[360px] p-8 py-12 border rounded-md border-gray-200">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-semibold mb-2">Pika 探针</h1>
                    <p className="text-base">老鸡专用监控管理平台</p>
                </div>

                <Form
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        name="username"
                        rules={[{required: true, message: '请输入用户名'}]}
                    >
                        <Input
                            prefix={<UserOutlined/>}
                            placeholder="用户名"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{required: true, message: '请输入密码'}]}
                    >
                        <Input.Password
                            prefix={<LockOutlined/>}
                            placeholder="密码"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            登录
                        </Button>
                    </Form.Item>
                </Form>

                {(oidcEnabled || githubEnabled) && (
                    <>
                        <Divider plain>或</Divider>
                        {githubEnabled && (
                            <Button
                                block
                                loading={githubLoading}
                                onClick={handleGitHubLogin}
                                icon={<GithubOutlined />}
                                className="mb-2"
                            >
                                使用 GitHub 登录
                            </Button>
                        )}
                        {oidcEnabled && (
                            <Button
                                block
                                loading={oidcLoading}
                                onClick={handleOIDCLogin}
                            >
                                使用 OIDC 登录
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;

