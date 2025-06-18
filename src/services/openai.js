export async function fetchOpenAIReview(diff, apiKey) {
  const payload = {
    model: 'gpt-4.1',
    messages: [
      {
        role: 'system',
        content: `
      You are a senior code review assistant.

      Analyze the following git diff and return a JSON array of objects with \`path\`, \`line\`, and \`body\`.

      Only include comments for code that:
      - Is incorrect, buggy, insecure, or likely to cause problems.
      - Clearly violates best practices **in a way that could cause real issues**.

      Ignore minor stylistic issues or subjective preferences.

      Respond with JSON only. No explanation or extra text.
            `.trim(),
      },
      { role: 'user', content: diff.slice(0, 20000) },
    ],
    temperature: 0,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
