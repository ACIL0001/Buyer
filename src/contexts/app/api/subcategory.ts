import { requests } from './utils';

interface SubCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const SubCategoryAPI = {
  getSubCategories: async (categoryId?: string): Promise<ApiResponse<SubCategory[]>> => {
    try {
      const url = categoryId ? `subcategory?category=${categoryId}` : 'subcategory';
      const res = await requests.get(url);
      if ('success' in res) {
        return res as ApiResponse<SubCategory[]>;
      }
      return {
        success: (res as any)?.status >= 200 && (res as any)?.status < 300,
        data: (res as any)?.data?.data ?? (res as any)?.data ?? [],
        message: (res as any)?.data?.message,
      } as ApiResponse<SubCategory[]>;
    } catch (error: unknown) {
      throw error;
    }
  },
};