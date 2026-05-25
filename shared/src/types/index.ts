export type ApiResponse = {
  message: string;
  success: true;
}

export type Message = {
  id: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  createdAt: string;
  sender?: {
    name: string;
    role: string;
  };
}
