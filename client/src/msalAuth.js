import { PublicClientApplication } from '@azure/msal-browser';

// Replace with your Azure AD app registration details
const msalConfig = {
  auth: {
    clientId: 'YOUR_CLIENT_ID', // <-- Replace with your Azure AD Application (client) ID
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID', // <-- Replace with your Azure AD tenant ID
    redirectUri: window.location.origin,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

export async function signInAndGetToken() {
  try {
    const loginResponse = await msalInstance.loginPopup({ scopes: [
      'User.Read',
      'Files.Read.All', // Required for SharePoint file listing
      'Sites.Read.All',
    ] });
    const account = loginResponse.account;
    const tokenResponse = await msalInstance.acquireTokenSilent({
      account,
      scopes: [
        'User.Read',
        'Files.Read.All',
        'Sites.Read.All',
      ],
    });
    window.localStorage.setItem('graphToken', tokenResponse.accessToken);
    return tokenResponse.accessToken;
  } catch (err) {
    // Fallback to interactive if silent fails
    const tokenResponse = await msalInstance.acquireTokenPopup({
      scopes: [
        'User.Read',
        'Files.Read.All',
        'Sites.Read.All',
      ],
    });
    window.localStorage.setItem('graphToken', tokenResponse.accessToken);
    return tokenResponse.accessToken;
  }
}
