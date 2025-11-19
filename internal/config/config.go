package config

// AppConfig 应用配置
type AppConfig struct {
	JWT             JWTConfig          `mapstructure:"JWT"`
	MonitorInterval int                `mapstructure:"MonitorInterval"`
	Users           map[string]string  `mapstructure:"Users"`  // 用户名 -> bcrypt加密的密码
	OIDC            *OIDCConfig        `mapstructure:"OIDC"`   // OIDC配置（可选）
	GitHub          *GitHubOAuthConfig `mapstructure:"GitHub"` // GitHub OAuth配置（可选）
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret       string `mapstructure:"Secret"`
	ExpiresHours int    `mapstructure:"ExpiresHours"`
}

// OIDCConfig OIDC认证配置
type OIDCConfig struct {
	Enabled      bool   `mapstructure:"Enabled"`      // 是否启用OIDC
	Issuer       string `mapstructure:"Issuer"`       // OIDC Provider的Issuer URL
	ClientID     string `mapstructure:"ClientID"`     // Client ID
	ClientSecret string `mapstructure:"ClientSecret"` // Client Secret
	RedirectURL  string `mapstructure:"RedirectURL"`  // 回调URL
}

// GitHubOAuthConfig GitHub OAuth认证配置
type GitHubOAuthConfig struct {
	Enabled      bool     `mapstructure:"Enabled"`      // 是否启用GitHub登录
	ClientID     string   `mapstructure:"ClientID"`     // GitHub OAuth App Client ID
	ClientSecret string   `mapstructure:"ClientSecret"` // GitHub OAuth App Client Secret
	RedirectURL  string   `mapstructure:"RedirectURL"`  // 回调URL
	AllowedUsers []string `mapstructure:"AllowedUsers"` // 允许登录的GitHub用户名白名单（为空则允许所有用户）
}
