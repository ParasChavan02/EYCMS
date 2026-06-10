import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FeatureRequest, PaginatedResponse } from '../types';
import { featureRequestService } from '../services/ticketService';

export const useFeatureRequests = (page = 1, pageSize = 10) => {
  return useQuery<PaginatedResponse<FeatureRequest>>(
    ['feature-requests', page, pageSize],
    () => featureRequestService.getAllRequests(page, pageSize),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
    }
  );
};

export const useUpdateFeatureRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (params: { requestId: string; status: string; comments?: string }) =>
      featureRequestService.updateStatus(
        params.requestId,
        params.status,
        params.comments
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feature-requests');
      },
    }
  );
};

export const useVoteOnFeatureRequest = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (requestId: string) => featureRequestService.voteOnRequest(requestId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('feature-requests');
      },
    }
  );
};

