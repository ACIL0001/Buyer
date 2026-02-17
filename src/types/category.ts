export interface Category {
  _id: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE' | string;
  description?: string;
  thumb?: {
    _id?: string;
    url?: string;
    filename?: string;
    fullUrl?: string;
  };
  children?: Category[];
}
