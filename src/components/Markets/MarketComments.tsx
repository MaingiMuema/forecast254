'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { FaHeart, FaRegHeart, FaReply, FaEdit, FaTrash } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

type CommentWithProfile = Database['public']['Tables']['market_comments']['Row'] & {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
};

interface Comment extends Omit<CommentWithProfile, 'profiles'> {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  isLiked?: boolean;
}

interface MarketCommentsProps {
  marketId: string;
}

export default function MarketComments({ marketId }: MarketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchComments();
    subscribeToComments();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchComments();
    }, 1000); // Poll every second

    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [marketId]);

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`market_comments_${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_comments',
          filter: `market_id=eq.${marketId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchComments = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching) return;

    try {
      setIsFetching(true);
      const { data: commentsData, error } = await supabase
        .from('market_comments')
        .select(`
          *,
          profiles!inner (
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('market_id', marketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to match our Comment type
      const transformedComments: Comment[] = (commentsData || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user_id: comment.user_id,
        market_id: comment.market_id,
        parent_id: comment.parent_id,
        likes_count: comment.likes_count,
        is_edited: comment.is_edited,
        profiles: {
          first_name: comment.profiles.first_name,
          last_name: comment.profiles.last_name,
          username: comment.profiles.username,
          avatar_url: comment.profiles.avatar_url
        },
        isLiked: false
      }));

      // Fetch likes for the current user
      if (user) {
        const { data: likes } = await supabase
          .from('market_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);

        const likedCommentIds = new Set(likes?.map(like => like.comment_id));
        transformedComments.forEach(comment => {
          comment.isLiked = likedCommentIds.has(comment.id);
        });
      }

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    try {
      const { error } = await supabase.from('market_comments').insert({
        market_id: marketId,
        user_id: user.id,
        content: newComment,
        parent_id: replyTo,
      });

      if (error) throw error;

      setNewComment('');
      setReplyTo(null);
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('market_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('market_comment_likes').insert({
          comment_id: commentId,
          user_id: user.id,
        });

        if (error) throw error;
      }

      // Update local state
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes_count: isLiked ? comment.likes_count - 1 : comment.likes_count + 1,
            isLiked: !isLiked,
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('market_comments')
        .update({
          content: editContent,
          is_edited: true,
        })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingComment(null);
      setEditContent('');
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('market_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-10 w-10 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 rounded bg-muted"></div>
              <div className="h-4 w-3/4 rounded bg-muted"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Comments</h2>
        <span className="text-sm text-muted-foreground">
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "What are your thoughts?" : "Please sign in to comment"}
          disabled={!user}
          className="min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!user || !newComment.trim()}
          >
            Post Comment
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="relative">
            <div className="flex space-x-4">
              <Avatar>
                <AvatarImage src={comment.profiles.avatar_url || undefined} />
                <AvatarFallback>
                  {comment.profiles.first_name || comment.profiles.last_name
                    ? `${(comment.profiles.first_name?.[0] || '').toUpperCase()}${(comment.profiles.last_name?.[0] || '').toUpperCase()}`
                    : comment.profiles.username?.[0].toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {comment.profiles.first_name && comment.profiles.last_name
                      ? `${comment.profiles.first_name} ${comment.profiles.last_name}`
                      : comment.profiles.username || 'Anonymous'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {comment.is_edited && (
                    <span className="text-sm text-muted-foreground">(edited)</span>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{comment.content}</p>
                )}

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLikeComment(comment.id, comment.isLiked || false)}
                    className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    disabled={!user}
                  >
                    {comment.isLiked ? (
                      <FaHeart className="w-4 h-4 text-red-500" />
                    ) : (
                      <FaRegHeart className="w-4 h-4" />
                    )}
                    <span>{comment.likes_count}</span>
                  </button>

                  <button
                    onClick={() => setReplyTo(comment.id)}
                    className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    disabled={!user}
                  >
                    <FaReply className="w-4 h-4" />
                    <span>Reply</span>
                  </button>

                  {user?.id === comment.user_id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="flex items-center space-x-1 text-sm text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <FaTrash className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Reply Form */}
            {replyTo === comment.id && (
              <div className="mt-4 ml-14">
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-[100px]"
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={!newComment.trim()}
                    >
                      Reply
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
