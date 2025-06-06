import api from '../../utils/axiosConfig';

const register = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

const login = async (userData) => {
  const response = await api.post('/login', userData);
  
  if (response.data && response.data.token) {
    const profileResponse = await api.get('/user', {
      headers: {
        Authorization: `Bearer ${response.data.token}`
      }
    });
    
    const completeUserData = {
      ...response.data,
      ...profileResponse.data
    };
    
    localStorage.setItem('user', JSON.stringify(completeUserData));
    return completeUserData;
  }
  
  localStorage.setItem('user', JSON.stringify(response.data));
  return response.data;
};

const logout = async () => {
  await api.post('/logout');
  localStorage.removeItem('user');
};

const getProfile = async () => {
  const response = await api.get('/user');
  
  if (response.data) {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const updatedUser = { ...user, ...response.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
  
  return response.data;
};

const updateProfile = async (userData) => {
  const response = await api.patch('/user', userData);
  
  if (response.data) {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const updatedUser = { ...user, ...response.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
  
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getProfile,
  updateProfile
};

export default authService;