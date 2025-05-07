import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getPosts, commentOnPost, updateComment, deleteComment, addReaction, followUser } from "../api.js";
import { motion, AnimatePresence } from "framer-motion";
import { SunIcon, MoonIcon, PencilIcon, TrashIcon, HandThumbUpIcon, ChatBubbleLeftIcon, ShareIcon, HeartIcon, LinkIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FaWhatsapp, FaFacebook } from "react-icons/fa";

export default function Home() {
  const {
    user,
    theme,
    login,
    register,
    showAuthForm,
    setShowAuthForm,
    isLogin,
    setIsLogin,
    logout,
  } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComments, setNewComments] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [showReactions, setShowReactions] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedTag, setSelectedTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      if (!user?.token) {
        throw new Error("No authentication token found. Please log in.");
      }
      const postsData = await getPosts(user.token);
      setPosts(postsData);
      setFilteredPosts(postsData);
    } catch (err) {
      console.error("Failed to load posts:", err);
      if (err.response?.status === 401) {
        logout();
        setShowAuthForm(true);
        setIsLogin(true);
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load posts. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    } else {
      setPosts([]);
      setFilteredPosts([]);
    }
  }, [user]);

  const getUniqueTags = () => {
    const allTags = posts.flatMap((post) => (post.tags ? post.tags.split(",").map((tag) => tag.trim()) : []));
    return ["All", ...new Set(allTags)];
  };

  useEffect(() => {
    let result = posts;
    if (selectedTag !== "All") {
      result = result.filter((post) => post.tags && post.tags.split(",").map((tag) => tag.trim()).includes(selectedTag));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query)
      );
    }
    setFilteredPosts(result);
  }, [selectedTag, searchQuery, posts]);

  const handleCommentSubmit = async (postId) => {
    if (!user || !newComments[postId]?.trim()) return;
    try {
      const updatedPost = await commentOnPost(postId, newComments[postId], user.token);
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
      setNewComments({ ...newComments, [postId]: "" });
    } catch (err) {
      console.error("Failed to add comment:", err);
      if (err.response?.status === 401) {
        logout();
        setShowAuthForm(true);
        setIsLogin(true);
        setError("Session expired. Please log in again.");
      }
    }
  };

  const startEditingComment = (comment) => {
    if (!user || String(user.id) !== String(comment.user.id)) return;
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.text);
  };

  const handleCommentUpdate = async (postId, commentId) => {
    if (!user || !editedCommentText.trim()) return;
    try {
      const updatedPost = await updateComment(postId, commentId, editedCommentText, user.token);
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
      setEditingCommentId(null);
      setEditedCommentText("");
    } catch (err) {
      console.error("Failed to update comment:", err);
      if (err.response?.status === 401) {
        logout();
        setShowAuthForm(true);
        setIsLogin(true);
        setError("Session expired. Please log in again.");
      }
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    if (!user) return;
    try {
      await deleteComment(commentId, user.token);
      setPosts(posts.map((p) =>
        p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
      ));
      setEditingCommentId(null);
    } catch (err) {
      console.error("Failed to delete comment:", err);
      if (err.response?.status === 401) {
        logout();
        setShowAuthForm(true);
        setIsLogin(true);
        setError("Session expired. Please log in again.");
      }
    }
  };

  const toggleCommentSection = (postId) => {
    setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
  };

  const handleReaction = async (postId, reactionType) => {
    if (!user) return;
    try {
      const updatedPost = await addReaction(postId, reactionType, user.token);
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
    } catch (err) {
      console.error("Failed to add reaction:", err);
      if (err.response?.status === 401) {
        logout();
        setShowAuthForm(true);
        setIsLogin(true);
        setError("Session expired. Please log in again.");
      }
    }
    setShowReactions(null);
  };

  const handleFollowPost = async (postId, userId) => {
    if (!user) {
      setShowAuthForm(true);
      setIsLogin(true);
      return;
    }
    try {
      const updatedUser = await followUser(userId, user.token);
      setPosts(posts.map((p) =>
        p.id === postId ? { ...p, user: { ...p.user, followers: updatedUser.followers } } : p
      ));
      console.log(`Now following user ${userId}`);
    } catch (err) {
      console.error("Failed to follow user:", err);
      if (err.response?.status === 401) {
        logout();
        setShowAuthForm(true);
        setIsLogin(true);
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to follow user. Please try again.");
      }
    }
  };

  const toggleShareOptions = (postId) => {
    if (showShareOptions === postId) {
      setShowShareOptions(null);
    } else {
      setShowShareOptions(postId);
      setCopied(false);
      setTimeout(() => setShowShareOptions(null), 5000);
    }
  };

  const getPostUrl = (postId) => `http://localhost:3000/posts/${postId}`;

  const handleShare = (postId, platform) => {
    const url = getPostUrl(postId);
    const title = posts.find((p) => p.id === postId)?.title || "Check out this post!";
    switch (platform) {
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${url}`)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        break;
      default:
        break;
    }
    setShowShareOptions(null);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
      setUsername("");
      setPassword("");
      setError("");
    } catch (err) {
      console.error("Authentication error:", err.message);
      setError(err.message || "Authentication failed");
    }
  };

  const getReactionCount = (post, type) => post.reactions?.filter((r) => r.reactionType === type).length || 0;
  const hasUserReacted = (post, type) => post.reactions?.some((r) => r.userId === user?.id && r.reactionType === type);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3, ease: "easeIn" } },
  };

  return (
    <div className={``}>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative w-full h-screen flex items-center justify-center"
      >
        <motion.img
          src="/hero.jpg"
          alt="Inspire Creativity"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          onError={(e) => (e.target.src = "https://via.placeholder.com/1920x1080?text=Hero+Image+Not+Found")}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40 flex items-center justify-center">
          <div className="text-center text-white px-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-extrabold mb-4"
            >
              Inspire Creativity
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8"
            >
              Share your passion with the SkillSphere community.
            </motion.p>
            <motion.button
              onClick={() => {
                setShowAuthForm(true);
                setIsLogin(false);
              }}
              whileHover={{ scale: 1.05 }}
              className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold"
            >
              Start Teaching
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Why Teach Section */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Why Teach on SkillSphere?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Empower others with your knowledge and grow as a creator in a vibrant community.
          </p>
        </motion.div>
      </section>

      {/* Search and Filter */}
      <section className="px-6 py-8 sticky top-16 z-40 bg-opacity-90 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-4 items-center"
        >
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className={`w-full p-4 pl-12 rounded-lg border ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            <svg
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </motion.button>
            )}
          </div>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className={`w-48 p-4 rounded-lg border ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500`}
          >
            {getUniqueTags().map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </motion.div>
      </section>

      {/* Posts Grid */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <p className="text-center text-lg text-gray-600 dark:text-gray-400">Loading posts...</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-center text-lg text-gray-600 dark:text-gray-400">No posts found.</p>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={cardVariants}
                  whileHover="hover"
                  className={`rounded-xl shadow-lg p-6 ${theme === "dark" ? "bg-gray-800" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                >
                  {post.images && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {post.images.split(",").map((imageUrl, index) => (
                        <motion.img
                          key={index}
                          src={`http://localhost:8080${imageUrl.trim()}`}
                          alt={`${post.title} image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onError={(e) => (e.target.src = "/fallback-image.jpg")}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold">{post.title}</h3>
                    {user && user.id !== post.user?.id && (
                      <motion.button
                        onClick={() => handleFollowPost(post.id, post.user?.id)}
                        whileHover={{ scale: 1.1 }}
                        className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm"
                      >
                        Follow
                      </motion.button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    By: {post.user?.username || "Unknown"} • {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{post.content}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Followers: {post.user?.followers?.length || 0}
                  </p>
                  {post.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.split(",").map((tag, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-1 rounded-full ${theme === "dark" ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-800"}`}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-4">
                    <div
                      className="relative"
                      onMouseEnter={() => setShowReactions(post.id)}
                      onMouseLeave={() => setShowReactions(null)}
                    >
                      <motion.button
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                        whileHover={{ scale: 1.1 }}
                      >
                        <HandThumbUpIcon className="h-5 w-5" />
                        <span>{post.reactions?.length || 0}</span>
                      </motion.button>
                      <AnimatePresence>
                        {showReactions === post.id && user && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: -50 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`absolute flex gap-2 p-2 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-white"} shadow-lg`}
                          >
                            <motion.button
                              onClick={() => handleReaction(post.id, "LIKE")}
                              whileHover={{ scale: 1.2 }}
                              className={hasUserReacted(post, "LIKE") ? "text-blue-500" : ""}
                            >
                              <HandThumbUpIcon className="h-6 w-6" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleReaction(post.id, "LOVE")}
                              whileHover={{ scale: 1.2 }}
                              className={hasUserReacted(post, "LOVE") ? "text-red-500" : ""}
                            >
                              <HeartIcon className="h-6 w-6" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Likes: {getReactionCount(post, "LIKE")}</span>
                      <span>Loves: {getReactionCount(post, "LOVE")}</span>
                    </div>
                    <motion.button
                      onClick={() => toggleCommentSection(post.id)}
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                    >
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                      <span>{post.comments?.length || 0}</span>
                    </motion.button>
                    <div className="relative">
                      <motion.button
                        onClick={() => toggleShareOptions(post.id)}
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                      >
                        <ShareIcon className="h-5 w-5" />
                        <span>Share</span>
                      </motion.button>
                      <AnimatePresence>
                        {showShareOptions === post.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: -70 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`absolute right-0 p-3 rounded-lg shadow-lg ${theme === "dark" ? "bg-gray-700" : "bg-white"}`}
                          >
                            <motion.button
                              onClick={() => handleShare(post.id, "whatsapp")}
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              <FaWhatsapp className="h-5 w-5 text-green-500" />
                              WhatsApp
                            </motion.button>
                            <motion.button
                              onClick={() => handleShare(post.id, "facebook")}
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              <FaFacebook className="h-5 w-5 text-blue-600" />
                              Facebook
                            </motion.button>
                            <motion.button
                              onClick={() => handleShare(post.id, "copy")}
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              <LinkIcon className="h-5 w-5" />
                              {copied ? "Copied!" : "Copy Link"}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <AnimatePresence>
                    {activeCommentPostId === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6"
                      >
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="py-3 border-t flex gap-4">
                            <div className={`w-10 h-10 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-gray-300"}`} />
                            <div className="flex-1">
                              {editingCommentId === comment.id ? (
                                <div className="flex flex-col gap-3">
                                  <textarea
                                    value={editedCommentText}
                                    onChange={(e) => setEditedCommentText(e.target.value)}
                                    className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <motion.button
                                      onClick={() => handleCommentUpdate(post.id, comment.id)}
                                      whileHover={{ scale: 1.05 }}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                                    >
                                      Update
                                    </motion.button>
                                    <motion.button
                                      onClick={() => setEditingCommentId(null)}
                                      whileHover={{ scale: 1.05 }}
                                      className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                                    >
                                      Cancel
                                    </motion.button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                                    {comment.user?.username} • {new Date(comment.createdAt).toLocaleString()}
                                  </p>
                                  <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mt-1`}>
                                    {comment.text}
                                  </p>
                                  {user && String(user.id) === String(comment.user.id) && (
                                    <div className="flex gap-2 mt-2">
                                      <motion.button
                                        onClick={() => startEditingComment(comment)}
                                        whileHover={{ scale: 1.1 }}
                                        className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-700 text-blue-400" : "bg-gray-200 text-blue-600"}`}
                                      >
                                        <PencilIcon className="h-5 w-5" />
                                      </motion.button>
                                      <motion.button
                                        onClick={() => handleCommentDelete(post.id, comment.id)}
                                        whileHover={{ scale: 1.1 }}
                                        className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-700 text-red-400" : "bg-gray-200 text-red-600"}`}
                                      >
                                        <TrashIcon className="h-5 w-5" />
                                      </motion.button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        {user ? (
                          <div className="mt-4 flex gap-3 items-center">
                            <ChatBubbleLeftIcon className={`h-5 w-5 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                            <input
                              value={newComments[post.id] || ""}
                              onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                              placeholder="Add a comment..."
                              className={`flex-1 p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                            />
                            <motion.button
                              onClick={() => handleCommentSubmit(post.id)}
                              whileHover={{ scale: 1.05 }}
                              className="px-5 py-2 bg-purple-600 text-white rounded-lg"
                            >
                              Post
                            </motion.button>
                          </div>
                        ) : (
                          <p className={`text-center text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            Please{" "}
                            <button
                              onClick={() => {
                                setShowAuthForm(true);
                                setIsLogin(true);
                              }}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              login
                            </button>{" "}
                            to comment.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`w-full max-w-md p-8 rounded-xl ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"} shadow-2xl`}
            >
              <h2 className="text-3xl font-bold mb-6 text-center">
                {isLogin ? "Welcome Back" : "Join SkillSphere"}
              </h2>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-center mb-4"
                >
                  {error}
                </motion.p>
              )}
              <form onSubmit={handleAuthSubmit} className="space-y-6">
                <motion.input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className={`w-full p-4 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-200 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                <motion.input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full p-4 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-200 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  whileFocus={{ scale: 1.02 }}
                  required
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold"
                >
                  {isLogin ? "Login" : "Register"}
                </motion.button>
              </form>
              <motion.button
                onClick={() => setShowAuthForm(false)}
                whileHover={{ scale: 1.05 }}
                className="w-full mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-300"
              >
                Cancel
              </motion.button>
              <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? "Need an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="ml-1 text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-400"
                >
                  {isLogin ? "Register" : "Login"}
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}