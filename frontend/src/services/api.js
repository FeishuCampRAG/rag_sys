const API_BASE = '/api';

export const api = {
  // Documents
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  async getDocuments() {
    const response = await fetch(`${API_BASE}/documents`);
    return response.json();
  },

  async getDocument(id) {
    const response = await fetch(`${API_BASE}/documents/${id}`);
    return response.json();
  },

  async getDocumentChunks(id) {
    const response = await fetch(`${API_BASE}/documents/${id}/chunks`);
    return response.json();
  },

  async deleteDocument(id) {
    const response = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Chat
  sendMessage(message, onEvent) {
    return new Promise((resolve, reject) => {
      fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ message })
      }).then(response => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processText() {
          reader.read().then(({ done, value }) => {
            if (done) {
              resolve();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let currentEvent = '';
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7);
              } else if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  onEvent(currentEvent, data);
                } catch (e) {
                  // ignore
                }
              }
            }

            processText();
          }).catch(reject);
        }

        processText();
      }).catch(reject);
    });
  },

  async getChatHistory() {
    const response = await fetch(`${API_BASE}/chat/history`);
    return response.json();
  },

  async clearChatHistory() {
    const response = await fetch(`${API_BASE}/chat/history`, {
      method: 'DELETE'
    });
    return response.json();
  }
};
