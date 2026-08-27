import React, { useState } from "react";
import { createPortal } from "react-dom";
import DOMPurify from "dompurify";
import { Heart, MessageCircle, Pencil, Trash2, ChevronDown, ChevronLeft, ChevronRight, UserCircle, Send, Upload, X } from "lucide-react";
import { API_BASE_URL } from "../../config";
import UserBadge from "../UserBadge";
import ShareLinkButton from "../ShareLinkButton";

/**
 * Reusable PostCard component adhering to the single visual language design brief.
 *
 * Palette Tokens:
 * - ink: #2C1810
 * - ink-soft: #6B4A38
 * - clay: #A07855
 * - clay-deep: #8A6A4D
 * - sand: #E5D9C8
 * - sand-light: #F5EFE6
 * - cream: #F8F4EA
 * - like: #EF4444
 */
const PostCard = ({
  post,
  isOwner = false,
  showAuthor = true,
  isLiked = false,
  likeCount = 0,
  comments = [],
  onLike,
  onCommentSubmit,
  onDeleteComment,
  onEditSave,
  onDeletePost,
  onShareCount,
  onAuthorClick,
  onCardClick,
  showImageGallery = true,
  className = "",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post?.caption || "");
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const [editImagesChanged, setEditImagesChanged] = useState(false);
  const [editImageError, setEditImageError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { postId, commentId } when modal is open
  const [replyingTo, setReplyingTo] = useState(null); // { id: commentId, username: string }

  // Derive the logged-in user's ID so comment authors can delete their own comments
  const _storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
  const currentUserId = _storedUser?._id || _storedUser?.id || null;

  if (!post) return null;

  const imageSource = post.imageUrls?.[0] || post.imageUrl || post.image;
  const imageUrl = imageSource
    ? (imageSource.startsWith("http") ? imageSource : `${API_BASE_URL}${imageSource}`)
    : null;
  const imageSources = (post.imageUrls?.length ? post.imageUrls : [imageSource])
    .filter(Boolean)
    .map((source) => source.startsWith("http") ? source : `${API_BASE_URL}${source}`);
  const displayedImageUrl = imageSources[currentImageIndex] || imageUrl;

  const captionText = post.caption || post.description || post.text || "";
  const authorName = post.userId?.username || post.user?.username || post.authorName || "Anonymous";
  const authorId = post.userId?._id || post.userId?.id || post.user?._id || post.user?.id || post.userId || post.user;
  const userType = post.userId?.userType || post.user?.userType;
  const isVet = post.userId?.isVeterinarian || post.user?.isVeterinarian;
  const createdAt = post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : null;

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 300);
    if (onLike) onLike(post._id);
  };

  // Seed the edit form from the post's current values every time editing starts
  const handleStartEdit = (e) => {
    if (e) e.stopPropagation();
    setEditCaption(captionText);
    setEditImageFiles([]);
    setEditImagePreviews(imageSources);
    setEditImagesChanged(false);
    setEditImageError("");
    setIsEditing(true);
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );
    if (selectedFiles.length !== validFiles.length) {
      setEditImageError("Only image files up to 5MB can be uploaded.");
    } else if (validFiles.length > 20) {
      setEditImageError("You can upload up to 20 photos.");
    } else {
      setEditImageError("");
    }
    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }
    const existingFiles = editImagesChanged ? editImageFiles : [];
    const newFiles = validFiles.filter((file) => !existingFiles.some(
      (image) => image.name === file.name && image.size === file.size
    ));
    if (existingFiles.length + newFiles.length > 20) {
      setEditImageError("You can upload up to 20 photos.");
      e.target.value = "";
      return;
    }
    if (newFiles.length < validFiles.length) setEditImageError("Duplicate photos were skipped.");
    const filesToUse = [...existingFiles, ...newFiles];
    if (!editImagesChanged) {
      setEditImagePreviews([]);
    }
    setEditImageFiles(filesToUse);
    setEditImagePreviews((previews) => [
      ...(editImagesChanged ? previews : []),
      ...newFiles.map((file) => URL.createObjectURL(file)),
    ]);
    setEditImagesChanged(true);
    e.target.value = "";
  };

  const handleRemoveEditImage = (index) => {
    const preview = editImagePreviews[index];
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setEditImageFiles((files) => files.filter((_, itemIndex) => itemIndex !== index));
    setEditImagePreviews((previews) => previews.filter((_, itemIndex) => itemIndex !== index));
    setEditImageError("");
  };

  const handleRemoveAllEditImages = () => {
    editImagePreviews.filter((preview) => preview.startsWith("blob:")).forEach(URL.revokeObjectURL);
    setEditImageFiles([]);
    setEditImagePreviews([]);
    setEditImageError("");
  };

  const handleCancelEdit = () => {
    editImagePreviews.filter((preview) => preview.startsWith("blob:")).forEach(URL.revokeObjectURL);
    setEditImageFiles([]);
    setEditImagesChanged(false);
    setEditImageError("");
    setIsEditing(false);
  };

  const handleSaveEditSubmit = async (e) => {
    e.preventDefault();
    if (!onEditSave) return;
    setIsSaving(true);
    try {
      // A selected set replaces the post's current photos; no selection keeps them unchanged.
      await onEditSave(post._id, editCaption, editImageFiles);
      editImagePreviews.filter((preview) => preview.startsWith("blob:")).forEach(URL.revokeObjectURL);
      setEditImageFiles([]);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving post:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommentFormSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !onCommentSubmit) return;
    setSubmittingComment(true);
    try {
      await onCommentSubmit(post._id, commentText.trim(), replyingTo?.id || null);
      setCommentText("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Error submitting comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const sanitizedCaption = DOMPurify.sanitize(captionText, { ALLOWED_TAGS: [] });

  return (
    <>
    <article
      onClick={onCardClick}
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={
        onCardClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCardClick(e);
              }
            }
          : undefined
      }
      aria-label={onCardClick ? "View full post" : undefined}
      className={`group bg-white rounded-2xl border border-sand shadow-warm-md hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${
        onCardClick ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-clay focus:ring-offset-2" : ""
      } ${className}`}
    >
      {/* Author Row (Header) */}
      {showAuthor && (
        <div className="p-4 flex items-center justify-between border-b border-sand-light bg-white">
          <div
            onClick={(e) => {
              if (onAuthorClick && authorId) {
                e.stopPropagation();
                onAuthorClick(authorId);
              }
            }}
            className={`flex items-center gap-3 ${onAuthorClick && authorId ? "cursor-pointer group/author" : ""}`}
          >
            <div className="h-10 w-10 rounded-full bg-sand-light border border-sand text-ink flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-heading font-semibold text-ink text-base group-hover/author:text-clay transition-colors truncate">
                  {authorName}
                </span>
                {userType && <UserBadge userType={userType} />}
                {isVet && (
                  <span className="px-2 py-0.5 bg-sand-light text-clay text-xs rounded-full font-body font-medium">
                    Veterinarian
                  </span>
                )}
              </div>
              {createdAt && (
                <span className="text-xs text-ink-soft/70 font-body block">
                  {createdAt}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Container */}
      <div className={`relative overflow-hidden bg-sand-light flex items-center justify-center ${showImageGallery ? "min-h-[220px] max-h-[min(60vh,520px)]" : "aspect-[4/3]"}`}>
        {displayedImageUrl ? (
          <img
            src={displayedImageUrl}
            alt={`${captionText || "Pet Post"}${showImageGallery && imageSources.length > 1 ? ` (${currentImageIndex + 1}/${imageSources.length})` : ""}`}
            className={`h-full w-full ${showImageGallery ? "max-h-[min(60vh,520px)] object-contain" : "object-cover transition-transform duration-500 group-hover:scale-105"}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-soft/50 p-6 text-center">
            <UserCircle className="h-12 w-12 stroke-1 mb-1" />
            <span className="text-xs font-body">No image attached</span>
          </div>
        )}

        {showImageGallery && imageSources.length > 1 && (
          <>
            <button type="button" onClick={(event) => { event.stopPropagation(); setCurrentImageIndex((index) => (index - 1 + imageSources.length) % imageSources.length); }} aria-label="Previous image" className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffaf5]/90 text-ink shadow-warm-sm hover:bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); setCurrentImageIndex((index) => Math.min(index + 1, imageSources.length - 1)); }} disabled={currentImageIndex === imageSources.length - 1} aria-label="Next image" className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffaf5]/90 text-ink shadow-warm-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4E3B31]/85 px-2.5 py-1 text-xs font-medium text-white">
              {currentImageIndex + 1} / {imageSources.length}
            </div>
          </>
        )}

        {/* Soft Dark Gradient on bottom third for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#6B4A38]/35 via-transparent to-transparent pointer-events-none" />

        {/* Floating Actions (frosted-white circular buttons on hover/focus for post owner) */}
        {isOwner && !isEditing && (
          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10">
            {onEditSave && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-md shadow-warm-sm text-ink hover:bg-white hover:text-clay hover:scale-105 transition-all"
                aria-label="Edit post"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDeletePost && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePost(post._id);
                }}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-md shadow-warm-sm text-like hover:bg-like hover:text-white hover:scale-105 transition-all"
                aria-label="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <>
            {/* Caption */}
            {sanitizedCaption && (
              <p
                className="text-ink font-body text-sm md:text-base leading-relaxed break-words"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {sanitizedCaption}
              </p>
            )}

            {/* Meta Row & Action Bar */}
            <div className="pt-3 border-t border-sand-light flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Like Pill Badge Button */}
                <button
                  type="button"
                  onClick={handleLikeClick}
                  className={`inline-flex items-center gap-1.5 bg-sand-light hover:bg-sand/60 px-3.5 py-1.5 rounded-full text-xs font-body font-semibold text-ink transition-all ${
                    heartAnimating ? "animate-heartPop" : ""
                  }`}
                  aria-label={isLiked ? "Unlike post" : "Like post"}
                >
                  <Heart
                    className={`h-4 w-4 text-like transition-transform duration-200 ${
                      isLiked ? "fill-like text-like" : "fill-transparent text-like hover:scale-110"
                    }`}
                  />
                  <span>{likeCount}</span>
                </button>

                {/* Comment Pill Badge Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCommentsOpen(!commentsOpen);
                  }}
                  className="inline-flex items-center gap-1.5 bg-sand-light hover:bg-sand/60 px-3.5 py-1.5 rounded-full text-xs font-body font-semibold text-ink transition-all"
                >
                  <MessageCircle className="h-4 w-4 text-ink-soft" />
                  <span>{comments.length}</span>
                </button>
                <ShareLinkButton resourceType="post" resourceId={post._id} onShareCount={(shareCount) => onShareCount?.(post._id, shareCount)} />
              </div>

              {/* View/Hide Comments Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentsOpen(!commentsOpen);
                }}
                className="inline-flex items-center gap-1 text-xs font-body font-medium text-clay hover:text-clay-deep transition-colors"
              >
                <span>{commentsOpen ? "Hide comments" : "Comments"}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    commentsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Comments Drawer */}
            {commentsOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-3 pt-3 border-t border-sand-light space-y-3"
              >
                {/* Comments List */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {comments && comments.length > 0 ? (
                    (() => {
                      const rootComments = comments.filter((c) => !c.parentCommentId);
                      return rootComments.map((comment, idx) => {
                        const commentAuthor = typeof comment === "string" ? "User" : comment.userId?.username || comment.user?.username || comment.author || "Anonymous";
                        const commentTextContent = typeof comment === "string" ? comment : comment.content || comment.text || "";
                        const commentId = comment._id || comment.id || idx;
                        const commentOwnerId = comment.userId?._id || comment.userId?.id || comment.userId || comment.user?._id || comment.user?.id;
                        const canDeleteComment = onDeleteComment && (isOwner || (currentUserId && commentOwnerId && currentUserId === commentOwnerId));
                        
                        const replies = comments.filter((c) => String(c.parentCommentId) === String(commentId));

                        return (
                          <div key={commentId} className="flex flex-col gap-2">
                            {/* Root Comment */}
                            <div className="bg-sand-light p-3 rounded-2xl flex items-start gap-2.5 text-xs font-body group/comment relative">
                              <div className="h-7 w-7 rounded-full bg-clay/20 text-clay flex items-center justify-center font-bold flex-shrink-0 text-xs">
                                {commentAuthor.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-ink">{commentAuthor}</span>
                                </div>
                                <p className="text-ink-soft mt-0.5 break-words">{commentTextContent}</p>
                                <div className="mt-1.5 flex items-center gap-3">
                                  {onCommentSubmit && (
                                    <button
                                      type="button"
                                      onClick={() => setReplyingTo({ id: commentId, username: commentAuthor })}
                                      className="text-[10px] font-semibold text-ink-soft/70 hover:text-clay transition-colors uppercase tracking-wider"
                                    >
                                      Reply
                                    </button>
                                  )}
                                  {canDeleteComment && (
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirm({ postId: post._id, commentId })}
                                      className="text-ink-soft/50 hover:text-like transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider"
                                    >
                                      <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Nested Replies */}
                            {replies.length > 0 && (
                              <div className="pl-9 space-y-2 relative before:absolute before:left-[18px] before:top-[-10px] before:bottom-3 before:w-px before:bg-sand">
                                {replies.map((reply, rIdx) => {
                                  const replyAuthor = typeof reply === "string" ? "User" : reply.userId?.username || reply.user?.username || reply.author || "Anonymous";
                                  const replyTextContent = typeof reply === "string" ? reply : reply.content || reply.text || "";
                                  const replyId = reply._id || reply.id || rIdx;
                                  const replyOwnerId = reply.userId?._id || reply.userId?.id || reply.userId || reply.user?._id || reply.user?.id;
                                  const canDeleteReply = onDeleteComment && (isOwner || (currentUserId && replyOwnerId && currentUserId === replyOwnerId));
                                  
                                  return (
                                    <div key={replyId} className="bg-sand-light/60 p-2.5 rounded-xl flex items-start gap-2 text-xs font-body relative before:absolute before:left-[-18px] before:top-4 before:h-px before:w-3 before:bg-sand">
                                      <div className="h-6 w-6 rounded-full bg-clay/20 text-clay flex items-center justify-center font-bold flex-shrink-0 text-[10px]">
                                        {replyAuthor.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-ink">{replyAuthor}</span>
                                        </div>
                                        <p className="text-ink-soft mt-0.5 break-words">{replyTextContent}</p>
                                        <div className="mt-1.5 flex items-center gap-3">
                                          {canDeleteReply && (
                                            <button
                                              type="button"
                                              onClick={() => setDeleteConfirm({ postId: post._id, commentId: replyId })}
                                              className="text-ink-soft/50 hover:text-like transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider"
                                            >
                                              <Trash2 className="h-2.5 w-2.5" /> Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="p-4 text-center bg-sand-light/50 rounded-2xl border border-dashed border-sand">
                      <p className="text-xs font-body italic text-ink-soft">
                        No comments yet — be the first
                      </p>
                    </div>
                  )}
                </div>

                {/* New Comment Input Form */}
                {onCommentSubmit && (
                  <div className="pt-2 flex flex-col gap-2">
                    {replyingTo && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-clay/10 rounded-lg text-xs font-body">
                        <span className="text-clay font-medium">Replying to @{replyingTo.username}</span>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-ink-soft/60 hover:text-ink transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <form
                      onSubmit={handleCommentFormSubmit}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                        className="flex-1 bg-sand-light border border-sand rounded-full px-4 py-2 text-xs font-body text-ink placeholder:text-ink-soft/50 focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="h-8 w-8 rounded-full bg-clay text-cream hover:bg-clay-deep disabled:opacity-40 disabled:hover:bg-clay flex items-center justify-center transition-colors flex-shrink-0"
                        aria-label="Send comment"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
      </div>
    </article>

    {/* Edit Post Modal */}
    {isEditing && createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#6B4A38]/40 backdrop-blur-sm px-4"
        onClick={handleCancelEdit}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="box-border w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-sand bg-white p-6 shadow-warm-lg sm:p-7 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <form onSubmit={handleSaveEditSubmit} className="space-y-3">
            <h4 className="text-base font-heading font-bold text-ink border-b border-sand pb-3">
              Edit Post
            </h4>

            {/* Image previews + replace control */}
            <div className="space-y-3">
              <div className="grid w-full grid-cols-2 gap-3 rounded-lg border border-[#bca18a] bg-white p-3 sm:grid-cols-3">
                {editImagePreviews.length > 0 ? (
                  editImagePreviews.map((preview, index) => (
                    <div key={`${preview}-${index}`} className="group/edit-image relative aspect-square overflow-hidden rounded-lg border border-[#bca18a] bg-[#f7f4f0]">
                      <img src={preview} alt={`Photo ${index + 1}`} className="h-full w-full object-contain" />
                      {editImageFiles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditImage(index)}
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#4E3B31]/80 text-white opacity-0 transition-opacity group-hover/edit-image:opacity-100 focus:opacity-100"
                          aria-label={`Remove photo ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex min-h-32 items-center justify-center text-ink-soft/50">
                    <UserCircle className="h-10 w-10 stroke-1" />
                  </div>
                )}
              </div>
              <label className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#bca18a] bg-[#f7f4f0] px-4 py-4 text-sm font-body font-semibold text-[#6b493d] transition-colors hover:bg-[#f3ede7]">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="sr-only"
                />
                <Upload className="h-4 w-4" />
                <span>{editImagesChanged ? "Add more photos" : "Choose photos"}</span>
              </label>
              <div className="flex items-center justify-between gap-3 text-xs text-[#6b493d]">
                <span>{editImageFiles.length > 0 ? `${editImageFiles.length} photo${editImageFiles.length === 1 ? "" : "s"} selected` : `${editImagePreviews.length} current photo${editImagePreviews.length === 1 ? "" : "s"}`}</span>
                {editImagesChanged && editImageFiles.length > 0 && (
                  <button type="button" onClick={handleRemoveAllEditImages} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" /> Remove all
                  </button>
                )}
              </div>
              <p className="flex items-center gap-1 text-xs text-[#bca18a]"><Upload className="h-3.5 w-3.5" /> Add photos one at a time or select several together. Up to 5MB each.</p>
              {editImagesChanged && editImageFiles.length === 0 && (
                <p className="text-xs font-medium text-red-600">Choose at least one photo before saving.</p>
              )}
              {editImageError && <p className="text-xs font-medium text-red-600">{editImageError}</p>}
            </div>

            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full rounded-xl border border-sand bg-sand-light text-ink focus:border-clay focus:ring-2 focus:ring-clay/20 resize-none p-3 font-body text-sm"
              rows={3}
              placeholder="Write a caption..."
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg border border-sand text-ink-soft hover:bg-sand-light text-xs font-body transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || (editImagesChanged && editImageFiles.length === 0)}
                className="px-4 py-1.5 rounded-lg bg-clay text-cream hover:bg-clay-deep text-xs font-body font-medium transition-colors flex items-center gap-1.5 shadow-warm-sm"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}

    {/* Delete Comment Confirmation Modal */}
    {deleteConfirm && createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#6B4A38]/40 backdrop-blur-sm px-4"
        onClick={() => setDeleteConfirm(null)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl border border-sand bg-white p-6 shadow-warm-lg animate-[fadeScaleIn_0.2s_ease-out]"
          style={{ animation: 'fadeScaleIn 0.2s ease-out' }}
        >
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>

          <h4 className="text-center text-base font-heading font-bold text-ink">
            Delete Comment
          </h4>
          <p className="mt-2 text-center text-sm font-body text-ink-soft">
            Are you sure you want to delete this comment? This action cannot be undone.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="min-w-[90px] rounded-xl border border-sand px-4 py-2.5 text-sm font-body font-semibold text-ink hover:bg-sand-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteComment(deleteConfirm.postId, deleteConfirm.commentId);
                setDeleteConfirm(null);
              }}
              className="min-w-[90px] rounded-xl bg-red-500 px-4 py-2.5 text-sm font-body font-semibold text-white hover:bg-red-600 transition-colors shadow-warm-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default PostCard;