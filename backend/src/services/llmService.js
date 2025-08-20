const fetch = require('node-fetch');

class LLMService {
    constructor() {
        this.apiUrl = 'http://127.0.0.1:1234/v1';
    }

    async generateResponse(prompt) {
        try {
            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gemma-3-4b-it-qat",
                    messages: [
                        {
                            role: "system",
                            content: "When providing code examples, always wrap them in triple backticks with the appropriate language identifier. Format code properly with proper indentation."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2048,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('LLM Error:', errorText);
                throw new Error(`LLM request failed with status ${response.status}`);
            }

            const data = await response.json();
            console.log('LLM Raw response:', data);

            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Invalid response format from LLM');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('LLM Service error:', error);
            throw error;
        }
    }
}

module.exports = { LLMService };