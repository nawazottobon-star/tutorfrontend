export interface CartItem {
  courseId: string;
  title: string;
  price: number;
  description?: string;
  instructor?: string;
  duration?: string;
  rating?: number;
  students?: number;
  level?: string;
  thumbnail?: string;
  addedAt?: string;
}

export interface CartResponse {
  items: CartItem[];
}
