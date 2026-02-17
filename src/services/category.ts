import { requests } from './api';
import { Category } from '../types/category';
import { ApiResponse } from '../types/ApiResponse';

export const CategoryAPI = {
    getCategoryTree: (): Promise<ApiResponse<Category[]>> => requests.get('category/tree'),
    getCategories: (): Promise<ApiResponse<Category[]>> => requests.get('category'),
    getRootCategories: (): Promise<ApiResponse<Category[]>> => requests.get('category/roots'),
    getCategoryById: (id: string): Promise<ApiResponse<Category>> => requests.get(`category/${id}`),
    getCategoriesByParent: (parentId?: string): Promise<ApiResponse<Category[]>> => {
        const url = parentId ? `category/by-parent?parentId=${parentId}` : 'category/by-parent';
        return requests.get(url);
    },
};


