export interface Site {
  NAME: string;
  EMAIL: string;
}

export interface Metadata {
  TITLE: string;
  DESCRIPTION: string;
}

export type Socials = {
  NAME: string;
  HREF: string;
}[];

// notions
export interface Blog {
  id: string;
  cover: string;
  title: string;
  description: string;
  createdAt: Date | string;
  lastUpdateAt: Date | string;
  slug: string;
  readTime: string;
}

