import axios from "axios";

const API_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

const getAuthHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

export const getUserProfile = async (userId) => {
  const response = await api.get(`/profile/${userId}`);
  return response.data;
};

export const followUser = async (userId, token) => {
  const response = await api.post(`/users/${userId}/follow`, {}, getAuthHeaders(token));
  return response.data;
};

export const unfollowUser = async (userId, token) => {
  const response = await api.post(`/users/${userId}/unfollow`, {}, getAuthHeaders(token));
  return response.data;
};

export const getPosts = async (token) => {
  const response = await api.get("/posts", getAuthHeaders(token));
  return Array.isArray(response.data) ? response.data : [];
};

export const createPost = async (formData, token) => {
  const response = await api.post("/posts", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updatePost = async (postId, formData, token) => {
  const response = await api.put(`/posts/${postId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deletePost = async (postId, token) => {
  await api.delete(`/posts/${postId}`, getAuthHeaders(token));
  return true;
};

export const getPost = async (id) => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};

export const commentOnPost = async (postId, text, token) => {
  const response = await api.post(`/posts/${postId}/comments`, { text }, getAuthHeaders(token));
  return response.data;
};

export const updateComment = async (postId, commentId, text, token) => {
  const response = await api.put(
    `/posts/${postId}/comments/${commentId}`,
    { text },
    getAuthHeaders(token)
  );
  return response.data;
};

export const deleteComment = async (commentId, token) => {
  await api.delete(`/comments/${commentId}`, getAuthHeaders(token));
  return true;
};

export const addReaction = async (postId, reactionType, token) => {
  const response = await api.post(
    `/posts/${postId}/reactions`,
    { reactionType },
    getAuthHeaders(token)
  );
  return response.data;
};

export const createLearningPlan = async (data, token) => {
  try {
    const response = await axios.post(`${API_URL}/learning-plans`, data, getAuthHeaders(token));
    console.log("Created learning plan:", response.data);
    return response.data.learningPlan;
  } catch (error) {
    console.error("API Error:", error.response?.status, error.response?.data);
    throw error;
  }
};

export const getLearningPlans = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/learning-plans`, getAuthHeaders(token));
    console.log("Fetched user learning plans:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.status, error.response?.data);
    throw error;
  }
};

export const getAllLearningPlans = async (token, status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await axios.get(`${API_URL}/learning-plans/all`, {
      ...getAuthHeaders(token),
      params,
    });
    console.log(`Fetched all learning plans (status: ${status || 'all'}):`, response.data);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.status, error.response?.data);
    throw error;
  }
};

export const updateLearningPlan = async (id, data, token) => {
  try {
    const response = await axios.put(`${API_URL}/learning-plans/${id}`, data, getAuthHeaders(token));
    console.log("Updated learning plan:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.status, error.response?.data);
    throw error;
  }
};

export const updateLearningPlanStatus = async (id, status, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/learning-plans/${id}/status`,
      { status },
      getAuthHeaders(token)
    );
    console.log(`Updated learning plan status (ID: ${id}, Status: ${status}):`, response.data);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.status, error.response?.data);
    throw error;
  }
};

export const deleteLearningPlan = async (id, token) => {
  try {
    await axios.delete(`${API_URL}/learning-plans/${id}`, getAuthHeaders(token));
    console.log("Deleted learning plan:", id);
  } catch (error) {
    console.error("API Error:", error.response?.status, error.response?.data);
    throw error;
  }
};

export const uploadImage = async (formData, token) => {
  try {
    const response = await axios.post(`${API_URL}/uploads`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Uploaded image:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.status, error.response?.data);
    throw error;
  }
};