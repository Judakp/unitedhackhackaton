import { supabase } from './supabaseClient';

export interface AnalyzeResponse {
  text: string;
  remaining: number;
  limit: number;
}

const MAX_TOPIC_LENGTH = 200;

const cleanTopic = (value: string): string =>
  value
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_TOPIC_LENGTH);

const ensureAnonymousUser = async (): Promise<void> => {
  const { data: sessionData } =
    await supabase.auth.getSession();

  if (sessionData.session) return;

  const { error } =
    await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Anonymous Supabase Auth error:', {
      message: error.message,
      name: error.name,
      status: error.status,
      code: error.code,
    });

    throw new Error(
      'Impossible de créer votre session utilisateur.'
    );
  }
};

export const analyzeCanvas = async (
  base64Image: string,
  topicA: string,
  topicB: string
): Promise<AnalyzeResponse> => {
  await ensureAnonymousUser();

  const cleanTopicA = cleanTopic(topicA);
  const cleanTopicB = cleanTopic(topicB);

  const { data, error } =
    await supabase.functions.invoke('analyze', {
      body: {
        base64Image,
        topicA: cleanTopicA,
        topicB: cleanTopicB,
      },
    });

  if (error) {
    let serverMessage = error.message;

    try {
      const context = await error.context?.json?.();
      if (context?.error) {
        serverMessage = context.error;
      }
    } catch {
      // Keep the generic error message.
    }

    throw new Error(serverMessage);
  }

  if (!data?.text) {
    throw new Error(
      'Aucune analyse exploitable n’a été générée.'
    );
  }

  return {
    text: data.text,
    remaining: Number(data.remaining ?? 0),
    limit: Number(data.limit ?? 10),
  };
};
