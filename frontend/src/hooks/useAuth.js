import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '../api/auth.api.js';
import { useAuthStore } from '../stores/auth.store.js';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { user, setUser, clearUser, setLoading } = useAuthStore();

  const userQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await authApi.getMe();
        const userData = res.data?.user || res.user;
        setUser(userData);
        return userData;
      } catch (err) {
        clearUser();
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      const userData = data.data?.user || data.user;
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Welcome back to AssetOwl');
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    }
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Registration successful. Please log in with your credentials.');
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      toast.success('Signed out successfully');
    }
  });

  return {
    user,
    userQuery,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync
  };
};

export default useAuth;
