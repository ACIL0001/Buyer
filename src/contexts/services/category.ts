import { requests } from './api';

export const CategoryAPI = {
    getCategoryTree: (): Promise<any> => requests.get('category/tree'),
    getCategories: (): Promise<any> => requests.get('category'),
    getRootCategories: (): Promise<any> => requests.get('category/roots'),
    getCategoryById: (id: string): Promise<any> => requests.get(`category/${id}`),
    getCategoriesByParent: (parentId?: string): Promise<any> => {
        const url = parentId ? `category/by-parent?parentId=${parentId}` : 'category/by-parent';
        return requests.get(url);
    },
};


