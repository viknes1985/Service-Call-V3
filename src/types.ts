export enum Category {
  ELECTRICAL = "Electrical related",
  PLUMBER = "Plumber",
  CONSTRUCTION = "Construction",
  ROOF_CLEANING = "Roof Cleaning",
  PAINTING = "Painting",
  CLEANING = "Cleaning",
  WELDING = "Welding",
  PLANTING = "Planting",
  CARPENTERING = "Carpentering",
  OTHERS = "Others"
}

export interface Service {
  id: string;
  state: string;
  town: string;
  category: Category;
  providerName: string;
  description: string;
  contactNumber: string;
  operatingHours: string;
  photoUrls?: string[];
  createdAt: number;
  createdBy: string;
  creatorName?: string;
  avgRating?: number;
  ratingCount?: number;
  userRating?: number;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
}
