import { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory store for demo purposes.
// Admin can POST new posts to this endpoint. Data resets on server restart.
let posts: any[] = [
  {
    id: 1,
    title: 'RBI Announces Policy Update',
    excerpt: 'RBI updates repo rate by 25 bps — what it means for inflation and loans.',
    content: 'Detailed content goes here...',
    author: 'Admin',
    date: new Date().toISOString(),
    tags: ['Economy', 'Policy'],
  },
  {
    id: 2,
    title: 'New Education Scheme Launched',
    excerpt: 'Central govt launches initiative to support online learning.',
    content: 'Detailed content goes here...',
    author: 'Admin',
    date: new Date().toISOString(),
    tags: ['Education'],
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(posts);
  }

  if (req.method === 'POST') {
    const { title, excerpt, content, author, tags } = req.body;
    if (!title || !(excerpt || content)) {
      return res.status(400).json({ error: 'title and excerpt/content required' });
    }
    const newPost = {
      id: posts.length ? posts[0].id + 1 : 1,
      title,
      excerpt,
      content,
      author: author || 'Admin',
      date: new Date().toISOString(),
      tags: tags || [],
    };
    posts.unshift(newPost);
    return res.status(201).json(newPost);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

