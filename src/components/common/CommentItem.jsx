import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import commentsApi from "@/app/api/comments";

const CommentItem = ({ comment, isLogged, authUser, onReplySuccess }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const searchParams = useSearchParams();
  const highlightCommentId = searchParams.get("commentId");
  const commentRef = useRef(null);

  useEffect(() => {
    if (highlightCommentId && (highlightCommentId === comment._id) && commentRef.current) {
       commentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
       commentRef.current.style.backgroundColor = '#fff3cd'; // Highlight effect
       setTimeout(() => {
         if (commentRef.current) commentRef.current.style.backgroundColor = '#fff';
       }, 3000);
    }
  }, [highlightCommentId, comment._id]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await commentsApi.replyToComment(comment._id, replyText, authUser._id);
      setReplyText("");
      setShowReplyForm(false);
      if (onReplySuccess) onReplySuccess();
      toast.success("Réponse ajoutée !");
    } catch (err) {
      console.error("Error replying:", err);
      toast.error("Erreur lors de l'ajout de la réponse");
    }
    setSubmittingReply(false);
  };

  const DEFAULT_USER_AVATAR = "/assets/images/avatar.jpg";

  // Helper date formatter
  const formatDateHelper = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <li
      id={`comment-${comment._id}`}
      ref={commentRef}
      style={{
        marginBottom: "16px",
        padding: "16px",
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #eee",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        transition: "background-color 0.5s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <img
          src={comment.user?.photoURL || DEFAULT_USER_AVATAR}
          alt={comment.user?.companyName || comment.user?.fullName || "User"}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "1px solid #ddd",
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_USER_AVATAR;
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px"
            }}
          >
            <div>
                <span
                style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#333",
                    marginRight: "8px"
                }}
                >
                {comment.user?.companyName || comment.user?.entreprise || comment.user?.fullName || (comment.user?.firstName ? `${comment.user.firstName} ${comment.user.lastName}` : "Utilisateur")}
                </span>
                <small
                style={{
                    color: "#999",
                    fontSize: "12px",
                }}
                >
                {formatDateHelper(comment.createdAt)}
                </small>
            </div>
            
            {/* Reply Button */}
            {isLogged && (
                <button 
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#0063b1',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Répondre
                </button>
            )}
          </div>
          
          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "14px",
              color: "#555",
              lineHeight: "1.5",
            }}
          >
            {comment.comment}
          </p>

          {/* Reply Form */}
          {showReplyForm && (
            <div style={{ marginTop: "10px", marginBottom: "15px", paddingLeft: "20px", borderLeft: "2px solid #eee" }}>
                <form onSubmit={handleReplySubmit}>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Votre réponse..."
                        required
                        rows={2}
                        style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                            marginBottom: "8px",
                            fontSize: "13px"
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            type="submit"
                            disabled={submittingReply}
                            style={{
                                background: "#0063b1",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                cursor: submittingReply ? "not-allowed" : "pointer",
                            }}
                        >
                            {submittingReply ? "Envoi..." : "Envoyer"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowReplyForm(false)}
                            style={{
                                background: "#eee",
                                color: "#333",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                cursor: "pointer",
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <ul style={{ listStyle: "none", padding: "0 0 0 20px", marginTop: "10px", borderLeft: "2px solid #f0f0f0" }}>
              {comment.replies.map((reply) => (
                <CommentItem 
                    key={reply._id} 
                    comment={reply} 
                    isLogged={isLogged} 
                    authUser={authUser} 
                    onReplySuccess={onReplySuccess}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
};

export default CommentItem;
