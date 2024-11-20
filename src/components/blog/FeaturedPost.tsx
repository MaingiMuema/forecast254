import Image from 'next/image';
import Link from 'next/link';
import { FaCalendar, FaUser, FaClock, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface FeaturedPostProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string;
    author: string;
    date: string;
    readTime: string;
  };
}

const FeaturedPost: React.FC<FeaturedPostProps> = ({ post }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-xl"
    >
      <div className="absolute inset-0 bg-black/20">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover mix-blend-overlay transition-transform duration-500 group-hover:scale-105"
          priority
        />
      </div>
      <div className="relative z-10 p-8 md:p-12">
        <div className="flex flex-col items-start space-y-4">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm"
          >
            Featured Post
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white md:text-4xl lg:text-5xl"
          >
            {post.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-white/90 md:w-3/4"
          >
            {post.excerpt}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex w-full flex-col justify-between space-y-4 text-white/90 sm:flex-row sm:items-center sm:space-y-0"
          >
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <FaUser className="text-white" />
                </div>
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <FaCalendar className="text-white" />
                </div>
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <FaClock className="text-white" />
                </div>
                <span>{post.readTime}</span>
              </div>
            </div>
            <Link
              href={`/blog/${post.slug}`}
              className="group/link inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <span>Read Article</span>
              <FaArrowRight className="transition-transform group-hover/link:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default FeaturedPost;
