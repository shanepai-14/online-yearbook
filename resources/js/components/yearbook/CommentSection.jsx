import axios from 'axios';
import { SendHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function formatTimestamp(isoTimestamp) {
    const date = new Date(isoTimestamp);

    if (Number.isNaN(date.getTime())) {
        return 'Just now';
    }

    return date.toLocaleString();
}

export default function CommentSection({
    type,
    targetId,
    enabled = true,
    allowSubmit = true,
    listHeightClass = 'max-h-52',
    className,
}) {
    const [comments, setComments] = useState([]);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!enabled || !type || !targetId) {
            return;
        }

        let mounted = true;

        const fetchComments = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await axios.get(`/api/comments/${type}/${targetId}`);

                if (!mounted) {
                    return;
                }

                setComments(response.data.comments ?? []);
            } catch (requestError) {
                if (!mounted) {
                    return;
                }

                setError(requestError.response?.data?.message || 'Unable to load comments.');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchComments();

        return () => {
            mounted = false;
        };
    }, [enabled, targetId, type]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!type || !targetId || submitting || !allowSubmit) {
            return;
        }

        if (message.trim() === '') {
            setError('Comment message is required.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await axios.post('/api/comments', {
                type,
                target_id: targetId,
                name: name.trim(),
                message: message.trim(),
            });

            const createdComment = response.data.comment;

            if (createdComment) {
                setComments((currentComments) => [...currentComments, createdComment]);
            }

            setMessage('');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to post comment.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!enabled) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white/60 px-3 py-2 text-xs text-slate-500">
                Swipe to this card to load comments.
            </div>
        );
    }

    return (
        <section className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Comments</h4>
                <span className="text-xs text-slate-500">{comments.length}</span>
            </div>

            <div className={cn(listHeightClass, 'space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3')}>
                {loading ? <p className="text-xs text-slate-500">Loading comments...</p> : null}

                {!loading && comments.length === 0 ? (
                    <p className="text-xs text-slate-500">No comments yet. Be the first to write one.</p>
                ) : null}

                {comments.map((comment) => (
                    <article key={comment.id} className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold text-slate-800">{comment.name || 'Anonymous'}</p>
                            <p className="text-[11px] text-slate-400">{formatTimestamp(comment.created_at)}</p>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">{comment.message}</p>
                    </article>
                ))}
            </div>

            {allowSubmit ? (
                <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="space-y-1">
                        <Label htmlFor={`guest-name-${type}-${targetId}`} className="text-xs uppercase tracking-wide text-slate-500">
                            Name (Optional)
                        </Label>
                        <Input
                            id={`guest-name-${type}-${targetId}`}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={120}
                            placeholder="Leave blank for random anonymous name"
                            className="h-9"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor={`guest-message-${type}-${targetId}`} className="sr-only">
                            Comment
                        </Label>
                        <div className="relative">
                            <Input
                                id={`guest-message-${type}-${targetId}`}
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                maxLength={1000}
                                placeholder="Write a comment..."
                                className="h-11 rounded-full border-slate-300 pr-12"
                            />
                            <button
                                type="submit"
                                aria-label={submitting ? 'Posting comment' : 'Send comment'}
                                disabled={submitting || message.trim() === ''}
                                className={cn(
                                    'absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition',
                                    submitting || message.trim() === ''
                                        ? 'cursor-not-allowed bg-slate-300 text-white'
                                        : 'bg-slate-900 text-white hover:bg-slate-800',
                                )}
                            >
                                <SendHorizontal className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {error ? <p className="text-xs text-red-600">{error}</p> : null}
                </form>
            ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Read-only preview. Commenting is disabled.
                </div>
            )}
        </section>
    );
}
