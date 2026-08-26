import { useEffect, useState } from 'react';
import { api } from '../api/client';

export interface ServerConfig {
  /** False on a deployment with no mail: the reset endpoint is closed there. */
  passwordResetEnabled: boolean;
  reminderEmailsEnabled: boolean;
}

/**
 * Assume everything works until told otherwise. A screen that briefly offers
 * password reset and then hides it is a smaller problem than one that hides it
 * on every slow network.
 */
const OPTIMISTIC: ServerConfig = { passwordResetEnabled: true, reminderEmailsEnabled: true };

/**
 * Fetched once per page load and shared: this never changes without a deploy,
 * and it is read from the sign-in screen, so it must not need a session.
 */
let cached: Promise<ServerConfig> | null = null;

function load(): Promise<ServerConfig> {
  cached ??= api.get<ServerConfig>('/config').catch(() => OPTIMISTIC);
  return cached;
}

export function useServerConfig(): ServerConfig {
  const [config, setConfig] = useState<ServerConfig>(OPTIMISTIC);

  useEffect(() => {
    let alive = true;
    load().then((c) => {
      if (alive) setConfig(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  return config;
}
