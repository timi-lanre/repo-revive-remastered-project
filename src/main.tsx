
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App.tsx';
import './index.css';
import { cognitoConfig } from './config/cognito.ts';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: cognitoConfig.region,
    userPoolId: cognitoConfig.userPoolId,
    userPoolWebClientId: cognitoConfig.userPoolWebClientId,
  },
});

createRoot(document.getElementById("root")!).render(<App />);
