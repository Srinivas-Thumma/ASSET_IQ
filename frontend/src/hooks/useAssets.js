import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { assetApi } from '../api/asset.api.js';

export const useAssets = (params = null) => {
  const queryClient = useQueryClient();

  const queryKey = params ? ['assets', params] : ['assets'];

  const assetsQuery = useQuery({
    queryKey,
    queryFn: () => assetApi.getAssets(params || {}),
    staleTime: 1000 * 30, // 30s fresh cache
    gcTime: 1000 * 60 * 5
  });

  const myAssetsQuery = useQuery({
    queryKey: ['assets', 'my'],
    queryFn: () => assetApi.getMyAssets(),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5
  });

  const createAssetMutation = useMutation({
    mutationFn: (data) => assetApi.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset registered successfully');
    },
    onError: () => {
      toast.error('Failed to register asset');
    }
  });

  return {
    assets: assetsQuery.data || [],
    isLoading: assetsQuery.isLoading,
    myAssets: myAssetsQuery.data || [],
    isMyAssetsLoading: myAssetsQuery.isLoading,
    createAsset: createAssetMutation.mutateAsync,
    isCreating: createAssetMutation.isPending,
    refetch: assetsQuery.refetch,
    refetchMy: myAssetsQuery.refetch
  };
};

export const useMyAssets = () => {
  const query = useQuery({
    queryKey: ['assets', 'my'],
    queryFn: () => assetApi.getMyAssets(),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5
  });

  return {
    myAssets: query.data || [],
    isLoading: query.isLoading,
    isMyAssetsLoading: query.isLoading,
    refetch: query.refetch
  };
};

export const useCreateAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => assetApi.createAsset(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] })
  });
};

export default useAssets;
