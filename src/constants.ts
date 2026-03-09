import { Category } from "./types";

export const CATEGORIES = Object.values(Category).sort();

export const MALAYSIA_STATES: Record<string, string[]> = {
  "Federal Territory": ["Kuala Lumpur", "Labuan", "Putrajaya"].sort(),
  "Johor": ["Batu Pahat", "Johor Bahru", "Kluang", "Kota Tinggi", "Kulai", "Mersing", "Muar", "Pontian", "Segamat", "Skudai", "Tangkak", "Tebrau"].sort(),
  "Kedah": ["Alor Setar", "Baling", "Gurun", "Jitra", "Kulim", "Kuala Kedah", "Langkawi", "Lunas", "Pendang", "Sik", "Sungai Petani", "Yan"].sort(),
  "Kelantan": ["Bachok", "Gua Musang", "Kuala Krai", "Kota Bharu", "Machang", "Pasir Mas", "Pasir Puteh", "Tanah Merah", "Tumpat"].sort(),
  "Melaka": ["Alor Gajah", "Ayer Keroh", "Jasin", "Masjid Tanah", "Melaka City"].sort(),
  "Negeri Sembilan": ["Bahau", "Kuala Pilah", "Nilai", "Port Dickson", "Rembau", "Seremban", "Tampin"].sort(),
  "Pahang": ["Bentong", "Bera", "Cameron Highlands", "Jerantut", "Kuantan", "Lipis", "Maran", "Pekan", "Raub", "Temerloh"].sort(),
  "Penang": ["Ayer Itam", "Balik Pulau", "Bayan Lepas", "Butterworth", "Bukit Mertajam", "George Town", "Kepala Batas", "Nibong Tebal", "Perai", "Simpang Ampat", "Sungai Jawi", "Tanjung Bungah"].sort(),
  "Perak": ["Bagan Serai", "Batu Gajah", "Ipoh", "Kampar", "Kuala Kangsar", "Lumut", "Manjung", "Parit Buntar", "Sitiawan", "Taiping", "Tanjung Malim", "Tapah", "Teluk Intan"].sort(),
  "Perlis": ["Arau", "Kangar", "Padang Besar"].sort(),
  "Sabah": ["Beaufort", "Keningau", "Kota Belud", "Kota Kinabalu", "Kota Marudu", "Kudat", "Lahad Datu", "Papar", "Ranau", "Sandakan", "Semporna", "Tawau"].sort(),
  "Sarawak": ["Bau", "Bintulu", "Kapit", "Kuching", "Lawas", "Limbang", "Miri", "Mukah", "Sarikei", "Sibu", "Sri Aman"].sort(),
  "Selangor": ["Ampang", "Bangi", "Cheras", "Dengkil", "Kajang", "Klang", "Kuala Selangor", "Petaling Jaya", "Puchong", "Rawang", "Sabak Bernam", "Semenyih", "Sepang", "Shah Alam", "Subang Jaya"].sort(),
  "Terengganu": ["Besut", "Dungun", "Kemaman", "Kuala Nerus", "Kuala Terengganu", "Marang", "Setiu"].sort()
};

export const STATES = Object.keys(MALAYSIA_STATES).sort();
