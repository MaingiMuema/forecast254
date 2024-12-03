import { useMemo } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  username, 
  first_name, 
  last_name, 
  avatarUrl, 
  size = 'md' 
}) => {
  const initials = useMemo(() => {
    // Try to get initials from first_name and last_name first
    if (first_name || last_name) {
      const firstInitial = first_name ? first_name[0] : '';
      const lastInitial = last_name ? last_name[0] : '';
      return (firstInitial + lastInitial).toUpperCase();
    }
    
    // Fall back to username if no first/last name
    if (username) {
      return username
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    return '??';
  }, [first_name, last_name, username]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl'
  };

  // Generate a consistent color based on name or username
  const colorIndex = useMemo(() => {
    const nameString = [first_name, last_name, username]
      .filter(Boolean)
      .join('');
    
    if (!nameString) return 0;
    
    return nameString
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  }, [first_name, last_name, username]);

  if (avatarUrl) {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <Image
          src={avatarUrl}
          alt={[first_name, last_name].filter(Boolean).join(' ') || username || 'User avatar'}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-semibold 
        text-white
        ${gradients[colorIndex]}
      `}
    >
      {initials}
    </div>
  );
};

const gradients = [
  'bg-gradient-to-br from-blue-500 to-purple-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-red-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-violet-500 to-indigo-600',
  'bg-gradient-to-br from-yellow-500 to-orange-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-fuchsia-500 to-pink-600',
];

export default UserAvatar;
