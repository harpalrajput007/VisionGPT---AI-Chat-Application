const fetch = require('node-fetch');

// LLM service with env-driven configuration and robust error handling
class LLMService {
  constructor() {
    // Prefer public/hosted URL for Render; fall back to local LM Studio for dev
    const base = process.env.LLM_API_URL || process.env.LM_STUDIO_API_URL || 'http://127.0.0.1:1234/v1';
    this.apiUrl = base.replace(/\/$/, ''); // ensure no trailing slash

    // Optional API key for hosted providers
    this.apiKey = process.env.LLM_API_KEY || '';

    // Allow overriding model and timeout via env
    this.defaultModel = process.env.LLM_MODEL || 'gemma-3-4b-it-qat';
    this.timeoutMs = Number(process.env.LLM_TIMEOUT_MS || 30000);
  }

  // Generate a single response given a user prompt
  async generateResponse(prompt) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const payload = {
      model: this.defaultModel,
      messages: [
        {
          role: 'system',
          content:
            'When providing code examples, always wrap them in triple backticks with the appropriate language identifier. Format code properly with proper indentation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    };

    let response;
    try {
      response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        // node-fetch v2 timeout (ms)
        timeout: this.timeoutMs,
      });
    } catch (err) {
      console.error('LLM network error:', err);
      throw err;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('LLM Error:', errorText);
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error('LLM JSON parse error:', err);
      throw new Error('Failed to parse LLM response JSON');
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error('LLM invalid response shape:', data);
      throw new Error('Invalid response format from LLM');
    }

    return content;
  }
}

module.exports = { LLMService };