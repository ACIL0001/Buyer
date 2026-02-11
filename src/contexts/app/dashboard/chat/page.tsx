import { Metadata } from 'next';
import ChatClient from './ChatClient';

export const metadata: Metadata = {
  title: 'Chat | MazadClick',
  description: 'Chat with other users',
};

export default function ChatPage() {
  return <ChatClient />;
}
