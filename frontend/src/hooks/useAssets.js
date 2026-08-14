import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { assetApi } from '../api/asset.api.js';

export const useAssets = (params = null) => {
  const queryClient = useQueryClient();

  const queryKey = params ? ['assets', params] : ['assets'];

  const assetsQuery = useQuery({
    queryKey,
    queryFn: () => assetApi.getAssets(params || {})
  });

  const myAssetsQuery = useQuery({
    queryKey: ['assets', 'my'],
    queryFn: () => assetApi.getMyAssets()
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
    isCreating: createAssetMutation.isPending
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
