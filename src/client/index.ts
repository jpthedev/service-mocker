import {
  IMockerClient,
} from './client';

import { ModernClient } from './modern/client';
import { LegacyClient } from './legacy/client';

export { IMockerClient };

export function createClient(
  scriptURL: string,
  force?: 'legacy' | 'modern',
): IMockerClient {
  if (force === 'legacy') {
    return new LegacyClient(scriptURL);
  }

  if (force === 'modern') {
    return new ModernClient(scriptURL);
  }

  const useLegacy = isLegacyMode();

  if (useLegacy) {
    console.warn('Switching to legacy mode...');
    return new LegacyClient(scriptURL);
  }

  return new ModernClient(scriptURL);
}

function isLegacyMode(): boolean {
  if (!('serviceWorker' in navigator)) {
    // tslint:disable-next-line max-line-length
    console.warn('Service worker is not supported in your browser, please check: http://caniuse.com/#feat=serviceworkers');

    return true;
  }

  if (location.protocol !== 'https' &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1'
  ) {
    // tslint:disable-next-line max-line-length
    console.warn('Service workers should be registered in secure pages, further information: https://github.com/w3c/ServiceWorker/blob/master/explainer.md#getting-started');

    return true;
  }

  return false;
}
