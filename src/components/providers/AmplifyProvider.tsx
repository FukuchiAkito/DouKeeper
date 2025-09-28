'use client';

import { ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { awsConfig, validateAwsConfig } from '@/lib/aws/config';

type CognitoLoginWith = {
  oauth: {
    domain: string;
    scopes: string[];
    redirectSignIn: string[];
    redirectSignOut: string[];
    responseType: 'code';
  };
};

let configured = false;

const configureAmplify = () => {
  if (configured) {
    return;
  }

  validateAwsConfig();

  const { userPoolId, userPoolWebClientId, identityPoolId, oauth } = awsConfig;

  const loginWith: CognitoLoginWith = {
    oauth: {
      domain: oauth.domain,
      scopes: oauth.scope,
      redirectSignIn: oauth.redirectSignIn,
      redirectSignOut: oauth.redirectSignOut,
      responseType: oauth.responseType,
    },
  };

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: userPoolWebClientId,
        identityPoolId: identityPoolId || undefined,
        loginWith,
      },
    },
  });

  configured = true;
};

export const AmplifyProvider = ({ children }: { children: ReactNode }) => {
  configureAmplify();
  return <>{children}</>;
};
