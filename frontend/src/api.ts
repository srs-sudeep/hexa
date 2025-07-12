import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8050',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat interface types
export interface ChatRequest {
  query: string;
}

export interface ChatResponse {
  action_type: string;
  target_page?: string;
  route?: string;
  api_call?: {
    method: string;
    endpoint: string;
    data?: any;
  };
  message: string;
}

// Chat API function
export const sendChatMessage = async (query: string): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat', { query });
  return response.data;
};

// Legacy function for compatibility
export const sendChat = async (query: string) => {
  const response = await fetch("http://localhost:8050/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return response.json();
};
