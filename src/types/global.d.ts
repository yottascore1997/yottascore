import { Server as SocketIOServer } from 'socket.io';

declare global {
  var io: SocketIOServer | undefined;
  var queue: string[];
  var matches: Record<string, string>;
  var quizAnswers: Record<string, { [socketId: string]: number[] }>;
  var quizQuestions: Record<string, any[]>;
} 