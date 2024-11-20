import Image from 'next/image';
import Link from 'next/link';
import { FaCalendar, FaUser, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string;
    author: string;
    date: string;
    readTime: string;
    category?: string;
  };
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group h-full overflow-hidden rounded-2xl bg-white/80 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl"
    >
      <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {post.category && (
            <span className="absolute left-4 top-4 rounded-full bg-emerald-500/90 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {post.category}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="mb-3 text-xl font-bold text-gray-900 group-hover:text-emerald-600 line-clamp-2">
            {post.title}
          </h3>
          <p className="mb-4 flex-1 text-gray-600 line-clamp-3">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <FaUser className="text-emerald-600" />
              </div>
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <FaCalendar className="text-emerald-600" />
              </div>
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <FaClock className="text-emerald-600" />
              </div>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default BlogCard;
