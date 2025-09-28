// AWS Amplify configuration values shared across the app
const parseList = (value: string | undefined) =>
  (value || '')
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseRedirects = (value: string | undefined, fallback?: string) => {
  const items = parseList(value);
  if (items.length > 0) {
    return items;
  }
  return fallback ? [fallback] : [];
};

const defaultScopes = parseList(process.env.NEXT_PUBLIC_OAUTH_SCOPES);
const signInRedirects = parseRedirects(process.env.NEXT_PUBLIC_SIGN_IN_REDIRECT, 'http://localhost:3000');
const signOutRedirects = parseRedirects(process.env.NEXT_PUBLIC_SIGN_OUT_REDIRECT, 'http://localhost:3000');

export const awsConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1',
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
  userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
  identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || '',
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    'https://s2ebljb1r0.execute-api.ap-northeast-1.amazonaws.com/dev',
  oauth: {
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
    scope: defaultScopes.length > 0 ? defaultScopes : ['openid', 'email', 'profile'],
    redirectSignIn: signInRedirects,
    redirectSignOut: signOutRedirects,
    responseType: 'code' as const,
  },
} as const;

// Validate required configuration (throws early during startup)
export const validateAwsConfig = () => {
  const required = ['userPoolId', 'userPoolWebClientId', 'apiUrl'] as const;

  for (const key of required) {
    if (!awsConfig[key]) {
      throw new Error(`Missing required AWS configuration: ${key}`);
    }
  }

  const oauthRequired = ['domain', 'redirectSignIn', 'redirectSignOut'] as const;

  for (const key of oauthRequired) {
    const value = awsConfig.oauth[key];
    if (Array.isArray(value)) {
      if (value.length === 0) {
        throw new Error(`Missing required AWS OAuth configuration: ${key}`);
      }
    } else if (!value) {
      throw new Error(`Missing required AWS OAuth configuration: ${key}`);
    }
  }

  return true;
};
